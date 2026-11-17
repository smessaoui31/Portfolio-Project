import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "cream";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ember text-ember-ink hover:brightness-110 active:brightness-95",
  secondary: "bg-surface-2 text-fg border border-line-2 hover:border-muted",
  ghost: "text-fg hover:bg-surface-2",
  cream: "bg-fg text-ember-ink hover:brightness-95",
};

const SIZES: Record<Size, string> = {
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-[15px] rounded-2xl",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return [
    "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition select-none",
    "disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className = "", ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
