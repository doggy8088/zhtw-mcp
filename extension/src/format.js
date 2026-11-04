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

/// The findings as a prompt for an AI agent to apply: what to change and the
/// reason the scanner gave for each, so an agent judges a rewrite against the
/// same evidence the linter did.  One entry per finding, and a word found
/// twice is corrected twice.
export function buildFixPrompt(issues = [], pageTitle = "") {
  const entries = issues.map((issue, index) => {
    const found = issue.found || "";
    const suggestions = Array.isArray(issue.suggestions) ? issue.suggestions : [];
    const reason = issue.context ? `（${issue.context}）` : "";
    const action = suggestions.length
      ? `改成「${suggestions.join("」或「")}」`
      : "請依說明改寫";
    return `${index + 1}. 「${found}」${action}${reason}`;
  });
  const source = pageTitle ? `「${pageTitle}」` : "內容";
  return [
    `請修正${source}中的下列用語問題。每項只改指定的字句；其餘文字、格式與語氣都不要動。`,
    "",
    ...entries,
    "",
    "同一個詞在文中出現多次時全部都要改。改完後逐項列出修改之處。",
  ].join("\n");
}
