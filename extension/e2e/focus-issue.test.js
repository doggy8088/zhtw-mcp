import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const srcDir = fileURLToPath(new URL("../src", import.meta.url));

// The filler puts the phrase under test well below the fold, so a click that
// moved nothing leaves the mark out of the viewport and the wait below times
// out rather than passing on a page that never needed scrolling.
const PAGE = `<!doctype html><html lang="zh-Hant-TW"><body>
  <p id="filler">${"前文內容，".repeat(150)}</p>
  <p id="target">這裡的優化需要檢討。</p>
</body></html>`;

/// Load the extension's scripts into the page the way the background does, and
/// keep the message listener the content script registers.
async function installContentScript(page) {
  await page.setContent(PAGE);
  // content.js reads chrome.runtime at load, so the stub has to be in place
  // before the script tags are added.
  await page.evaluate(() => {
    window.chrome = {
      runtime: {
        onMessage: {
          addListener: (fn) => {
            window.__zhtwListener = fn;
          },
        },
      },
    };
  });
  for (const name of ["shared.js", "symbols.js", "editable.js", "content.js"]) {
    await page.addScriptTag({ path: path.join(srcDir, name) });
  }
}

function send(page, message) {
  return page.evaluate(
    (msg) => new Promise((resolve) => window.__zhtwListener(msg, null, resolve)),
    message,
  );
}

test("a clicked result scrolls its mark into view and pulses it", { timeout: 60_000 }, async () => {
  const profile = await mkdtemp(path.join(tmpdir(), "zhtw-focus-"));
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
  });

  try {
    const page = await context.newPage();
    await installContentScript(page);

    const collected = await send(page, { type: "COLLECT_TEXT" });
    const bytes = Buffer.from(collected.text, "utf8");
    const offset = bytes.indexOf("優化");
    assert.ok(offset >= 0, "the fixture text carries the phrase under test");

    const highlighted = await send(page, {
      type: "HIGHLIGHT_ISSUES",
      issues: [
        {
          offset,
          length: Buffer.byteLength("優化"),
          found: "優化",
          severity: "warning",
          rule_type: "cross_strait",
          suggestions: ["最佳化"],
        },
      ],
    });
    assert.equal(highlighted.highlighted_count, 1);

    const focus = await send(page, { type: "FOCUS_ISSUE", index: 0 });
    assert.equal(focus.ok, true);

    // The trip the click buys: the mark lands in the viewport and pulses.
    await page.waitForFunction(
      () => {
        const mark = document.querySelector('mark[data-zhtw-mcp-issue="0"]');
        if (!mark) {
          return false;
        }
        const rect = mark.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      },
      null,
      { timeout: 5_000 },
    );
    const pulsed = await page.evaluate(
      () => document.querySelectorAll("mark.zhtw-mcp-focus").length,
    );
    assert.equal(pulsed, 1, "the mark carries the pulse class");

    // An index with no mark answers honestly instead of moving the page.
    const missing = await send(page, { type: "FOCUS_ISSUE", index: 99 });
    assert.equal(missing.ok, false);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
