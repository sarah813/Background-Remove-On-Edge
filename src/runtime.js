export const MODEL_ID = "briaai/RMBG-1.4";

const MODEL_OPTIONS = {
  config: { model_type: "custom" },
};

const PROCESSOR_OPTIONS = {
  config: {
    do_normalize: true,
    do_pad: false,
    do_rescale: true,
    do_resize: true,
    image_mean: [0.5, 0.5, 0.5],
    feature_extractor_type: "ImageFeatureExtractor",
    image_std: [1, 1, 1],
    resample: 2,
    rescale_factor: 0.00392156862745098,
    size: { width: 1024, height: 1024 },
  },
};

let runtimePromise = null;

export async function initializeModel(options = {}) {
  const runtime = await getRuntime(options);
  return { backend: runtime.backend };
}

export async function getRuntime(options = {}) {
  if (!runtimePromise || options.forceReload) {
    runtimePromise = loadRuntime(options);
  }
  return runtimePromise;
}

export function __resetRuntimeCache() {
  runtimePromise = null;
}

async function loadRuntime(options) {
  const { loadModel, loadProcessor } = await resolveLoaders(options);
  const forceWasm = options.forceWasm ?? import.meta.env.VITE_FORCE_WASM === "1";
  const hasWebGPU =
    forceWasm ? false : options.hasWebGPU ?? (typeof navigator !== "undefined" && Boolean(navigator.gpu));

  const processorPromise = loadProcessor(MODEL_ID, PROCESSOR_OPTIONS);
  const backendOrder = hasWebGPU ? ["webgpu", "wasm"] : ["wasm"];

  let lastError = null;
  for (const backend of backendOrder) {
    try {
      const modelOptions =
        backend === "webgpu"
          ? { ...MODEL_OPTIONS, device: "webgpu" }
          : { ...MODEL_OPTIONS, device: "wasm" };
      const [model, processor] = await Promise.all([
        loadModel(MODEL_ID, modelOptions),
        processorPromise,
      ]);

      return { backend, model, processor };
    } catch (error) {
      lastError = error;
    }
  }

  const rootMessage = lastError instanceof Error ? lastError.message : "unknown error";
  throw new Error(`Unable to load RMBG model. ${rootMessage}`);
}

async function resolveLoaders(options) {
  if (options.loadModel && options.loadProcessor) {
    return {
      loadModel: options.loadModel,
      loadProcessor: options.loadProcessor,
    };
  }

  const { AutoModel, AutoProcessor, env } = await import("@huggingface/transformers");
  if (env?.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.proxy = false;
    env.backends.onnx.wasm.numThreads = 1;
  }
  return {
    loadModel: options.loadModel ?? AutoModel.from_pretrained.bind(AutoModel),
    loadProcessor: options.loadProcessor ?? AutoProcessor.from_pretrained.bind(AutoProcessor),
  };
}
