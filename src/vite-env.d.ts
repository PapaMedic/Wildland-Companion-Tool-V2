/// <reference types="vite/client" />

// Allow importing PDF files as URLs (via Vite's asset handling)
declare module '*.pdf' {
  const src: string;
  export default src;
}
