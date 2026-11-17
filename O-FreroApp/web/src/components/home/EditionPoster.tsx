"use client";

import Image from "next/image";
import { buttonClasses } from "@/components/ui/Button";
import { formatEuros } from "@/lib/money";
import { SITE } from "@/lib/site";
import type { MenuProduct } from "@/server/catalog";
import { Countdown } from "./Countdown";
import { useOpenProduct } from "./ProductSheetProvider";

export interface PosterEdition {
  number: number;
  numberLabel: string;
  monthsShort: string;
  monthsLong: string;
  endsAt: Date;
  serverNow: Date;
  dayIndex: number;
  totalDays: number;
  ratio: number;
}

/** The home poster: the pizza of the moment as a limited edition (or the house favorite between editions). */
export function EditionPoster({ product, edition }: { product: MenuProduct; edition: PosterEdition | null }) {
  const openProduct = useOpenProduct();

  return (
    <section aria-labelledby="affiche-titre" className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 size-[38rem] rounded-full bg-[radial-gradient(circle,rgba(255,90,31,0.22),transparent_62%)] md:-right-20 md:top-0 md:size-[52rem]"
      />
      {edition ? (
        <span
          aria-hidden
          className="font-display pointer-events-none absolute -bottom-10 -left-6 select-none text-[16rem] leading-none text-transparent [-webkit-text-stroke:1px_var(--line-2)] md:-bottom-24 md:text-[30rem]"
        >
          {String(edition.number).padStart(2, "0")}
        </span>
      ) : null}

      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pt-8 pb-10 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-4 md:px-6 md:pt-14 md:pb-20">
        <div className="relative z-10 md:order-1">
          <p className="font-display text-sm tracking-[0.22em] text-ember md:text-base">
            {edition ? (
              <>
                Édition {edition.numberLabel} · <span className="md:hidden">{edition.monthsShort}</span>
                <span className="hidden md:inline">{edition.monthsLong}</span>
              </>
            ) : (
              "La favorite des frères"
            )}
          </p>
          <h1
            id="affiche-titre"
            className="font-display mt-3 text-[clamp(3.6rem,17vw,8.5rem)] [text-shadow:0_4px_30px_rgba(0,0,0,0.55)]"
          >
            {product.name}
          </h1>
        </div>

        <div className="relative -mt-16 -mr-24 ml-auto w-[min(76vw,26rem)] md:order-2 md:row-span-2 md:mt-0 md:mr-0 md:w-full md:max-w-[34rem]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={640}
              height={640}
              priority
              sizes="(min-width: 768px) 34rem, 76vw"
              className="spin-slow aspect-square w-full rounded-full object-cover shadow-[0_0_0_8px_var(--bg),0_0_90px_rgba(255,90,31,0.35)]"
            />
          ) : (
            <div className="aspect-square w-full rounded-full bg-surface-2" />
          )}
        </div>

        <div className="relative z-10 -mt-4 space-y-7 md:order-3 md:mt-0">
          <div className="flex items-end justify-between gap-6 md:justify-start md:gap-10">
            <p className="max-w-xs text-[15px] leading-relaxed text-muted-2">{product.description}</p>
            <p className="font-display shrink-0 text-4xl tabular-nums">{formatEuros(product.unitPriceCents)}</p>
          </div>

          {edition ? (
            <div className="max-w-md">
              <Countdown
                endsAt={edition.endsAt}
                serverNow={edition.serverNow}
                dayIndex={edition.dayIndex}
                totalDays={edition.totalDays}
                ratio={edition.ratio}
              />
            </div>
          ) : null}

          <div className="hidden gap-3 md:flex">
            <button
              type="button"
              onClick={() => openProduct(product)}
              className={buttonClasses("primary", "lg", "min-w-60 justify-between")}
            >
              <span>Commander</span>
              <span className="tabular-nums">{formatEuros(product.unitPriceCents)}</span>
            </button>
            <a href={SITE.phoneHref} className={buttonClasses("secondary", "lg")}>
              Appeler · {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
