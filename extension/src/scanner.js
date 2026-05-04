import initWasm, { scan_text as scanTextWasm } from "../dist/zhtw_mcp_wasm.js";

let wasmModulePromise;
let scanTextBinding;

async function loadWasmModule() {
  if (!wasmModulePromise) {
    wasmModulePromise = (async () => {
      const wasmUrl = chrome.runtime.getURL("dist/zhtw_mcp_wasm_bg.wasm");
      await initWasm(wasmUrl);
      scanTextBinding = scanTextWasm;
    })();
  }
  try {
    return await wasmModulePromise;
  } catch (error) {
    wasmModulePromise = undefined;
    scanTextBinding = undefined;
    throw error;
  }
}

export async function scanText(text, options = {}) {
  try {
    await loadWasmModule();
  } catch (error) {
    throw new Error(
      `WASM scanner is not built. Run "sh extension/build-wasm.sh" before loading the extension. ${error.message}`,
    );
  }

  const resultJson = scanTextBinding(text, JSON.stringify(options));
  return JSON.parse(resultJson);
}
