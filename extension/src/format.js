// Pure helpers shared by the service worker and the popup, both of which are
// ES modules.  They live apart from background.js so a test can import them
// without pulling in scanner.js, which imports the wasm glue and therefore
// only resolves after `sh extension/build-wasm.sh` has run.
//
// The content script cannot reach this file: chrome.scripting.executeScript
// injects classic scripts, so its shared code lives in shared.js instead.

/// Beyond three characters Chrome truncates the badge, so cap it there.
export function formatBadgeText(count) {
  if (!count) {
    return "";
  }
  return count > 99 ? "99+" : String(count);
}

/// chrome:// and about: pages reject injection, and a clear message beats the
/// permission error Chrome would otherwise raise.
export function isInspectableUrl(url = "") {
  return /^(https?|file):/i.test(url);
}
