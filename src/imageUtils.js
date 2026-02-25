export const BALANCED_MAX_SIDE = 2048;

export function computeTargetSize(width, height, mode = "balanced") {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions.");
  }

  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);
  if (mode === "max") {
    return { width: roundedWidth, height: roundedHeight };
  }

  const largestSide = Math.max(roundedWidth, roundedHeight);
  if (largestSide <= BALANCED_MAX_SIDE) {
    return { width: roundedWidth, height: roundedHeight };
  }

  const scale = BALANCED_MAX_SIDE / largestSide;
  return {
    width: Math.max(1, Math.round(roundedWidth * scale)),
    height: Math.max(1, Math.round(roundedHeight * scale)),
  };
}

export function buildDownloadName(originalName) {
  if (!originalName) {
    return "image-no-bg.png";
  }

  const extensionStart = originalName.lastIndexOf(".");
  const baseName = extensionStart > 0 ? originalName.slice(0, extensionStart) : originalName;
  return `${baseName}-no-bg.png`;
}

export function drawImageToCanvas(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context is unavailable.");
  }
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

export async function canvasToPngBlob(canvas) {
  if (typeof canvas.convertToBlob === "function") {
    return canvas.convertToBlob({ type: "image/png", quality: 1 });
  }

  if (typeof canvas.toBlob !== "function") {
    throw new Error("Canvas PNG export is not supported in this browser.");
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to convert canvas to PNG."));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1,
    );
  });
}

export async function loadImageFromFile(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromUrl(objectUrl);
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode uploaded image."));
    image.src = url;
  });
}
