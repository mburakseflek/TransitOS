import type { Metadata } from "next";

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
      canonical: canonicalUrl
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
    category: "transportation"
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "TravelAgency"],
  name: "Şeflek Tur",
  legalName: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
  url: seflekSiteUrl,
  logo: `${seflekSiteUrl}/brand/seflek-logo-navy.png`,
  image: `${seflekSiteUrl}/og-image.jpg`,
  areaServed: [
    {
      "@type": "AdministrativeArea",
      name: "İstanbul"
    }
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "İstanbul",
    addressCountry: "TR"
  },
  serviceType: [
    "Personel Servisi",
    "Okul Servisi",
    "VIP Transfer",
    "Kurumsal Taşımacılık",
    "Organizasyon Taşımacılığı"
  ],
  knowsAbout: [
    "İstanbul personel servisi",
    "İstanbul okul servisi",
    "VIP transfer İstanbul",
    "Kurumsal servis planlama"
  ]
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
