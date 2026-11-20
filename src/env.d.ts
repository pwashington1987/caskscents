/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** "true" on a preview deploy that should show draft samples. */
  readonly PUBLIC_SHOW_DRAFTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
