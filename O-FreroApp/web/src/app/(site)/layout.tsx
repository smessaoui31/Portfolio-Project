import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SiteActionBar } from "@/components/site/SiteActionBar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-fg focus:px-3 focus:py-2 focus:text-ember-ink"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" className="pb-action-bar flex-1">
        {children}
      </main>
      <Footer />
      <SiteActionBar />
    </div>
  );
}
