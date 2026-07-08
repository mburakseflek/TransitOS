import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, Image as ImageIcon, LayoutPanelTop } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await readSiteContent();
  const page = content.customPages.find((item) => item.slug === slug);

  if (!page) {
    return createCorporateMetadata({
      title: "Şeflek Tur",
      path: "/seflektur"
    });
  }

  return createCorporateMetadata({
    title: `${page.title} | Şeflek Tur`,
    description: page.summary,
    path: `/seflektur/sayfa/${page.slug}`,
    image: page.heroImageUrl || "/og-image.jpg"
  });
}

export default async function CustomContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await readSiteContent();
  const page = content.customPages.find((item) => item.slug === slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="Şeflek Tur"
        title={page.title}
        body={page.summary}
        imageUrl={page.heroImageUrl}
        imageAlt={page.title}
      />

      <section className="custom-block-grid">
        {page.blocks.map((block) => {
          const Icon = block.type === "image" ? ImageIcon : block.type === "card" ? LayoutPanelTop : FileText;
          return (
            <article className={`custom-block ${block.type === "image" ? "image-block" : ""} hover-card`} key={block.id}>
              {block.imageUrl ? <img src={block.imageUrl} alt={block.title} /> : null}
              <div>
                <Icon size={24} />
                <h2>{block.title}</h2>
                <p>{block.body}</p>
              </div>
            </article>
          );
        })}
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
