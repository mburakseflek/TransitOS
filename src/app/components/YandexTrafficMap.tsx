"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type YandexPoint = {
  title: string;
  latitude: number;
  longitude: number;
  order?: number;
};

type LoadState = "idle" | "loading" | "ready" | "fallback" | "error";

declare global {
  interface Window {
    ymaps?: any;
    __transitOSYandexMapsPromise?: Promise<any>;
  }
}

export function YandexTrafficMap({
  apiKey,
  title,
  center = [41.0438, 28.7768],
  zoom = 10,
  points = [],
  showRoute = false,
  fallbackEmbedUrl,
  className = ""
}: {
  apiKey?: string;
  title: string;
  center?: [number, number];
  zoom?: number;
  points?: YandexPoint[];
  showRoute?: boolean;
  fallbackEmbedUrl?: string;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [state, setState] = useState<LoadState>("idle");
  const centerLatitude = center[0];
  const centerLongitude = center[1];

  const cleanPoints = useMemo(() => {
    return points
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [points]);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      if (!mapRef.current) return;
      if (!apiKey) {
        setState(fallbackEmbedUrl ? "fallback" : "error");
        return;
      }

      setState("loading");
      try {
        const ymaps = await loadYandexMaps(apiKey);
        if (disposed || !mapRef.current) return;

        const safeCenter = cleanPoints[0]
          ? [cleanPoints[0].latitude, cleanPoints[0].longitude]
          : [centerLatitude, centerLongitude];

        const map = new ymaps.Map(
          mapRef.current,
          {
            center: safeCenter,
            zoom,
            controls: ["zoomControl", "typeSelector", "fullscreenControl"]
          },
          {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true
          }
        );

        const trafficControl = new ymaps.control.TrafficControl({
          state: {
            providerKey: "traffic#actual",
            trafficShown: true
          }
        });
        map.controls.add(trafficControl);

        if (cleanPoints.length > 1 && showRoute && ymaps.multiRouter?.MultiRoute) {
          const route = new ymaps.multiRouter.MultiRoute(
            {
              referencePoints: cleanPoints.map((point) => [point.latitude, point.longitude]),
              params: { routingMode: "auto" }
            },
            {
              boundsAutoApply: true,
              routeActiveStrokeColor: "#d71920",
              routeStrokeColor: "#17385f",
              routeStrokeWidth: 5,
              wayPointStartIconColor: "#17385f",
              wayPointFinishIconColor: "#d71920",
              viaPointIconRadius: 6
            }
          );
          map.geoObjects.add(route);
        } else {
          cleanPoints.forEach((point, index) => {
            const placemark = new ymaps.Placemark(
              [point.latitude, point.longitude],
              {
                balloonContent: point.title,
                iconCaption: `${point.order ?? index + 1}. ${point.title}`
              },
              {
                preset: "islands#redCircleDotIconWithCaption"
              }
            );
            map.geoObjects.add(placemark);
          });
          if (cleanPoints.length > 1) {
            map.setBounds(map.geoObjects.getBounds(), {
              checkZoomRange: true,
              zoomMargin: 42
            });
          }
        }

        mapInstanceRef.current = map;
        setState("ready");
      } catch {
        if (!disposed) setState(fallbackEmbedUrl ? "fallback" : "error");
      }
    }

    boot();

    return () => {
      disposed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey, centerLatitude, centerLongitude, cleanPoints, fallbackEmbedUrl, showRoute, zoom]);

  if (state === "fallback" && fallbackEmbedUrl) {
    return (
      <div className={`yandex-map-shell ${className}`}>
        <iframe loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={fallbackEmbedUrl} title={title} />
        <small className="yandex-map-note">Yandex trafik katmanı iframe ile gösteriliyor. API anahtarı eklenince SDK haritası aktif olur.</small>
      </div>
    );
  }

  return (
    <div className={`yandex-map-shell ${className}`} data-state={state}>
      <div ref={mapRef} className="yandex-map-canvas" aria-label={title} />
      {state === "loading" || state === "idle" ? <span className="yandex-map-state">Canlı trafik haritası yükleniyor...</span> : null}
      {state === "error" ? <span className="yandex-map-state error">Yandex trafik haritası açılamadı.</span> : null}
    </div>
  );
}

function loadYandexMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("browser-only"));
  if (window.ymaps?.ready) {
    return new Promise((resolve) => window.ymaps.ready(() => resolve(window.ymaps)));
  }
  if (window.__transitOSYandexMapsPromise) return window.__transitOSYandexMapsPromise;

  window.__transitOSYandexMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "transitos-yandex-maps-sdk";
    script.async = true;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=tr_TR`;
    script.onload = () => {
      if (!window.ymaps?.ready) {
        reject(new Error("Yandex Maps SDK hazir degil"));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps));
    };
    script.onerror = () => reject(new Error("Yandex Maps SDK yuklenemedi"));
    document.head.appendChild(script);
  });

  return window.__transitOSYandexMapsPromise;
}
