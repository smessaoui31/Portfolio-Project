"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import { Link } from "next-view-transitions";
import Image from "next/image";
import Magnetic from "@/components/theme/ui/Magnetic";
import TiltCard from "@/components/theme/ui/TiltCard";
import KineticText from "@/components/theme/ui/KineticText";

type Preview = {
  src: string;
  alt: string;
  title: string;
  desc: string;
};

/* ---------------------- PIZZA USER EXPERIENCE ---------------------- */
const pizzaSlides: Preview[] = [
  {
    src: "/previews/site-home.png",
    alt: "Pizza menu homepage",
    title: "Explorez nos pizzas",
    desc: "Parcourez nos pizzas italiennes authentiques avec des ingrédients frais.",
  },
  {
    src: "/previews/customize-pizza.png",
    alt: "Customize your pizza",
    title: "Personnalisez votre pizza",
    desc: "Choisissez la cuisson et ajoutez des suppléments délicieux.",
  },
  {
    src: "/previews/cart.png",
    alt: "Pizza cart view",
    title: "Ajoutez au panier",
    desc: "Ajoutez votre pizza personnalisée au panier en un clic.",
  },
  {
    src: "/previews/checkout.png",
    alt: "Checkout process",
    title: "Paiement",
    desc: "Paiement fluide et sécurisé avec l&apos;intégration Stripe.",
  },
  {
    src: "/previews/payment-success.png",
    alt: "Order success",
    title: "Régalez-vous !",
    desc: "Confirmation instantanée — votre commande est en route.",
  },
];

/* ---------------------- ADMIN EXPERIENCE ---------------------- */
const adminSlides: Preview[] = [
  {
    src: "/previews/admin-dashboard.png",
    alt: "Admin dashboard",
    title: "Tableau de bord",
    desc: "Surveillez les ventes, commandes et tendances clients.",
  },
  {
    src: "/previews/admin-products.png",
    alt: "Admin product management",
    title: "Gérez les pizzas",
    desc: "Ajoutez des pizzas, mettez à jour les prix et la disponibilité.",
  },
  {
    src: "/previews/admin-orders.png",
    alt: "Order management",
    title: "Suivez les commandes",
    desc: "Mises à jour en temps réel de toutes les commandes entrantes.",
  },
  {
    src: "/previews/admin-payments.png",
    alt: "Payments view",
    title: "Aperçu paiements",
    desc: "Suivi sécurisé des paiements Stripe et analyses.",
  },
];

/* ---------------------- FEATURES ---------------------- */
const features = [
  {
    title: "Personnalisation totale",
    desc: "Créez votre pizza parfaite avec notre configurateur intuitif",
  },
  {
    title: "Four au feu de bois",
    desc: "Cuisson artisanale pour un goût authentique",
  },
  {
    title: "Paiement sécurisé",
    desc: "Intégration Stripe pour des transactions rapides et sûres",
  },
  {
    title: "100% Responsive",
    desc: "Commandez depuis n&apos;importe quel appareil",
  },
  {
    title: "Livraison rapide",
    desc: "Suivi en temps réel de votre commande",
  },
  {
    title: "Dashboard Admin",
    desc: "Gestion complète des commandes et produits",
  },
];

