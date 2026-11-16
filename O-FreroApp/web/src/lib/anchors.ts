/** Id of a menu category section, e.g. "Boissons" -> "categorie-boissons". */
export function categoryAnchor(name: string): string {
  return `categorie-${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}`;
}
