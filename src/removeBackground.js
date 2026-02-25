import { RawImage } from "@huggingface/transformers";
import {
  canvasToPngBlob,
  computeTargetSize,
  drawImageToCanvas,
  loadImageFromFile,
} from "./imageUtils";
import { getRuntime } from "./runtime";

const E2E_MOCK_INFERENCE = import.meta.env.VITE_E2E_MOCK_INFERENCE === "1";

export async function removeBackground(file, mode = "balanced") {
  if (!(file instanceof File)) {
    throw new Error("Please upload an image file first.");
  }

  if (E2E_MOCK_INFERENCE) {
    return runMockInference(file, mode);
  }

  const { model, processor, backend } = await getRuntime();
  const inputCanvas = await buildInputCanvas(file, mode);
  const inputImage = await RawImage.fromURL(inputCanvas.toDataURL("image/png"));

  const { pixel_values } = await processor(inputImage);
  const { output } = await model({ input: pixel_values });
  const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
    inputImage.width,
    inputImage.height,
  );

  inputImage.putAlpha(mask);
  const outputCanvas = inputImage.toCanvas();
  const blob = await canvasToPngBlob(outputCanvas);

  return { blob, backend };
}

async function buildInputCanvas(file, mode) {
  const image = await loadImageFromFile(file);
  const target = computeTargetSize(image.naturalWidth || image.width, image.naturalHeight || image.height, mode);
  return drawImageToCanvas(image, target.width, target.height);
}

async function runMockInference(file, mode) {
  if (globalThis.__E2E_FORCE_ERROR__) {
    throw new Error("Forced mock inference failure.");
  }

  const canvas = await buildInputCanvas(file, mode);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context is unavailable.");
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
    if (brightness > 235) {
      data[index + 3] = 0;
    }
  }
  context.putImageData(imageData, 0, 0);

  const blob = await canvasToPngBlob(canvas);
  return { blob, backend: "wasm" };
}
