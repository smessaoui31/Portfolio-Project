import { useId, type ComponentProps, type ReactNode } from "react";

export const inputClasses =
  "w-full rounded-xl border border-line-2 bg-surface px-3.5 py-3 text-[15px] text-fg placeholder:text-muted/70 outline-none transition focus:border-ember aria-[invalid=true]:border-danger";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}
