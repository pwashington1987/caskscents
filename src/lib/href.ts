/**
 * Every internal link goes through href(), so the site works unchanged at a
 * domain root or under a sub-path such as /caskscents/.
 */
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

export function withBase(base: string, path: string): string {
  if (EXTERNAL.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export function href(path: string): string {
  return withBase(import.meta.env.BASE_URL, path);
}