export default function LandingPage() {
  const [zoomed, setZoomed] = useState<Preview | null>(null);
  const [pauseUser, setPauseUser] = useState(false);
  const [pauseAdmin, setPauseAdmin] = useState(false);

  /* ---------------- AUTO-SCROLL CAROUSELS ---------------- */
  const userSliderRef = useRef<HTMLDivElement | null>(null);
  const adminSliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = 0;
    const scrollSpeed = 0.5; // pixels per frame at 60fps

    const animate = (timestamp: number) => {
      // Throttle to ~60fps (16.67ms per frame)
      if (timestamp - lastTimestamp < 16) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastTimestamp = timestamp;

      // Scroll user carousel
      if (!pauseUser && userSliderRef.current) {
        const el = userSliderRef.current;
        const maxScroll = el.scrollWidth - el.clientWidth;

        if (el.scrollLeft >= maxScroll - 1) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += scrollSpeed;
        }
      }

      // Scroll admin carousel
      if (!pauseAdmin && adminSliderRef.current) {
        const el = adminSliderRef.current;
        const maxScroll = el.scrollWidth - el.clientWidth;

        if (el.scrollLeft >= maxScroll - 1) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += scrollSpeed;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [pauseUser, pauseAdmin]);

  /* ---------------- ESC closes zoom ---------------- */
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  // Dupliquer les slides pour une boucle infinie (memoized to avoid re-creating on each render)
  const duplicatedPizzaSlides = useMemo(() => [...pizzaSlides, ...pizzaSlides], []);
  const duplicatedAdminSlides = useMemo(() => [...adminSlides, ...adminSlides], []);

  return (
    <main className="bg-background text-foreground relative overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
        {/* Background effects */}
        <div className="ambient-mesh" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left content */}
            <div className="space-y-6">
              <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                En ligne maintenant
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                <KineticText text="O'Frero Pizza" />
                <br />
                <span className="bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  <KineticText text="L'expérience pizza à la toulousaine" startDelay={2} />
                </span>
              </h1>

              <p className="text-lg text-foreground leading-relaxed max-w-xl">
                De la navigation aux pizzas jusqu&apos;à la commande personnalisée et au paiement sécurisé.
                Découvrez une expérience moderne et fluide.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div>
                  <div className="text-3xl font-bold text-foreground">20+</div>
                  <div className="text-sm text-muted-foreground">Pizzas artisanales</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground">Fait maison</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">⚡</div>
                  <div className="text-sm text-muted-foreground">Livraison rapide</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Magnetic>
                  <Link
                    href="/menu"
                    className="group relative inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:shadow-xl active:scale-100"
                  >
                    <span className="relative z-10">Voir le menu</span>
                    <span className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-neutral-100 to-white opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                  </Link>
                </Magnetic>

                <Magnetic strength={0.2}>
                  <Link
                    href="/admin"
                    className="glass inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                  >
                    Dashboard Admin
                  </Link>
                </Magnetic>

                <a
                  href="https://github.com/smessaoui31/Portfolio-Project"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm text-foreground backdrop-blur transition-all hover:text-foreground hover:bg-card/80"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>

            {/* Right preview */}
            <TiltCard className="relative group" maxTilt={6}>
              <div className="glass-strong relative rounded-3xl p-4 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-border/50 bg-background">
                  <Image
                    src="/previews/ofrero-pizza-logo.png"
                    alt="Pizza customization preview"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(min-width:1024px) 600px, 90vw"
                    priority
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-r from-neutral-500/20 via-neutral-400/10 to-neutral-500/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            </TiltCard>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Pourquoi choisir O&apos;Frero Pizza ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour commander vos pizzas préférées en toute simplicité
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[9rem]">
            {features.map((feature, i) => {
              // Layout bento : la 1re et la 4e carte prennent plus de place
              const spanClass =
                i === 0
                  ? "col-span-2 lg:col-span-2 lg:row-span-2"
                  : i === 3
                    ? "col-span-2 lg:col-span-2"
                    : "col-span-1";
              return (
                <TiltCard key={i} maxTilt={4} className={spanClass}>
                  <div
                    className="reveal group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card/40 p-5 backdrop-blur transition-colors duration-300 hover:bg-card/60"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/5 to-transparent opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* USER EXPERIENCE CAROUSEL */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="reveal text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Parcours de commande
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une démonstration fluide et automatisée du parcours complet.
              De la sélection au succès du paiement
            </p>
          </div>

          <div
            ref={userSliderRef}
            onMouseEnter={() => setPauseUser(true)}
            onMouseLeave={() => setPauseUser(false)}
            className="flex gap-6 overflow-x-hidden pb-6"
            style={{ willChange: "scroll-position" }}
          >
            {duplicatedPizzaSlides.map((p, idx) => (
              <PreviewCard key={`${p.src}-${idx}`} {...p} onZoom={() => setZoomed(p)} />
            ))}
          </div>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            Survolez pour mettre en pause
          </div>
        </div>
      </section>

      {/* ADMIN CAROUSEL */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="reveal text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Dashboard Administrateur
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gérez les pizzas, les commandes et les paiements avec un tableau de bord 
              épuré et intuitif
            </p>
          </div>

          <div
            ref={adminSliderRef}
            onMouseEnter={() => setPauseAdmin(true)}
            onMouseLeave={() => setPauseAdmin(false)}
            className="flex gap-6 overflow-x-hidden pb-6"
            style={{ willChange: "scroll-position" }}
          >
            {duplicatedAdminSlides.map((p, idx) => (
              <PreviewCard key={`${p.src}-${idx}`} {...p} onZoom={() => setZoomed(p)} />
            ))}
          </div>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            Survolez pour mettre en pause
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative border-t border-border py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Prêt à goûter l&apos;expérience O&apos;Frero Pizza ?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Découvrez, personnalisez et commandez, le tout dans une interface élégante
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Magnetic>
              <Link
                href="/menu"
                className="group relative inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-black shadow-xl transition-all hover:scale-105 active:scale-100"
              >
                <span className="relative z-10">Parcourir le menu</span>
                <span className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-neutral-100 to-white opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              </Link>
            </Magnetic>

            <Magnetic strength={0.2}>
              <Link
                href="/admin"
                className="glass inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-accent"
              >
                Dashboard Admin
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* ZOOM OVERLAY */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
          onClick={() => setZoomed(null)}
        >
          <button
            onClick={() => setZoomed(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-foreground backdrop-blur transition-all hover:bg-white/20"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative w-full max-w-6xl aspect-[16/9] rounded-2xl overflow-hidden border border-border shadow-2xl">
            <Image
              src={zoomed.src}
              alt={zoomed.alt}
              fill
              className="object-contain bg-background"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card/90 px-4 py-2 backdrop-blur">
            <p className="text-sm text-foreground font-medium">{zoomed.title}</p>
            <p className="text-xs text-muted-foreground">{zoomed.desc}</p>
          </div>
        </div>
      )}
    </main>
  );
}

/* PREVIEW CARD COMPONENT */
const PreviewCard = memo(function PreviewCard({
  src,
  alt,
  title,
  desc,
  onZoom,
}: {
  src: string;
  alt: string;
  title: string;
  desc: string;
  onZoom: () => void;
}) {
  return (
    <div
      onClick={onZoom}
      className="glass group relative flex-shrink-0 w-[340px] sm:w-[420px] lg:w-[500px] rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer overflow-hidden"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(min-width:1024px) 500px, 90vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute top-3 right-3 rounded-full bg-white/10 p-2 backdrop-blur opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-foreground font-semibold text-lg mb-1 group-hover:text-foreground transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
});