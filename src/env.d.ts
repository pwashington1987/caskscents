/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** "true" on a preview deploy that should show draft samples. */
  readonly PUBLIC_SHOW_DRAFTS?: string;
  /** The Buttondown newsletter name. The email signup shows only when this is set. */
  readonly PUBLIC_BUTTONDOWN_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
