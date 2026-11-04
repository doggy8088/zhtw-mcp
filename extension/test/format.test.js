import test from "node:test";
import assert from "node:assert/strict";

import { buildFixPrompt, formatBadgeText, isInspectableUrl } from "../src/format.js";

test("badge text is capped for dense pages", () => {
  assert.equal(formatBadgeText(0), "");
  assert.equal(formatBadgeText(7), "7");
  assert.equal(formatBadgeText(99), "99");
  assert.equal(formatBadgeText(100), "99+");
  assert.equal(formatBadgeText(125), "99+");
});

test("only injectable schemes are offered a scan", () => {
  for (const url of [
    "https://example.tw/a",
    "http://example.tw/a",
    "HTTPS://EXAMPLE.TW",
    "file:///tmp/a.html",
  ]) {
    assert.equal(isInspectableUrl(url), true, url);
  }
  for (const url of [
    "chrome://extensions",
    "about:blank",
    "chrome-extension://abc/popup.html",
    "devtools://devtools/bundled/inspector.html",
    "",
  ]) {
    assert.equal(isInspectableUrl(url), false, url);
  }
  assert.equal(isInspectableUrl(), false);
});

test("the fix prompt lists each finding with its reason", () => {
  const prompt = buildFixPrompt(
    [
      { found: "調用", suggestions: ["呼叫"], context: "@domain 通訊" },
      { found: "開源", suggestions: ["開放原始碼", "開源碼"], context: "MoE 辭典" },
      { found: "長長的一句話", suggestions: [], context: "定語堆疊" },
    ],
    "測試網頁",
  );

  assert.match(prompt, /請修正「測試網頁」中的下列用語問題/);
  assert.match(prompt, /1\. 「調用」改成「呼叫」（@domain 通訊）/);
  assert.match(prompt, /2\. 「開源」改成「開放原始碼」或「開源碼」（MoE 辭典）/);
  assert.match(prompt, /3\. 「長長的一句話」請依說明改寫（定語堆疊）/);
  assert.match(prompt, /全部都要改/);
});

test("the fix prompt names the page only when it has one", () => {
  assert.match(buildFixPrompt([{ found: "調用", suggestions: ["呼叫"] }]), /請修正內容中的下列/);
  assert.doesNotMatch(buildFixPrompt([{ found: "調用", suggestions: ["呼叫"] }]), /「」/);
});
