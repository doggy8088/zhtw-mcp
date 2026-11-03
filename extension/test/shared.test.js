import test from "node:test";
import assert from "node:assert/strict";

// shared.js is injected as a classic script and has no exports; it publishes
// onto the global, which is how content.js reads it too.  Importing it for
// side effects therefore gives the test the same object the browser sees.
import "../src/shared.js";

const {
  byteOffsetToCodeUnit,
  filterExtensionIgnoredIssues,
  issueSegments,
  normalizeIssue,
  ruleTypeLabel,
  severityLabel,
  shouldHideExtensionIssue,
  shouldIgnoreExtensionIssue,
  tooltipForIssue,
  utf8ByteLength,
} = globalThis.ZhtwExtensionShared;

/// Build spans the way content.js does: concatenated text, byte offsets.
function spansOf(...texts) {
  let byteStart = 0;
  return texts.map((text) => {
    const byteEnd = byteStart + utf8ByteLength(text);
    const span = { byteStart, byteEnd, text };
    byteStart = byteEnd;
    return span;
  });
}

test("UTF-8 byte offsets map back to JavaScript code units", () => {
  const text = "A軟件B";
  const start = utf8ByteLength("A");
  const end = start + utf8ByteLength("軟件");

  assert.equal(byteOffsetToCodeUnit(text, start), 1);
  assert.equal(byteOffsetToCodeUnit(text, end), 3);
});

test("byte offsets outside the text clamp to its ends", () => {
  const text = "軟件";
  assert.equal(byteOffsetToCodeUnit(text, 0), 0);
  assert.equal(byteOffsetToCodeUnit(text, -5), 0);
  assert.equal(byteOffsetToCodeUnit(text, 9999), text.length);
});

test("an offset landing mid-character does not split it", () => {
  // 軟 is three UTF-8 bytes; byte 1 and byte 2 are inside it.
  assert.equal(byteOffsetToCodeUnit("軟件", 1), 0);
  assert.equal(byteOffsetToCodeUnit("軟件", 2), 0);
  assert.equal(byteOffsetToCodeUnit("軟件", 3), 1);
});

test("astral characters cost two code units", () => {
  const text = "𠮷字";
  assert.equal(utf8ByteLength("𠮷"), 4);
  assert.equal(byteOffsetToCodeUnit(text, 4), 2);
});

test("an issue inside one span becomes one segment", () => {
  const spans = spansOf("請安裝軟件後重試");
  const offset = utf8ByteLength("請安裝");
  const segments = issueSegments(spans, {
    offset,
    length: utf8ByteLength("軟件"),
  });

  assert.deepEqual(segments, [{ index: 0, start: 3, end: 5 }]);
  assert.equal(spans[0].text.slice(3, 5), "軟件");
});

test("an issue straddling spans becomes one segment per span", () => {
  const spans = spansOf("請安裝軟", "件後重試");
  const segments = issueSegments(spans, {
    offset: utf8ByteLength("請安裝"),
    length: utf8ByteLength("軟件"),
  });

  assert.deepEqual(segments, [
    { index: 0, start: 3, end: 4 },
    { index: 1, start: 0, end: 1 },
  ]);
  assert.equal(
    spans[0].text.slice(3, 4) + spans[1].text.slice(0, 1),
    "軟件",
  );
});

test("a zero-length issue produces no segments", () => {
  assert.deepEqual(issueSegments(spansOf("軟件"), { offset: 0, length: 0 }), []);
});

test("an issue past the end of the text produces no segments", () => {
  const spans = spansOf("軟件");
  assert.deepEqual(issueSegments(spans, { offset: 99, length: 3 }), []);
  // Start inside, end past the last span: nothing to anchor the range to.
  assert.deepEqual(issueSegments(spans, { offset: 0, length: 99 }), []);
});

test("empty spans produce no segments", () => {
  assert.deepEqual(issueSegments([], { offset: 0, length: 3 }), []);
});

test("normalizeIssue fills in every field a highlight reads", () => {
  const issue = normalizeIssue({});

  assert.deepEqual(issue, {
    offset: 0,
    length: 0,
    found: "",
    suggestions: [],
    rule_type: "unknown",
    severity: "info",
    context: "",
    english: "",
  });
});

test("normalizeIssue coerces junk rather than propagating it", () => {
  const issue = normalizeIssue({
    offset: "12",
    length: null,
    suggestions: "not an array",
    severity: "error",
  });

  assert.equal(issue.offset, 12);
  assert.equal(issue.length, 0);
  assert.deepEqual(issue.suggestions, []);
  assert.equal(issue.severity, "error");
});

test("a tooltip omits the sections an issue has no data for", () => {
  const bare = tooltipForIssue(normalizeIssue({ found: "軟件", severity: "warning" }));

  assert.match(bare, /^軟件 — unknown \/ 警告\n無自動建議$/);
  assert.doesNotMatch(bare, /說明/);
  assert.doesNotMatch(bare, /English/);
});

