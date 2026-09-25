type KineticTextProps = {
  text: string;
  className?: string;
  /** Délai de départ, en nombre de "mots" (utile pour enchaîner plusieurs lignes) */
  startDelay?: number;
};

/** Découpe un texte en mots et les fait apparaître un par un (voir .kinetic-word dans globals.css). */
export default function KineticText({ text, className, startDelay = 0 }: KineticTextProps) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className={`kinetic-word ${className ?? ""}`}
          style={{ "--i": startDelay + i } as React.CSSProperties}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}
