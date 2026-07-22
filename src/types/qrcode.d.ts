declare module 'qrcode' {
  function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: Record<string, unknown>,
    callback?: (error: Error | null) => void
  ): void;
  function toDataURL(text: string, options?: Record<string, unknown>): Promise<string>;
}

declare module 'jsqr' {
  function jsQR(data: Uint8ClampedArray, width: number, height: number): { data: string } | null;
  export default jsQR;
}
