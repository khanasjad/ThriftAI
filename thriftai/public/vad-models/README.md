# VAD Models

This directory contains Voice Activity Detection (VAD) model files and ONNX Runtime WASM files used by the @ricky0123/vad-web library.

## Files
**VAD Models:**
- `silero_vad_legacy.onnx` - Legacy Silero VAD model (1.7MB)
- `silero_vad_v5.onnx` - Version 5 Silero VAD model (2.2MB)
- `vad.worklet.bundle.min.js` - Audio worklet for VAD processing (2.6KB)

**ONNX Runtime WASM & Modules:**
- `ort-wasm-simd-threaded.wasm` + `.mjs` - Main WASM runtime (~11MB + 20KB)
- `ort-wasm-simd-threaded.asyncify.wasm` + `.mjs` - Asyncify version (~24MB + 51KB)
- `ort-wasm-simd-threaded.jsep.wasm` + `.mjs` - JSEP version (~23MB + 49KB)

## Regenerating Files
These files are automatically copied from node_modules during `npm install` via the postinstall script.

To manually regenerate:
```bash
mkdir -p public/vad-models
cp node_modules/@ricky0123/vad-web/dist/*.onnx public/vad-models/
cp node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js public/vad-models/
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded*.wasm public/vad-models/
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded*.mjs public/vad-models/
```

## Why These Files Are Here
Next.js doesn't serve files from node_modules, so we copy all required files to the public directory where they can be served at runtime. Using local files instead of CDN ensures:
- No CORS issues
- Correct version matching (onnxruntime-web@1.17.0)
- Faster loading times
