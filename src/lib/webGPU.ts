function initWebGPU(canvasEl: HTMLCanvasElement, dpr: number) {
  const ctx = canvasEl.getContext("webgpu");
  // configure swap chain with canvasEl.width / height (already * dpr)
  return ctx;
}