test("a tooltip lists every suggestion", () => {
  const full = tooltipForIssue(
    normalizeIssue({
      found: "軟件",
      suggestions: ["軟體", "程式"],
      rule_type: "cross_strait",
      severity: "error",
      context: "台灣用語",
      english: "software",
    }),
  );

  assert.equal(
    full,
    "軟件 — 對岸用語 / 錯誤\n建議：軟體、程式\n說明：台灣用語\nEnglish：software",
  );
});

// The labels are the only place a reader meets the vocabulary, so an
// identifier with no label falls back to itself rather than disappearing.
test("rule types and severities read in Chinese", () => {
  assert.equal(ruleTypeLabel("translationese"), "翻譯腔");
  assert.equal(ruleTypeLabel("cross_strait"), "對岸用語");
  assert.equal(severityLabel("warning"), "警告");
  assert.equal(ruleTypeLabel("not_a_type"), "not_a_type");
  assert.equal(severityLabel("not_a_severity"), "not_a_severity");
});

test("segments read span text through a getter, so live nodes stay current", () => {
  // content.js backs each span with a getter onto the DOM node, because
  // surroundContents splits text nodes as highlights land.
  const node = { nodeValue: "請安裝軟件後重試" };
  const spans = [
    {
      node,
      byteStart: 0,
      byteEnd: utf8ByteLength(node.nodeValue),
      get text() {
        return this.node.nodeValue || "";
      },
    },
  ];
  const issue = {
    offset: utf8ByteLength("請安裝"),
    length: utf8ByteLength("軟件"),
  };

  assert.deepEqual(issueSegments(spans, issue), [{ index: 0, start: 3, end: 5 }]);

  // A node emptied by an earlier highlight is dropped rather than turned into
  // an empty range the DOM would reject.
  node.nodeValue = "";
  assert.deepEqual(issueSegments(spans, issue), []);
});

test("extension ignores configured punctuation-only patterns", () => {
  const text = "流程...結束\n::: note\n這個軟件";
  const scanResult = {
    issues: [
      {
        offset: utf8ByteLength("流程"),
        length: utf8ByteLength("..."),
        found: "...",
        severity: "warning",
      },
      {
        offset: utf8ByteLength("流程...結束\n"),
        length: utf8ByteLength(":::"),
        found: ":::",
        severity: "error",
      },
      {
        offset: utf8ByteLength("流程...結束\n::: note\n這個"),
        length: utf8ByteLength("軟件"),
        found: "軟件",
        severity: "warning",
      },
      {
        offset: 0,
        length: utf8ByteLength("流程"),
        found: "流程",
        severity: "info",
      },
    ],
    issue_count: 4,
    badge_count: 3,
    severity_counts: { info: 1, warning: 2, error: 1 },
  };

  const filtered = filterExtensionIgnoredIssues(scanResult, text);

  assert.deepEqual(
    filtered.issues.map((issue) => issue.found),
    ["軟件"],
  );
  assert.equal(filtered.issue_count, 1);
  assert.equal(filtered.badge_count, 1);
  assert.deepEqual(filtered.severity_counts, { info: 0, warning: 1, error: 0 });
});

test("extension ignores scanner issues inside configured pattern ranges", () => {
  const text = "😀提示:::內容";
  const issue = {
    offset: utf8ByteLength("😀提示"),
    length: utf8ByteLength(":"),
    found: ":",
    severity: "warning",
  };

  const filtered = filterExtensionIgnoredIssues({ issues: [issue] }, text);

  assert.equal(shouldIgnoreExtensionIssue({ found: ":::" }), true);
  assert.equal(filtered.issues.length, 0);
});

test("extension hides info issues without visible suggestions", () => {
  const scanResult = {
    issues: [
      {
        offset: 0,
        length: utf8ByteLength("可以說是"),
        found: "可以說是",
        suggestions: [""],
        rule_type: "ai_style",
        severity: "info",
      },
      {
        offset: utf8ByteLength("可以說是中文"),
        length: 0,
        found: "",
        suggestions: [" "],
        rule_type: "punctuation",
        severity: "info",
      },
      {
        offset: 0,
        length: utf8ByteLength("軟件"),
        found: "軟件",
        suggestions: ["軟體"],
        rule_type: "cross_strait",
        severity: "warning",
      },
      {
        offset: 0,
        length: utf8ByteLength("刪"),
        found: "刪",
        suggestions: [""],
        rule_type: "grammar",
        severity: "warning",
      },
    ],
    issue_count: 4,
    badge_count: 2,
    severity_counts: { info: 2, warning: 2, error: 0 },
  };

  const filtered = filterExtensionIgnoredIssues(scanResult, "可以說是中文軟件");

  assert.equal(shouldHideExtensionIssue(scanResult.issues[0]), true);
  assert.deepEqual(
    filtered.issues.map((issue) => issue.found),
    ["軟件", "刪"],
  );
  assert.deepEqual(filtered.issues[1].suggestions, []);
  assert.equal(filtered.issue_count, 2);
  assert.equal(filtered.badge_count, 2);
  assert.deepEqual(filtered.severity_counts, { info: 0, warning: 2, error: 0 });
});
