// Ambient declaration for the optional, dynamically-imported transformers
// package. The package is NOT a dependency of this repo; it is loaded only via
// a runtime dynamic import. This declaration just lets `tsc` type-check the
// dynamic import call without the package being installed.
declare module '@huggingface/transformers' {
  export function pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ): Promise<unknown>
  export const env: {
    backends?: { onnx?: { wasm?: unknown } }
  }
}
