import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRuntimeCache, initializeModel, MODEL_ID } from "../../src/runtime";

describe("initializeModel", () => {
  beforeEach(() => {
    __resetRuntimeCache();
  });

  it("retries with wasm when webgpu loading fails", async () => {
    const loadModel = vi
      .fn()
      .mockRejectedValueOnce(new Error("WebGPU not supported"))
      .mockResolvedValueOnce({ kind: "mock-model" });
    const loadProcessor = vi.fn().mockResolvedValue({ kind: "mock-processor" });

    const result = await initializeModel({
      hasWebGPU: true,
      loadModel,
      loadProcessor,
    });

    expect(result).toEqual({ backend: "wasm" });
    expect(loadProcessor).toHaveBeenCalledTimes(1);
    expect(loadModel).toHaveBeenCalledTimes(2);
    expect(loadModel).toHaveBeenNthCalledWith(
      1,
      MODEL_ID,
      expect.objectContaining({ device: "webgpu" }),
    );
    expect(loadModel).toHaveBeenNthCalledWith(
      2,
      MODEL_ID,
      expect.objectContaining({ device: "wasm" }),
    );
  });

  it("uses wasm directly when webgpu is unavailable", async () => {
    const loadModel = vi.fn().mockResolvedValue({ kind: "mock-model" });
    const loadProcessor = vi.fn().mockResolvedValue({ kind: "mock-processor" });

    const result = await initializeModel({
      hasWebGPU: false,
      loadModel,
      loadProcessor,
    });

    expect(result).toEqual({ backend: "wasm" });
    expect(loadModel).toHaveBeenCalledTimes(1);
    expect(loadModel).toHaveBeenCalledWith(
      MODEL_ID,
      expect.objectContaining({ device: "wasm" }),
    );
  });
});
