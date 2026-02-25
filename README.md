# Background-Remove-On-Edge

Remove image backgrounds directly in the browser using `briaai/RMBG-1.4` with WebGPU-first and WASM fallback.

## Features
- Upload image
- Remove background (client-side only, no inference backend)
- Download transparent PNG
- Quality mode:
  - `Balanced`: downscale very large images for speed/stability
  - `Max quality`: keep original resolution

## Stack
- Vite + Vanilla JavaScript
- `@huggingface/transformers`
- Unit tests: Vitest
- E2E tests: Playwright
- CI: GitHub Actions

## Local setup
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run test:unit`: run Vitest unit tests
- `npm run test:e2e`: run Playwright e2e tests (mock inference mode for deterministic CI)
- `npm run test:smoke-real`: run optional real-model smoke test (downloads model assets)

## Notes
- E2E defaults to `VITE_E2E_MOCK_INFERENCE=1` so tests do not download model weights in CI.
- Real smoke test uses `playwright.real.config.cjs` and real RMBG model inference in browser.
- Model license tag currently reports `license:other`; perform license review before production deployment.
