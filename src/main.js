import "./style.css";
import { buildDownloadName } from "./imageUtils";
import { removeBackground } from "./removeBackground";
import { initializeModel } from "./runtime";

const E2E_MOCK_INFERENCE = import.meta.env.VITE_E2E_MOCK_INFERENCE === "1";

const imageInput = document.getElementById("imageInput");
const removeBtn = document.getElementById("removeBtn");
const downloadBtn = document.getElementById("downloadBtn");
const qualityMode = document.getElementById("qualityMode");
const qualityOptionButtons = Array.from(document.querySelectorAll(".quality-option"));
const statusLabel = document.getElementById("status");
const downloadStatusLabel = document.getElementById("downloadStatus");
const originalPreview = document.getElementById("originalPreview");
const resultPreview = document.getElementById("resultPreview");

let selectedFile = null;
let resultBlob = null;
let originalObjectUrl = null;
let resultObjectUrl = null;

function setStatus(state, message) {
  statusLabel.dataset.state = state;
  statusLabel.textContent = message;
}

function setDownloadStatus(message) {
  downloadStatusLabel.textContent = message;
}

function updateControls({ processing = false } = {}) {
  imageInput.disabled = processing;
  qualityOptionButtons.forEach((button) => {
    button.disabled = processing;
  });
  removeBtn.disabled = processing;
  downloadBtn.disabled = processing || !resultBlob;
}

function setQualityMode(mode) {
  qualityMode.value = mode;
  qualityOptionButtons.forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function clearResult() {
  resultBlob = null;
  if (resultObjectUrl) {
    URL.revokeObjectURL(resultObjectUrl);
    resultObjectUrl = null;
  }
  resultPreview.removeAttribute("src");
  updateControls();
}

function setOriginalPreview(file) {
  if (originalObjectUrl) {
    URL.revokeObjectURL(originalObjectUrl);
  }
  originalObjectUrl = URL.createObjectURL(file);
  originalPreview.src = originalObjectUrl;
}

async function onFileChange(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    selectedFile = null;
    if (originalObjectUrl) {
      URL.revokeObjectURL(originalObjectUrl);
      originalObjectUrl = null;
    }
    originalPreview.removeAttribute("src");
    clearResult();
    setStatus("idle", "");
    setDownloadStatus("");
    return;
  }

  selectedFile = file;
  setOriginalPreview(file);
  clearResult();
  setStatus("idle", "");
  setDownloadStatus("");
}

async function onRemoveClick() {
  if (!selectedFile) {
    setStatus("idle", "Please upload an image to begin.");
    return;
  }

  setDownloadStatus("");
  updateControls({ processing: true });
  try {
    if (!E2E_MOCK_INFERENCE) {
      setStatus("loading_model", "Loading model...");
      const modelState = await initializeModel();
      setStatus("processing", `Removing background (${modelState.backend.toUpperCase()})...`);
    } else {
      setStatus("processing", "Removing background (MOCK WASM)...");
    }

    const { blob, backend } = await removeBackground(selectedFile, qualityMode.value);
    resultBlob = blob;

    if (resultObjectUrl) {
      URL.revokeObjectURL(resultObjectUrl);
    }
    resultObjectUrl = URL.createObjectURL(blob);
    resultPreview.src = resultObjectUrl;
    setStatus("done", `Done. Output ready (${backend.toUpperCase()}).✅`);
  } catch (error) {
    resultBlob = null;
    resultPreview.removeAttribute("src");
    const message = error instanceof Error ? error.message : "Unexpected processing error.";
    setStatus("error", `Error: ${message}`);
  } finally {
    updateControls();
  }
}

function onDownloadClick() {
  if (!resultBlob || !selectedFile) {
    return;
  }

  setDownloadStatus("Image downloading.");
  const href = URL.createObjectURL(resultBlob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = buildDownloadName(selectedFile.name);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function onQualityOptionClick(event) {
  const mode = event.currentTarget.dataset.mode;
  setQualityMode(mode);
}

imageInput.addEventListener("change", onFileChange);
removeBtn.addEventListener("click", onRemoveClick);
downloadBtn.addEventListener("click", onDownloadClick);
qualityOptionButtons.forEach((button) => {
  button.addEventListener("click", onQualityOptionClick);
});

updateControls();
setQualityMode(qualityMode.value || "balanced");
setStatus("idle", "");
setDownloadStatus("");
