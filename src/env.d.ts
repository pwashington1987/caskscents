/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** "true" on a preview deploy that should show draft samples. */
  readonly PUBLIC_SHOW_DRAFTS?: string;
  /** The Buttondown newsletter name. The email signup shows only when this is set. */
  readonly PUBLIC_BUTTONDOWN_USERNAME?: string;
  /** The Cloudflare Web Analytics token. Visits are counted only when this is set. */
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
