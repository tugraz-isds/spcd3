import { canvasEl } from "./globals";

function initWebGL() {
  const gl = canvasEl.getContext("webgl2")!;
  gl.viewport(0, 0, canvasEl.width, canvasEl.height);
  return gl;
}
