// src/lib/http.ts

/** Nos routes n'utilisent jamais de segments répétables (:x+) ou de wildcards (*),
 * donc un paramètre nommé est toujours une string unique à l'exécution — mais
 * @types/express type `req.params[x]` en `string | string[]` pour couvrir ce cas.
 */
export function paramStr(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}
