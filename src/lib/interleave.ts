/**
 * Mélange une liste pour qu'un même prestataire n'apparaisse pas deux fois de suite tant
 * que c'est possible. À chaque place, on prend le prestataire qui a encore le plus de
 * prestations, sauf celui qui vient de passer. Chaque prestataire garde son ordre interne.
 */
export function interleaveByProvider<T>(items: T[], providerOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = providerOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  const out: T[] = [];
  let last: string | null = null;
  while (out.length < items.length) {
    let pick: string | null = null;
    let best = 0;
    for (const [key, group] of groups) {
      if (group.length === 0 || key === last) continue;
      if (group.length > best) {
        best = group.length;
        pick = key;
      }
    }
    // Si seul le dernier prestataire reste, il faut bien le reprendre.
    if (pick === null) pick = last;
    if (pick === null) break;

    const next = groups.get(pick)?.shift();
    if (next === undefined) break;
    out.push(next);
    last = pick;
  }
  return out;
}
