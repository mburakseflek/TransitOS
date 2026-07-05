"use client";

import Link from "next/link";
import type { ChangeEvent, PointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bus,
  FileText,
  Handshake,
  Headphones,
  Mail,
  MessageCircle,
  Plus,
  Route,
  Save,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";
import { notifyOperationFinish, notifyOperationStart } from "@/app/components/GlobalOperationOverlay";
import { saveSiteContent } from "@/app/site-actions";
import type { CompanyDetail, CustomPage, SiteBlock, SiteCard, SiteContent } from "@/lib/site-content";

type EditablePageKey =
  | "gateway"
  | "home"
  | "company"
  | "services"
  | "fleet"
  | "vip"
  | "privileges"
  | "references"
  | "transitos"
  | "mobile"
  | "applications"
  | `custom:${string}`;

type EditableCardKey = "services" | "fleet" | "vipFleet" | "privileges" | "references";
type CropPreset = "hero" | "card" | "logo";

const cropPresets: Record<CropPreset, { label: string; aspect: number; width: number; height: number }> = {
  hero: { label: "Geniş sayfa görseli", aspect: 16 / 9, width: 1800, height: 1013 },
  card: { label: "Kart görseli", aspect: 4 / 3, width: 1400, height: 1050 },
  logo: { label: "Logo alanı", aspect: 3 / 2, width: 1200, height: 800 }
};

function cardsToText(cards: SiteCard[]) {
  return cards.map((card) => [
    card.title,
    card.subtitle,
    card.body,
    card.imageUrl,
    card.meta ?? ""
  ].join(" | ")).join("\n");
}

function emptyCard(title = "Yeni içerik"): SiteCard {
  return {
    title,
    subtitle: "Alt başlık",
    body: "Bu alana açıklama metni yazın.",
    imageUrl: "",
    meta: "Yeni"
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyPage(): CustomPage {
  const id = makeId("sayfa");
  return {
    id,
    title: "Yeni Sayfa",
    slug: id,
    summary: "Bu sayfanın kısa açıklamasını yazın.",
    heroImageUrl: "",
    blocks: []
  };
}

function emptyBlock(type: SiteBlock["type"]): SiteBlock {
  return {
    id: makeId("blok"),
    type,
    title: type === "image" ? "Yeni Görsel Kutusu" : type === "card" ? "Yeni Pencere" : "Yeni Metin Kutusu",
    body: "Bu alana içerik yazın.",
    imageUrl: ""
  };
}

function emptyCompanyDetail(): CompanyDetail {
  return {
    id: makeId("kunye"),
    label: "Yeni Bilgi",
    value: "Bilgi metni",
    action: "none"
  };
}

function EditableText({
  value,
  onChange,
  className,
  multiline = false
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <span
      className={`inline-edit ${multiline ? "multi-line" : ""} ${className ?? ""}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => onChange(event.currentTarget.innerText.trim())}
    >
      {value}
    </span>
  );
}

function ImagePicker({
  imageUrl,
  title,
  onChange,
  cropPreset = "card"
}: {
  imageUrl: string;
  title: string;
  onChange: (url: string) => void;
  cropPreset?: CropPreset;
}) {
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cropPreviewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const liveOffsetRef = useRef({ x: 0, y: 0 });
  const preset = cropPresets[cropPreset];

  function openFilePicker() {
    if (!uploading) fileInputRef.current?.click();
  }

  function openCrop(file: File) {
    if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    setPendingImage({ file, url: URL.createObjectURL(file) });
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    liveOffsetRef.current = { x: 0, y: 0 };
  }

  function handleImageInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) openCrop(file);
    event.currentTarget.value = "";
  }

  function closeCrop() {
    if (uploading) return;
    if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    dragRef.current = null;
    setDragging(false);
    setPendingImage(null);
  }

  async function upload(file: File | Blob) {
    if (uploading) return;
    setUploading(true);
    notifyOperationStart("Görsel yükleniyor");
    const formData = new FormData();
    const extension = file.type === "image/png" ? "png" : "webp";
    formData.append("file", file instanceof File ? file : new File([file], `kirpilmis-gorsel.${extension}`, { type: file.type || "image/webp" }));
    try {
      const response = await fetch("/api/site/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (response.ok && result.url) {
        onChange(result.url);
      } else {
        window.alert(result.message ?? "Görsel yüklenemedi.");
      }
    } finally {
      setUploading(false);
      notifyOperationFinish();
    }
  }

  async function cropAndUpload() {
    const image = cropImageRef.current;
    const currentImage = pendingImage;
    if (!image || !currentImage || uploading) return;

    const preserveTransparency = cropPreset === "logo" && currentImage.file.type === "image/png";
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const context = canvas.getContext("2d");
    if (!context) return;

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const imageAspect = naturalWidth / naturalHeight;
    let sourceWidth = naturalWidth / zoom;
    let sourceHeight = sourceWidth / preset.aspect;
    if (imageAspect < preset.aspect) {
      sourceHeight = naturalHeight / zoom;
      sourceWidth = sourceHeight * preset.aspect;
    }

    const maxX = Math.max(0, naturalWidth - sourceWidth);
    const maxY = Math.max(0, naturalHeight - sourceHeight);
    const sourceX = clamp((maxX / 2) + (liveOffsetRef.current.x / 100) * (maxX / 2), 0, maxX);
    const sourceY = clamp((maxY / 2) + (liveOffsetRef.current.y / 100) * (maxY / 2), 0, maxY);

    if (!preserveTransparency) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await upload(blob);
      URL.revokeObjectURL(currentImage.url);
      setPendingImage(null);
    }, preserveTransparency ? "image/png" : "image/webp", 0.92);
  }

  function applyCropTransform(nextX = liveOffsetRef.current.x, nextY = liveOffsetRef.current.y, nextZoom = zoom) {
    const image = cropImageRef.current;
    if (!image) return;
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      image.style.transform = `translate3d(${-nextX * 0.45}%, ${-nextY * 0.45}%, 0) scale(${nextZoom})`;
      frameRef.current = null;
    });
  }

  function updateZoom(nextZoom: number) {
    setZoom(nextZoom);
    applyCropTransform(liveOffsetRef.current.x, liveOffsetRef.current.y, nextZoom);
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: liveOffsetRef.current.x,
      offsetY: liveOffsetRef.current.y
    };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / Math.max(1, bounds.width)) * 160;
    const deltaY = ((event.clientY - drag.startY) / Math.max(1, bounds.height)) * 160;
    const nextX = clamp(drag.offsetX - deltaX, -100, 100);
    const nextY = clamp(drag.offsetY - deltaY, -100, 100);
    liveOffsetRef.current = { x: nextX, y: nextY };
    applyCropTransform(nextX, nextY);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture can already be released by the browser during fast drags.
      }
    }
    setOffsetX(liveOffsetRef.current.x);
    setOffsetY(liveOffsetRef.current.y);
    dragRef.current = null;
    setDragging(false);
  }

  function resetCrop() {
    liveOffsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    applyCropTransform(0, 0, 1);
  }

  return (
    <>
      <button type="button" className="image-edit-zone image-edit-trigger" disabled={uploading} onClick={openFilePicker}>
        {imageUrl ? <img src={imageUrl} alt={title} /> : <span>Görsel seç</span>}
        <em><Upload size={16} /> {uploading ? "Yükleniyor" : "Görsel değiştir"}</em>
      </button>
      <input
        ref={fileInputRef}
        className="image-file-input"
        type="file"
        accept="image/*"
        onChange={handleImageInput}
      />

      {pendingImage ? (
        <div className="crop-modal-backdrop" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
          <div className="crop-window" role="dialog" aria-modal="true" aria-label="Görsel kırpma penceresi" onPointerDown={(event) => event.stopPropagation()}>
            <div className="crop-window-head">
              <div>
                <span className="new-eyebrow">Görsel kırpma</span>
                <h2>{preset.label}</h2>
                <p>{title} alanına uygun standart oranla hazırlanır.</p>
              </div>
              <button type="button" className="ghost" onClick={closeCrop}>Kapat</button>
            </div>
            <div className="crop-preview-shell">
              <div
                ref={cropPreviewRef}
                className={`crop-preview ${cropPreset === "logo" ? "transparent-preview" : ""} ${dragging ? "dragging" : ""}`}
                style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
                onPointerDown={beginDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <img
                  ref={cropImageRef}
                  src={pendingImage.url}
                  alt=""
                  style={{ transform: `translate3d(${-offsetX * 0.45}%, ${-offsetY * 0.45}%, 0) scale(${zoom})` }}
                  onLoad={() => applyCropTransform()}
                  draggable={false}
                />
              </div>
            </div>
            <div className="crop-controls">
              <label>Yakınlaştır<input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} /></label>
              <p>{cropPreset === "logo" && pendingImage.file.type === "image/png" ? "PNG logo/ikon şeffaflığı korunur. Görseli sürükleyerek kadrajı ayarlayın." : "Görselin üzerine basılı tutup sürükleyerek kadrajı ayarlayın."}</p>
            </div>
            <div className="crop-actions">
              <button type="button" className="new-secondary" onClick={resetCrop}>Sıfırla</button>
              <button type="button" className="new-primary" disabled={uploading} onClick={cropAndUpload}>{uploading ? "Yükleniyor" : "Kırp ve yükle"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

export function SiteEditorClient({
  initialContent,
  carriers,
  requests,
  saved
}: {
  initialContent: SiteContent;
  carriers: Record<string, string>[];
  requests: Record<string, string>[];
  saved: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [notice, setNotice] = useState(saved ? "Kaydedildi." : "");
  const [activePage, setActivePage] = useState<EditablePageKey>("home");

  function commit(next: SiteContent, message = "Düzenleme yapıldı. Değişikliklerin yayına alınması için Kaydet'e basın.") {
    setContent(next);
    setNotice(message);
  }

  function updateCards(key: EditableCardKey, cards: SiteCard[]) {
    commit({ ...content, [key]: cards });
  }

  function patchCard(key: EditableCardKey, index: number, patch: Partial<SiteCard>) {
    updateCards(key, content[key].map((card, cardIndex) => cardIndex === index ? { ...card, ...patch } : card));
  }

  function addCard(key: EditableCardKey, title: string) {
    updateCards(key, [...content[key], emptyCard(title)]);
  }

  function removeCard(key: EditableCardKey, index: number) {
    if (window.confirm("Bu içerik kaldırılacak. Devam edilsin mi?")) {
      updateCards(key, content[key].filter((_, cardIndex) => cardIndex !== index));
    }
  }

  function addCompanyDetail() {
    commit({ ...content, companyDetails: [...content.companyDetails, emptyCompanyDetail()] }, "Yeni künye kutucuğu eklendi. Kaydet'e basınca yayına alınır.");
  }

  function patchCompanyDetail(index: number, patch: Partial<CompanyDetail>) {
    commit({
      ...content,
      companyDetails: content.companyDetails.map((detail, detailIndex) => detailIndex === index ? { ...detail, ...patch } : detail)
    });
  }

  function removeCompanyDetail(index: number) {
    if (window.confirm("Bu künye kutucuğu kaldırılacak. Devam edilsin mi?")) {
      commit({
        ...content,
        companyDetails: content.companyDetails.filter((_, detailIndex) => detailIndex !== index)
      }, "Künye kutucuğu kaldırıldı. Değişikliği yayına almak için Kaydet'e basın.");
    }
  }

  function addPage() {
    const page = emptyPage();
    commit({ ...content, customPages: [...content.customPages, page] }, "Yeni sayfa eklendi. İçeriğini düzenleyip Kaydet'e basın.");
    setActivePage(`custom:${page.id}`);
  }

  function patchPage(pageId: string, patch: Partial<CustomPage>) {
    const nextPages = content.customPages.map((page) => {
      if (page.id !== pageId) return page;
      const next = { ...page, ...patch };
      if (patch.title && !patch.slug) next.slug = slugify(patch.title) || page.slug;
      if (patch.slug) next.slug = slugify(patch.slug) || page.slug;
      return next;
    });
    commit({ ...content, customPages: nextPages });
  }

  function removePage(pageId: string) {
    if (window.confirm("Bu özel sayfa kaldırılacak. Devam edilsin mi?")) {
      commit({ ...content, customPages: content.customPages.filter((page) => page.id !== pageId) }, "Sayfa kaldırıldı. Değişikliği yayına almak için Kaydet'e basın.");
      if (activePage === `custom:${pageId}`) {
        setActivePage("home");
      }
    }
  }

  function addBlock(pageId: string, type: SiteBlock["type"]) {
    const nextPages = content.customPages.map((page) => page.id === pageId
      ? { ...page, blocks: [...page.blocks, emptyBlock(type)] }
      : page
    );
    commit({ ...content, customPages: nextPages }, "Yeni içerik bloğu eklendi. Kaydet'e basınca yayına alınır.");
  }

  function patchBlock(pageId: string, blockIndex: number, patch: Partial<SiteBlock>) {
    const nextPages = content.customPages.map((page) => page.id === pageId
      ? { ...page, blocks: page.blocks.map((block, currentBlockIndex) => currentBlockIndex === blockIndex ? { ...block, ...patch } : block) }
      : page
    );
    commit({ ...content, customPages: nextPages });
  }

  function removeBlock(pageId: string, blockIndex: number) {
    if (window.confirm("Bu içerik bloğu kaldırılacak. Devam edilsin mi?")) {
      const nextPages = content.customPages.map((page) => page.id === pageId
        ? { ...page, blocks: page.blocks.filter((_, currentBlockIndex) => currentBlockIndex !== blockIndex) }
        : page
      );
      commit({ ...content, customPages: nextPages }, "İçerik bloğu kaldırıldı. Değişikliği yayına almak için Kaydet'e basın.");
    }
  }

  const activeCustomPage = activePage.startsWith("custom:")
    ? content.customPages.find((page) => page.id === activePage.replace("custom:", ""))
    : undefined;
  const whatsappPreviewNumber = normalizeWhatsAppNumber(content.whatsappNumber || content.contactPhone);

  return (
    <main className="live-edit-page">
      <form action={saveSiteContent}>
        <input type="hidden" name="companyName" value={content.companyName} />
        <input type="hidden" name="brandLine" value={content.brandLine} />
        <input type="hidden" name="heroTitle" value={content.heroTitle} />
        <input type="hidden" name="heroSubtitle" value={content.heroSubtitle} />
        <input type="hidden" name="gatewayImageUrl" value={content.gatewayImageUrl} />
        <input type="hidden" name="homeHeroImageUrl" value={content.homeHeroImageUrl} />
        <input type="hidden" name="fleetHeroImageUrl" value={content.fleetHeroImageUrl} />
        <input type="hidden" name="vipHeroImageUrl" value={content.vipHeroImageUrl} />
        <input type="hidden" name="companySummary" value={content.companySummary} />
        <input type="hidden" name="contactPhone" value={content.contactPhone} />
        <input type="hidden" name="contactEmail" value={content.contactEmail} />
        <input type="hidden" name="whatsappNumber" value={content.whatsappNumber} />
        <input type="hidden" name="address" value={content.address} />
        <input type="hidden" name="taxOffice" value={content.taxOffice} />
        <input type="hidden" name="taxNumber" value={content.taxNumber} />
        <textarea hidden readOnly name="companyDetails" value={JSON.stringify(content.companyDetails)} />
        <input type="hidden" name="transitosTitle" value={content.transitosTitle} />
        <input type="hidden" name="transitosBody" value={content.transitosBody} />
        <input type="hidden" name="mobileAppTitle" value={content.mobileAppTitle} />
        <input type="hidden" name="mobileAppBody" value={content.mobileAppBody} />
        <input type="hidden" name="mobileAppImageUrl" value={content.mobileAppImageUrl} />
        <textarea hidden readOnly name="fleet" value={cardsToText(content.fleet)} />
        <textarea hidden readOnly name="vipFleet" value={cardsToText(content.vipFleet)} />
        <textarea hidden readOnly name="services" value={cardsToText(content.services)} />
        <textarea hidden readOnly name="privileges" value={cardsToText(content.privileges)} />
        <textarea hidden readOnly name="references" value={cardsToText(content.references)} />
        <textarea hidden readOnly name="tickerItems" value={content.tickerItems.join("\n")} />
        <textarea hidden readOnly name="customPages" value={JSON.stringify(content.customPages)} />

        <header className="live-edit-toolbar">
          <Link className="navy-brand" href="/seflektur">
            <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
          </Link>
          <div>
            <span>{notice || "Canlı düzenleme modu"}</span>
            <Link className="ghost" href="/seflektur">Siteyi görüntüle</Link>
            <Link className="ghost" href="/site-admin/talepler">Başvuru talepleri</Link>
            <Link className="ghost" href="/transitos/dashboard">TransitOS paneli</Link>
            <button className="new-primary" type="submit"><Save size={17} /> Kaydet</button>
          </div>
        </header>

        <div className="page-editor-workspace">
          <aside className="page-editor-sidebar" aria-label="Düzenlenecek sayfalar">
            <div className="page-editor-sidebar-head">
              <span className="new-eyebrow">Sayfalar</span>
              <h2>Ayrı ayrı düzenle</h2>
              <p>Bir sayfa seçin, sağ tarafta sadece o sayfanın içerikleri açılsın.</p>
            </div>

            <div className="page-editor-nav">
              <PageNavButton active={activePage === "gateway"} title="Karşılama" subtitle="/" icon={<Sparkles size={18} />} onClick={() => setActivePage("gateway")} />
              <PageNavButton active={activePage === "home"} title="Ana sayfa" subtitle="/seflektur" icon={<Sparkles size={18} />} onClick={() => setActivePage("home")} />
              <PageNavButton active={activePage === "company"} title="Kurumsal & iletişim" subtitle="Künye, telefon, adres" icon={<Mail size={18} />} onClick={() => setActivePage("company")} />
              <PageNavButton active={activePage === "services"} title="Hizmetler" subtitle="/seflektur/hizmetler" icon={<Route size={18} />} onClick={() => setActivePage("services")} />
              <PageNavButton active={activePage === "fleet"} title="Filo" subtitle="/seflektur/filo" icon={<Bus size={18} />} onClick={() => setActivePage("fleet")} />
              <PageNavButton active={activePage === "vip"} title="VIP araçlar" subtitle="/seflektur/vip" icon={<Sparkles size={18} />} onClick={() => setActivePage("vip")} />
              <PageNavButton active={activePage === "privileges"} title="Ayrıcalıklar" subtitle="/seflektur/ayricaliklar" icon={<BadgeCheck size={18} />} onClick={() => setActivePage("privileges")} />
              <PageNavButton active={activePage === "references"} title="Referanslar" subtitle="/seflektur/referanslar" icon={<Handshake size={18} />} onClick={() => setActivePage("references")} />
              <PageNavButton active={activePage === "transitos"} title="TransitOS" subtitle="/seflektur/transitos" icon={<Headphones size={18} />} onClick={() => setActivePage("transitos")} />
              <PageNavButton active={activePage === "mobile"} title="Mobil App reklamı" subtitle="Ana sayfa ve TransitOS" icon={<ArrowRight size={18} />} onClick={() => setActivePage("mobile")} />
              <PageNavButton active={activePage === "applications"} title="Başvurular" subtitle="Form kayıtları" icon={<FileText size={18} />} onClick={() => setActivePage("applications")} />
            </div>

            <div className="page-editor-group">
              <div className="page-editor-group-title">
                <span>Özel sayfalar</span>
                <button type="button" onClick={addPage}><Plus size={15} /> Yeni</button>
              </div>
              {content.customPages.length ? (
                content.customPages.map((page) => (
                  <PageNavButton
                    active={activePage === `custom:${page.id}`}
                    title={page.title}
                    subtitle={`/seflektur/sayfa/${page.slug}`}
                    icon={<FileText size={18} />}
                    key={page.id}
                    onClick={() => setActivePage(`custom:${page.id}`)}
                  />
                ))
              ) : (
                <p className="page-editor-empty-note">Henüz özel sayfa yok.</p>
              )}
            </div>
          </aside>

          <div className="page-editor-canvas" key={activePage}>
            {activePage === "gateway" ? (
              <section className="editable-hero gateway-editor-hero">
                <div>
                  <EditableText value={content.brandLine} onChange={(value) => commit({ ...content, brandLine: value })} className="new-eyebrow" />
                  <h1>
                    <EditableText value={content.heroTitle} onChange={(value) => commit({ ...content, heroTitle: value })} />
                  </h1>
                  <p>
                    <EditableText multiline value={content.heroSubtitle} onChange={(value) => commit({ ...content, heroSubtitle: value })} />
                  </p>
                  <div className="new-hero-actions">
                    <span className="new-primary">TransitOS’a gir <ArrowRight size={18} /></span>
                    <span className="new-secondary">Kurumsal siteye gir</span>
                  </div>
                </div>
                <ImagePicker
                  imageUrl={content.gatewayImageUrl}
                  title="Karşılama arka plan görseli"
                  cropPreset="hero"
                  onChange={(url) => commit({ ...content, gatewayImageUrl: url })}
                />
              </section>
            ) : null}

            {activePage === "home" ? (
              <section className="editable-hero">
                <div>
                  <EditableText value="Şeflek Tur Turizm & Yolcu Taşımacılığı" onChange={() => undefined} className="new-eyebrow" />
                  <h1>
                    <EditableText value={content.heroTitle} onChange={(value) => commit({ ...content, heroTitle: value })} />
                  </h1>
                  <p>
                    <EditableText multiline value={content.heroSubtitle} onChange={(value) => commit({ ...content, heroSubtitle: value })} />
                  </p>
                  <div className="new-hero-actions">
                    <span className="new-primary">Hizmet talebi oluştur <ArrowRight size={18} /></span>
                    <span className="new-secondary">Taşımacı başvurusu</span>
                  </div>
                </div>
                <ImagePicker
                  imageUrl={content.homeHeroImageUrl}
                  title="Kurumsal ana sayfa hero görseli"
                  cropPreset="hero"
                  onChange={(url) => commit({ ...content, homeHeroImageUrl: url })}
                />
              </section>
            ) : null}

            {activePage === "company" ? (
              <section className="edit-section">
                <div className="section-title-block">
                  <span className="new-eyebrow">Kurumsal & iletişim</span>
                  <h2>Şirket künyesini ve iletişim bilgilerini düzenleyin.</h2>
                </div>
                <div className="company-preview-card">
                  <div>
                    <h2><EditableText value="Şirket künyesi ve çalışma yaklaşımı" onChange={() => undefined} /></h2>
                    <p><EditableText multiline value={content.companySummary} onChange={(value) => commit({ ...content, companySummary: value })} /></p>
                  </div>
                  <div className="company-info-list editable-company-info">
                    <div className="company-info-item"><dt>Telefon</dt><dd><EditableText value={content.contactPhone} onChange={(value) => commit({ ...content, contactPhone: value })} /></dd><small>Arama açar</small></div>
                    <div className="company-info-item"><dt>E-posta</dt><dd><EditableText value={content.contactEmail} onChange={(value) => commit({ ...content, contactEmail: value })} /></dd><small>E-posta açar</small></div>
                    <div className="company-info-item"><dt>Adres</dt><dd><EditableText value={content.address} onChange={(value) => commit({ ...content, address: value })} /></dd><small>Harita açar</small></div>
                    <div className="company-info-item"><dt>Vergi Dairesi</dt><dd><EditableText value={content.taxOffice} onChange={(value) => commit({ ...content, taxOffice: value })} /></dd></div>
                    <div className="company-info-item"><dt>Vergi No</dt><dd><EditableText value={content.taxNumber} onChange={(value) => commit({ ...content, taxNumber: value })} /></dd></div>
                    {content.companyDetails.map((detail, index) => (
                      <div className="company-info-item editable-extra-info" key={detail.id}>
                        <dt><EditableText value={detail.label} onChange={(value) => patchCompanyDetail(index, { label: value })} /></dt>
                        <dd><EditableText value={detail.value} onChange={(value) => patchCompanyDetail(index, { value })} /></dd>
                        <select value={detail.action} onChange={(event) => patchCompanyDetail(index, { action: event.target.value as CompanyDetail["action"] })}>
                          <option value="none">Düz bilgi</option>
                          <option value="phone">Telefon gibi aç</option>
                          <option value="email">E-posta gibi aç</option>
                          <option value="map">Harita gibi aç</option>
                        </select>
                        <button type="button" className="remove-inline" onClick={() => removeCompanyDetail(index)}><Trash2 size={15} /> Kaldır</button>
                      </div>
                    ))}
                    <button type="button" className="company-info-add" onClick={addCompanyDetail}><Plus size={16} /> Künye kutucuğu ekle</button>
                  </div>
                </div>
                <div className="whatsapp-admin-card hover-card">
                  <div className="whatsapp-admin-icon">
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <span className="new-eyebrow">WhatsApp hattı</span>
                    <h3>Site genelindeki WhatsApp butonunu buradan yönetin.</h3>
                    <p>Bu numara; ana sayfa, kurumsal sayfalar ve sabit WhatsApp butonunda kullanılacak bağlantıdır.</p>
                  </div>
                  <label>
                    <span>Bağlanacak numara</span>
                    <input
                      type="tel"
                      value={content.whatsappNumber}
                      placeholder="+90 (5xx) xxx xx xx"
                      onChange={(event) => commit({ ...content, whatsappNumber: event.target.value }, "WhatsApp numarası güncellendi. Kaydet'e basınca yayına alınır.")}
                    />
                    <small>Önerilen format: +90 (5xx) xxx xx xx</small>
                  </label>
                  <div className="whatsapp-admin-preview">
                    <span>Aktif bağlantı</span>
                    <code>{whatsappPreviewNumber ? `wa.me/${whatsappPreviewNumber}` : "Numara bekleniyor"}</code>
                    {whatsappPreviewNumber ? (
                      <a className="new-secondary" href={`https://wa.me/${whatsappPreviewNumber}`} target="_blank" rel="noreferrer">
                        Bağlantıyı test et <ArrowRight size={15} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {activePage === "services" ? (
              <EditableCardSection title="Hizmetler" icon={<Route size={24} />} cards={content.services} cardKey="services" addLabel="Yeni hizmet ekle" patchCard={patchCard} addCard={addCard} removeCard={removeCard} />
            ) : null}

            {activePage === "fleet" ? (
              <>
                <section className="edit-section hero-image-editor">
                  <div className="section-title-block">
                    <span className="new-eyebrow">Filo sayfası</span>
                    <h2>Sayfa ana görseli</h2>
                    <p>Bu görsel araç listesindeki ilk karttan bağımsızdır. Filo kartlarını düzenlemek ana görseli değiştirmez.</p>
                  </div>
                  <ImagePicker
                    imageUrl={content.fleetHeroImageUrl}
                    title="Filo sayfa ana görseli"
                    cropPreset="hero"
                    onChange={(url) => commit({ ...content, fleetHeroImageUrl: url })}
                  />
                </section>
                <EditableCardSection title="Filo" icon={<Bus size={24} />} cards={content.fleet} cardKey="fleet" addLabel="Yeni araç ekle" patchCard={patchCard} addCard={addCard} removeCard={removeCard} branded />
              </>
            ) : null}

            {activePage === "vip" ? (
              <>
                <section className="edit-section hero-image-editor">
                  <div className="section-title-block">
                    <span className="new-eyebrow">VIP sayfası</span>
                    <h2>Sayfa ana görseli</h2>
                    <p>Bu görsel VIP araç listesindeki ilk karttan bağımsızdır. VIP kartlarını düzenlemek ana görseli değiştirmez.</p>
                  </div>
                  <ImagePicker
                    imageUrl={content.vipHeroImageUrl}
                    title="VIP sayfa ana görseli"
                    cropPreset="hero"
                    onChange={(url) => commit({ ...content, vipHeroImageUrl: url })}
                  />
                </section>
                <EditableCardSection title="VIP araçlar" icon={<Sparkles size={24} />} cards={content.vipFleet} cardKey="vipFleet" addLabel="Yeni VIP araç ekle" patchCard={patchCard} addCard={addCard} removeCard={removeCard} />
              </>
            ) : null}

            {activePage === "privileges" ? (
              <EditableCardSection title="Ayrıcalıklar" icon={<BadgeCheck size={24} />} cards={content.privileges} cardKey="privileges" addLabel="Yeni ayrıcalık ekle" patchCard={patchCard} addCard={addCard} removeCard={removeCard} />
            ) : null}

            {activePage === "references" ? (
              <EditableCardSection title="Referanslar ve İş Ortakları" icon={<Handshake size={24} />} cards={content.references} cardKey="references" addLabel="Yeni iş ortağı ekle" patchCard={patchCard} addCard={addCard} removeCard={removeCard} logoMode />
            ) : null}

            {activePage === "transitos" ? (
              <section className="edit-section">
                <div className="page-cta-band">
                  <div>
                    <Headphones size={26} />
                    <h2><EditableText value={content.transitosTitle} onChange={(value) => commit({ ...content, transitosTitle: value })} /></h2>
                    <p><EditableText multiline value={content.transitosBody} onChange={(value) => commit({ ...content, transitosBody: value })} /></p>
                  </div>
                  <span className="new-primary">TransitOS’u incele <ArrowRight size={18} /></span>
                </div>
              </section>
            ) : null}

            {activePage === "mobile" ? (
              <section className="edit-section">
                <div className="mobile-app-promo hover-card">
                  <div>
                    <span className="new-eyebrow">TransitOS Mobile</span>
                    <h2><EditableText value={content.mobileAppTitle} onChange={(value) => commit({ ...content, mobileAppTitle: value })} /></h2>
                    <p><EditableText multiline value={content.mobileAppBody} onChange={(value) => commit({ ...content, mobileAppBody: value })} /></p>
                    <div className="store-badges">
                      <span>App Store</span>
                      <span>Google Play</span>
                    </div>
                  </div>
                  <ImagePicker imageUrl={content.mobileAppImageUrl} title={content.mobileAppTitle} cropPreset="hero" onChange={(url) => commit({ ...content, mobileAppImageUrl: url })} />
                </div>
              </section>
            ) : null}

            {activePage === "applications" ? (
              <section className="edit-section">
                <div className="section-title-block">
                  <span className="new-eyebrow">Başvurular</span>
                  <h2>Son gelen kayıtlar</h2>
                </div>
                <div className="admin-live-records">
                  {[...carriers.slice(0, 3), ...requests.slice(0, 3)].map((record, index) => (
                    <article className="hover-card" key={`${record.createdAt}-${index}`}>
                      <FileText size={20} />
                      <strong>{record.companyName || record.contactPerson || "Yeni kayıt"}</strong>
                      <span>{record.phone}</span>
                    </article>
                  ))}
                </div>
                <Link className="new-primary" href="/site-admin/talepler">Tüm başvuru taleplerini aç <ArrowRight size={16} /></Link>
              </section>
            ) : null}

            {activeCustomPage ? (
              <section className="edit-section">
                <article className="custom-page-editor hover-card">
                  <div className="custom-page-editor-head">
                    <div>
                      <span className="new-eyebrow">Özel sayfa</span>
                      <h3><EditableText value={activeCustomPage.title} onChange={(value) => patchPage(activeCustomPage.id, { title: value })} /></h3>
                      <p><EditableText multiline value={activeCustomPage.summary} onChange={(value) => patchPage(activeCustomPage.id, { summary: value })} /></p>
                    </div>
                    <button type="button" className="remove-inline" onClick={() => removePage(activeCustomPage.id)}><Trash2 size={15} /> Sayfayı kaldır</button>
                  </div>
                  <div className="custom-url-edit">
                    <span>Sayfa adresi</span>
                    <code>/seflektur/sayfa/</code>
                    <EditableText value={activeCustomPage.slug} onChange={(value) => patchPage(activeCustomPage.id, { slug: value })} />
                  </div>
                  <ImagePicker imageUrl={activeCustomPage.heroImageUrl} title={activeCustomPage.title} cropPreset="hero" onChange={(url) => patchPage(activeCustomPage.id, { heroImageUrl: url })} />
                  <div className="block-toolbar">
                    <button type="button" onClick={() => addBlock(activeCustomPage.id, "text")}>Metin kutusu ekle</button>
                    <button type="button" onClick={() => addBlock(activeCustomPage.id, "image")}>Görsel kutusu ekle</button>
                    <button type="button" onClick={() => addBlock(activeCustomPage.id, "card")}>Pencere ekle</button>
                  </div>
                  <div className="custom-block-grid editor-block-grid">
                    {activeCustomPage.blocks.map((block, blockIndex) => (
                      <article className={`custom-block ${block.type === "image" ? "image-block" : ""} hover-card`} key={block.id}>
                        {block.type !== "text" ? (
                          <ImagePicker imageUrl={block.imageUrl} title={block.title} cropPreset={block.type === "image" ? "hero" : "card"} onChange={(url) => patchBlock(activeCustomPage.id, blockIndex, { imageUrl: url })} />
                        ) : null}
                        <div>
                          <small>{block.type === "text" ? "Metin" : block.type === "image" ? "Görsel" : "Pencere"}</small>
                          <h2><EditableText value={block.title} onChange={(value) => patchBlock(activeCustomPage.id, blockIndex, { title: value })} /></h2>
                          <p><EditableText multiline value={block.body} onChange={(value) => patchBlock(activeCustomPage.id, blockIndex, { body: value })} /></p>
                          <button type="button" className="remove-inline" onClick={() => removeBlock(activeCustomPage.id, blockIndex)}><Trash2 size={15} /> Bloğu kaldır</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              </section>
            ) : null}
          </div>
        </div>
      </form>
    </main>
  );
}

function PageNavButton({
  active,
  title,
  subtitle,
  icon,
  onClick
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`page-editor-nav-button ${active ? "active" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{subtitle}</small>
    </button>
  );
}

function EditableCardSection({
  title,
  icon,
  cards,
  cardKey,
  addLabel,
  patchCard,
  addCard,
  removeCard,
  branded = false,
  logoMode = false
}: {
  title: string;
  icon: ReactNode;
  cards: SiteCard[];
  cardKey: EditableCardKey;
  addLabel: string;
  patchCard: (key: EditableCardKey, index: number, patch: Partial<SiteCard>) => void;
  addCard: (key: EditableCardKey, title: string) => void;
  removeCard: (key: EditableCardKey, index: number) => void;
  branded?: boolean;
  logoMode?: boolean;
}) {
  return (
    <section className="edit-section">
      <div className="edit-section-head">
        <div>
          <span className="new-eyebrow">{title}</span>
          <h2>{title} alanını doğrudan düzenleyin.</h2>
        </div>
        <button type="button" className="new-secondary" onClick={() => addCard(cardKey, `Yeni ${title}`)}><Plus size={16} /> {addLabel}</button>
      </div>
      <div className="editable-card-grid">
        {cards.map((card, index) => (
          <article className={`editable-content-card hover-card ${logoMode ? "editable-logo-card" : ""}`} key={`${card.title}-${index}`}>
            <ImagePicker imageUrl={card.imageUrl} title={card.title} cropPreset={logoMode ? "logo" : "card"} onChange={(url) => patchCard(cardKey, index, { imageUrl: url })} />
            {branded ? <span className="fleet-logo-decal edit-decal"><img src="/brand/seflek-logo-navy.png" alt="" /></span> : null}
            <div className="editable-card-body">
              <small>{icon}<EditableText value={card.meta ?? ""} onChange={(value) => patchCard(cardKey, index, { meta: value })} /></small>
              <h3><EditableText value={card.title} onChange={(value) => patchCard(cardKey, index, { title: value })} /></h3>
              <strong><EditableText value={card.subtitle} onChange={(value) => patchCard(cardKey, index, { subtitle: value })} /></strong>
              <p><EditableText multiline value={card.body} onChange={(value) => patchCard(cardKey, index, { body: value })} /></p>
              <button type="button" className="remove-inline" onClick={() => removeCard(cardKey, index)}><Trash2 size={15} /> Kaldır</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
