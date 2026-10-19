import type { Metadata } from "next";
import type { SiteContent } from "@/lib/site-content";

export const seflekSiteUrl = "https://www.seflektur.com";

export const defaultSeflekTitle =
  "Şeflek Tur | İstanbul Personel Servisi, Okul Servisi ve VIP Transfer";

export const defaultSeflekDescription =
  "İstanbul'da personel taşımacılığı, okul servisi ve VIP transfer hizmetleri sunan Şeflek Tur; güvenli, konforlu ve zamanında ulaşım çözümleriyle kurumsal ve bireysel müşterilerine hizmet vermektedir.";

export const seflekKeywords = [
  "İstanbul personel servisi",
  "İstanbul okul servisi",
  "VIP transfer İstanbul",
  "İstanbul personel taşımacılığı",
  "Kurumsal servis",
  "Şeflek Tur",
  "kurumsal taşımacılık",
  "organizasyon taşımacılığı",
  "İstanbul servis firması"
];

type CorporateMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
};

export function createCorporateMetadata({
  title = defaultSeflekTitle,
  description = defaultSeflekDescription,
  path = "/",
  image = "/og-image.jpg"
}: CorporateMetadataInput = {}): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = new URL(canonicalPath, seflekSiteUrl).toString();

  return {
    metadataBase: new URL(seflekSiteUrl),
    title,
    description,
    keywords: seflekKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "tr-TR": canonicalUrl,
        "x-default": canonicalUrl
      }
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "Şeflek Tur",
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "Şeflek Tur İstanbul personel servisi, okul servisi ve VIP transfer hizmetleri"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    category: "transportation",
    creator: "Şeflek Tur",
    publisher: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_SITE_VERIFICATION,
      other: process.env.BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
        : undefined
    },
    other: {
      "geo.region": "TR-34",
      "geo.placename": "İstanbul"
    }
  };
}

const serviceNames = [
  "Personel Servisi",
  "Okul Servisi",
  "VIP Transfer",
  "Kurumsal Taşımacılık",
  "Turizm ve Organizasyon Taşımacılığı"
];

export function createOrganizationJsonLd(content: SiteContent) {
  const telephone = isPlaceholder(content.contactPhone) ? undefined : content.contactPhone;
  const email = isPlaceholder(content.contactEmail) ? undefined : content.contactEmail;
  const streetAddress = isPlaceholder(content.address) ? undefined : content.address;

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TravelAgency"],
    "@id": `${seflekSiteUrl}/#organization`,
    name: content.companyName || "Şeflek Tur",
    legalName: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
    description: content.companySummary,
    url: `${seflekSiteUrl}/seflektur`,
    logo: {
      "@type": "ImageObject",
      url: `${seflekSiteUrl}/brand/seflek-logo-navy.png`
    },
    image: `${seflekSiteUrl}/og-image.jpg`,
    telephone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality: "Esenyurt",
      addressRegion: "İstanbul",
      addressCountry: "TR"
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "İstanbul"
    },
    contactPoint: telephone || email ? {
      "@type": "ContactPoint",
      telephone,
      email,
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: "Turkish"
    } : undefined,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Şeflek Tur Ulaşım Hizmetleri",
      itemListElement: serviceNames.map((name) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name,
          areaServed: "İstanbul"
        }
      }))
    },
    knowsAbout: [
      "İstanbul personel servisi",
      "İstanbul okul servisi",
      "VIP transfer İstanbul",
      "Kurumsal servis ve güzergah planlama",
      "Yolcu taşımacılığı operasyon yönetimi"
    ]
  };
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${seflekSiteUrl}/#website`,
  url: `${seflekSiteUrl}/seflektur`,
  name: "Şeflek Tur",
  alternateName: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
  inLanguage: "tr-TR",
  publisher: { "@id": `${seflekSiteUrl}/#organization` }
};

export const corporateFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Şeflek Tur hangi taşımacılık hizmetlerini sunar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Şeflek Tur İstanbul'da personel servisi, okul servisi, VIP transfer, kurumsal taşımacılık ve organizasyon taşımacılığı hizmetleri sunar."
      }
    },
    {
      "@type": "Question",
      name: "İstanbul'da personel servisi hizmeti veriyor musunuz?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Evet. Şeflek Tur, İstanbul genelinde kurumlara özel personel taşımacılığı, güzergah planlama ve servis operasyon takibi sağlar."
      }
    },
    {
      "@type": "Question",
      name: "Okul servisi ve öğrenci taşımacılığı hizmeti alabilir miyim?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Şeflek Tur, güvenli sürüş, düzenli evrak kontrolü ve planlı operasyon yaklaşımıyla okul servisi ve öğrenci taşımacılığı hizmeti verir."
      }
    },
    {
      "@type": "Question",
      name: "VIP transfer hizmetiniz hangi araçlarla sağlanır?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VIP transfer hizmetlerinde Mercedes-Benz Vito, Volkswagen Transporter ve Mercedes-Benz E Serisi gibi konfor odaklı araçlar kullanılabilir."
      }
    },
    {
      "@type": "Question",
      name: "TransitOS ne işe yarar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TransitOS; araç, taşeron, proje, servis planı, hakediş, fatura ve operasyon raporlarını web tabanlı olarak takip etmek için kullanılan Şeflek Tur operasyon platformudur."
      }
    },
    {
      "@type": "Question",
      name: "Taşımacı başvurusu nasıl yapılır?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Şeflek Tur ile çalışmak isteyen taşımacılar web sitesindeki taşımacı başvuru formunu doldurarak değerlendirme sürecini başlatabilir."
      }
    }
  ]
};

export const corporateFaqItems = corporateFaqJsonLd.mainEntity.map((item) => ({
  question: item.name,
  answer: item.acceptedAnswer.text
}));

function isPlaceholder(value: string) {
  const normalized = value.trim();
  return !normalized || /\(000\)|000000|example\.com/i.test(normalized);
}
