import "./shared.js";

const { ruleTypeLabel } = globalThis.ZhtwExtensionShared;

const form = document.querySelector("#scan-form");
const statusNode = document.querySelector("#status");
const countNode = document.querySelector("#count");
const issueListNode = document.querySelector("#issue-list");
const scanButton = document.querySelector("#scan-button");
const profileInput = document.querySelector("#profile");
const spacingInput = document.querySelector("#spacing");
const relaxedInput = document.querySelector("#relaxed");
const offInput = document.querySelector("#off");
const symbolHandlingInput = document.querySelector("#symbol-handling");
const SYMBOL_HANDLING_KEY = "symbol_handling";
const SYMBOL_HANDLING_MODES = ["off", "remove", "warn"];

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void scan();
});

// The icon press says "check this page", so the check runs itself: the result
// should not sit behind a second press on the button below.
document.addEventListener("DOMContentLoaded", () => void scan());

async function scan() {
  await symbolHandlingLoad;
  await runScan();
}
scanButton.disabled = true;
symbolHandlingInput.disabled = true;
const symbolHandlingLoad = loadSymbolHandling();

symbolHandlingInput.addEventListener("change", () => {
  chrome.storage.sync
    .set({ [SYMBOL_HANDLING_KEY]: symbolHandlingInput.value })
    .catch((error) => console.warn("Could not store the symbol handling mode.", error));
});

// The one option that changes what the extension does to the page rather than
// what it reports back, so it is the one that has to outlive the popup: a user
// who turns the warning off should not meet it again on the next scan.
async function loadSymbolHandling() {
  try {
    const stored = await chrome.storage.sync.get(SYMBOL_HANDLING_KEY);
    const mode = stored?.[SYMBOL_HANDLING_KEY];
    if (SYMBOL_HANDLING_MODES.includes(mode)) {
      symbolHandlingInput.value = mode;
    }
  } catch (error) {
    // Settling rather than rejecting: submit awaits this promise, and a
    // rejected one throws there on every press, leaving an enabled button that
    // scans nothing.  A storage read that failed only costs the stored mode,
    // which the visible default already stands in for.
    console.warn("Could not restore the symbol handling mode.", error);
  } finally {
    symbolHandlingInput.disabled = false;
    scanButton.disabled = false;
  }
}

async function runScan() {
  setBusy(true);
  renderStatus("正在掃描目前分頁…", "busy");
  try {
    const response = await sendMessage({
      type: "RUN_SCAN_ACTIVE_TAB",
      options: {
        profile: profileInput.value,
        spacing: spacingInput.value,
        relaxed: relaxedInput.checked,
        // Subtracted after the profile resolves, the same order the CLI and the
        // MCP tool apply --off in.
        off: [...offInput.selectedOptions].map((option) => option.value),
        symbol_handling: symbolHandlingInput.value,
      },
    });
    if (!response.ok) {
      throw new Error(response.error || "掃描失敗");
    }
    renderResult(response.result);
  } catch (error) {
    renderStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        resolve({ ok: false, error: error.message });
        return;
      }
      resolve(response || { ok: false, error: "No response from background." });
    });
  });
}

function renderResult(result) {
  const count = result.badge_count || 0;
  countNode.textContent = String(count);
  // The count and the cards below say what was found; a severity tally would
  // only recount them, and the card borders already carry the severity.
  renderStatus(count ? `找到 ${count} 個需留意的用語` : "沒有警告或錯誤", count ? "warn" : "ok");
  renderIssues(result.issues || []);
}

function renderIssues(issues) {
  issueListNode.innerHTML = "";
  if (!issues.length) {
    const empty = document.createElement("li");
    empty.className = "issue issue--empty";
    empty.textContent = "沒有可列出的結果。";
    issueListNode.append(empty);
    return;
  }

  issues.slice(0, 30).forEach((issue, index) => {
    const item = document.createElement("li");
    item.className = `issue issue--${issue.severity}`;
    // The card is the way back to the page: clicking it moves the mark into
    // view and pulses it.  The button role and the two keys give keyboard
    // users the same trip.
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.title = "在頁面上標示這個問題";
    item.addEventListener("click", () => void focusIssue(index));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void focusIssue(index);
      }
    });

    const found = document.createElement("span");
    found.className = "issue__found";
    found.textContent = issue.found;

    const detail = document.createElement("span");
    detail.className = "issue__detail";
    const suggestion = issue.suggestions?.length
      ? ` → ${issue.suggestions.join("、")}`
      : "";
    detail.textContent = `${ruleTypeLabel(issue.rule_type)}${suggestion}`;

    item.append(found, detail);

    // The label names the family; the reason says which words to look at and
    // why.  The scanner writes one per finding, and an issue without one keeps
    // the card as it always was.
    if (issue.context) {
      const reason = document.createElement("span");
      reason.className = "issue__reason";
      reason.textContent = issue.context;
      item.append(reason);
    }

    issueListNode.append(item);
  });
}

// A mark the collector could not map has nothing to land on, and the console
// is the only place that needs to hear about it.
async function focusIssue(index) {
  const response = await sendMessage({ type: "FOCUS_ISSUE", index });
  if (!response.ok) {
    console.warn("Could not move to the issue on the page.", response.error);
  }
}

function renderStatus(text, tone) {
  statusNode.textContent = text;
  statusNode.dataset.tone = tone;
}

function setBusy(isBusy) {
  scanButton.disabled = isBusy;
  scanButton.textContent = isBusy ? "檢查中…" : "檢查目前分頁";
}
