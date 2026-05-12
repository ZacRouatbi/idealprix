/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDUSA_BACKEND_URL: string
  readonly VITE_STOREFRONT_URL: string
  readonly VITE_DEFAULT_REGION: string
  readonly VITE_STRIPE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
