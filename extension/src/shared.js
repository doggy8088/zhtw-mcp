// chrome.scripting.executeScript injects classic scripts, so this file cannot
// use ESM exports and publishes onto the global instead.  content.js reads it
// from `window`; the tests import this file and read the same global, so they
// exercise the same seam the browser does.
(function initShared(root, factory) {
  root.ZhtwExtensionShared = factory();
})(typeof globalThis !== "undefined" ? globalThis : self, function buildShared() {
  const encoder =
    typeof TextEncoder !== "undefined" ? new TextEncoder() : undefined;

  function utf8ByteLength(text) {
    if (!text) {
      return 0;
    }
    if (encoder) {
      return encoder.encode(text).length;
    }
    return Buffer.byteLength(text, "utf8");
  }

  function byteOffsetToCodeUnit(text, byteOffset) {
    if (byteOffset <= 0) {
      return 0;
    }

    let bytes = 0;
    let codeUnits = 0;
    for (const char of text) {
      const next = bytes + utf8ByteLength(char);
      if (next > byteOffset) {
        return codeUnits;
      }
      bytes = next;
      codeUnits += char.length;
      if (bytes === byteOffset) {
        return codeUnits;
      }
    }
    return text.length;
  }

  function countBadgeIssues(issues) {
    return issues.filter(
      (issue) => issue.severity === "warning" || issue.severity === "error",
    ).length;
  }

  const extensionIgnoredPatterns = ["...", ":::"];

  function filterExtensionIgnoredIssues(scanResult, text = "") {
    const issues = Array.isArray(scanResult?.issues) ? scanResult.issues : [];
    const ignoredRanges = ignoredPatternRanges(text);
    const filteredIssues = issues
      .map(normalizeDisplayIssue)
      .filter(
        (issue) =>
          !shouldIgnoreExtensionIssue(issue, ignoredRanges) &&
          !shouldHideExtensionIssue(issue),
      );

    return {
      ...scanResult,
      issues: filteredIssues,
      issue_count: filteredIssues.length,
      badge_count: countBadgeIssues(filteredIssues),
      severity_counts: countSeverityIssues(filteredIssues),
    };
  }

  function shouldIgnoreExtensionIssue(issue, ignoredRanges = []) {
    const found = issue?.found || "";
    if (extensionIgnoredPatterns.includes(found)) {
      return true;
    }

    const offset = Number(issue?.offset);
    const length = Number(issue?.length);
    if (!Number.isFinite(offset) || !Number.isFinite(length) || length <= 0) {
      return false;
    }
    const end = offset + length;

    return ignoredRanges.some(
      (range) => offset < range.byteEnd && end > range.byteStart,
    );
  }

  function shouldHideExtensionIssue(issue) {
    return issue?.severity === "info" && !hasVisibleSuggestion(issue);
  }

  function hasVisibleSuggestion(issue) {
    return Array.isArray(issue?.suggestions)
      ? issue.suggestions.some((suggestion) => String(suggestion).trim())
      : false;
  }

  function normalizeDisplayIssue(issue) {
    return {
      ...issue,
      suggestions: Array.isArray(issue?.suggestions)
        ? issue.suggestions.filter((suggestion) => String(suggestion).trim())
        : [],
    };
  }

  function ignoredPatternRanges(text) {
    if (!text) {
      return [];
    }

    const byteOffsets = codeUnitByteOffsets(text);
    const ranges = [];
    for (const pattern of extensionIgnoredPatterns) {
      let searchStart = 0;
      while (searchStart < text.length) {
        const index = text.indexOf(pattern, searchStart);
        if (index < 0) {
          break;
        }
        const byteStart = byteOffsets[index];
        ranges.push({
          byteStart,
          byteEnd: byteOffsets[index + pattern.length],
        });
        searchStart = index + pattern.length;
      }
    }
    return ranges;
  }

  function codeUnitByteOffsets(text) {
    const offsets = new Array(text.length + 1);
    let bytes = 0;
    let index = 0;
    offsets[0] = 0;

    for (const char of text) {
      bytes += utf8ByteLength(char);
      const nextIndex = index + char.length;
      for (
        let offsetIndex = index + 1;
        offsetIndex <= nextIndex;
        offsetIndex += 1
      ) {
        offsets[offsetIndex] = bytes;
      }
      index = nextIndex;
    }

    return offsets;
  }

  function countSeverityIssues(issues) {
    return issues.reduce(
      (counts, issue) => {
        if (issue.severity === "error") {
          counts.error += 1;
        } else if (issue.severity === "warning") {
          counts.warning += 1;
        } else {
          counts.info += 1;
        }
        return counts;
      },
      { info: 0, warning: 0, error: 0 },
    );
  }

  function normalizeIssue(issue) {
    return {
      offset: Number(issue.offset) || 0,
      length: Number(issue.length) || 0,
      found: issue.found || "",
      suggestions: Array.isArray(issue.suggestions) ? issue.suggestions : [],
      rule_type: issue.rule_type || "unknown",
      severity: issue.severity || "info",
      context: issue.context || "",
      english: issue.english || "",
    };
  }

  // The scanner reports UTF-8 byte offsets into one concatenated string; the
  // DOM wants code-unit offsets into individual text nodes.  An issue can also
  // straddle several nodes, so one issue becomes zero or more segments.
  //
  // Kept here rather than in content.js because this is the only arithmetic in
  // the extension that can be wrong in a way nobody sees: a highlight landing
  // one character off still looks like a highlight.  Everything it needs is a
  // plain number or string, so it is testable without a DOM.
  //
  // `spans` are `{ byteStart, byteEnd, text }` in document order.  Each
  // returned segment is `{ index, start, end }`, code units into
  // `spans[index].text`, and `end` is always greater than `start`.
  function issueSegments(spans, issue) {
    if (!issue.length) {
      return [];
    }
    const endByte = issue.offset + issue.length;
    const startIndex = spans.findIndex(
      (span) => issue.offset >= span.byteStart && issue.offset < span.byteEnd,
    );
    const endIndex = spans.findIndex(
      (span) => endByte > span.byteStart && endByte <= span.byteEnd,
    );
    if (startIndex < 0 || endIndex < startIndex) {
      return [];
    }

    const segments = [];
    for (let index = startIndex; index <= endIndex; index += 1) {
      const span = spans[index];
      const segmentStartByte = index === startIndex ? issue.offset : span.byteStart;
      const segmentEndByte = index === endIndex ? endByte : span.byteEnd;
      if (segmentStartByte >= segmentEndByte) {
        continue;
      }

      const text = span.text || "";
      const start = byteOffsetToCodeUnit(text, segmentStartByte - span.byteStart);
      const end = byteOffsetToCodeUnit(text, segmentEndByte - span.byteStart);
      if (start >= end) {
        continue;
      }
      segments.push({ index, start, end });
    }
    return segments;
  }

  // The runs of the flattened text that carry a declared language, ready for
  // the scanner to decide which of them it should leave alone.
  //
  // No judgement is made here about which languages count as Chinese: that
  // lives in src/engine/html_lang.rs, on the other side of the wasm call, so
  // there is one definition of it rather than one per side.  What this does is
  // read each span's inherited lang and fold consecutive spans that declared
  // the same one, which keeps a page whose html element carries a lang from
  // sending one entry per text node.
  //
  // Here rather than in content.js for the same reason issueSegments is: this
  // is byte arithmetic over the flattened string, and an off-by-one silences
  // the wrong run without anything looking broken.  The spans are the
  // byteStart, byteEnd and lang records collectVisibleText builds, in document
  // order.  A run absorbs the separator bytes between its own nodes, which sit
  // under the same declaration, but never a span that declared something else
  // or nothing.
  function langSpans(spans) {
    const runs = [];
    let previous = null;
    for (const span of spans) {
      if (typeof span.lang !== "string") {
        // An undeclared span breaks the run rather than being folded through:
        // extending across it would claim bytes no declaration covers.
        previous = null;
        continue;
      }
      // Folding across the gap a block separator left is right, because that
      // gap sits between two nodes under the same declaration.
      if (previous && previous.lang === span.lang) {
        runs[runs.length - 1].end = span.byteEnd;
      } else {
        runs.push({ start: span.byteStart, end: span.byteEnd, lang: span.lang });
      }
      previous = span;
    }
    return runs;
  }

  // The rule type and severity travel as identifiers; only these labels say
  // what they mean to a reader.  Kept here so the page tooltip and the popup
  // card cannot drift into two vocabularies.
  const RULE_TYPE_LABELS = {
    political_coloring: "政治色彩用語",
    cross_strait: "對岸用語",
    typo: "錯別字",
    confusable: "易混淆字詞",
    case: "大小寫",
    punctuation: "標點符號",
    variant: "異體字",
    grammar: "文法",
    ai_style: "AI 語感",
    repetition: "重複字詞",
    translationese: "翻譯腔",
  };

  const SEVERITY_LABELS = { error: "錯誤", warning: "警告", info: "資訊" };

  function ruleTypeLabel(ruleType) {
    return RULE_TYPE_LABELS[ruleType] || ruleType;
  }

  function severityLabel(severity) {
    return SEVERITY_LABELS[severity] || severity;
  }

  function tooltipForIssue(issue) {
    const suggestion = issue.suggestions.length
      ? `建議：${issue.suggestions.join("、")}`
      : "無自動建議";
    const context = issue.context ? `\n說明：${issue.context}` : "";
    const english = issue.english ? `\nEnglish：${issue.english}` : "";
    return `${issue.found} — ${ruleTypeLabel(issue.rule_type)} / ${severityLabel(issue.severity)}\n${suggestion}${context}${english}`;
  }

  return {
    RULE_TYPE_LABELS,
    SEVERITY_LABELS,
    byteOffsetToCodeUnit,
    filterExtensionIgnoredIssues,
    issueSegments,
    langSpans,
    normalizeIssue,
    ruleTypeLabel,
    severityLabel,
    shouldHideExtensionIssue,
    shouldIgnoreExtensionIssue,
    tooltipForIssue,
    utf8ByteLength,
  };
});
