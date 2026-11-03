import test from "node:test";
import assert from "node:assert/strict";

import { formatBadgeText, isInspectableUrl } from "../src/format.js";

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
