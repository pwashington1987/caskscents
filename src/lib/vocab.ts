/** Helpers for the fixed word lists in src/data/. */

function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = keep;
    }
  }
  return prev[b.length];
}

/** The nearest valid label, or undefined when nothing is plausibly a typo of it. */
export function closest(value: string, list: readonly string[]): string | undefined {
  const v = value.trim().toLowerCase();
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const item of list) {
    const d = distance(v, item.toLowerCase());
    if (d < bestDistance) {
      best = item;
      bestDistance = d;
    }
  }
  const allowed = Math.max(1, Math.floor(v.length / 3));
  return bestDistance <= allowed ? best : undefined;
}

export type LabelCheck = { ok: true } | { ok: false; suggestion?: string };

export function checkLabel(value: string, list: readonly string[]): LabelCheck {
  if (list.includes(value)) return { ok: true };
  const suggestion = closest(value, list);
  return suggestion ? { ok: false, suggestion } : { ok: false };
}

export function vocabMessage(
  kind: string,
  value: string,
  list: readonly string[],
  file: string,
): string {
  const check = checkLabel(value, list);
  if (check.ok) return '';
  const hint = check.suggestion ? ` Did you mean "${check.suggestion}"?` : '';
  return `Unknown ${kind} "${value}".${hint} If it is a new ${kind}, add it to ${file}.`;
}
