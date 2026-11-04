#!/usr/bin/env node
// Capture the Chrome Web Store screenshots from the real extension code running
// in real Chromium, at the two sizes the store accepts. Nothing is drawn or
// retouched: shot 1 is the scanned sample page with its findings marked in
// place, shot 2 is the popup panel after that same scan, framed on a plain
// background.
//
// One thing the harness stands in for: the toolbar click. Headless Chromium
// cannot grant activeTab (it needs a real gesture on the extension action), so
// the collector, the WASM scan in the service worker, the highlighter and the
// popup rendering all run through their production code paths while the harness
// carries the three messages the click would have carried. The visible result
// is what a user sees after clicking the icon.
//
// Run from the extension directory with the WASM built:
//   node scripts/store-screenshots.mjs

import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const extensionPath = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(extensionPath, "src");
const outDir = path.join(extensionPath, "store-assets");

const DEMO_PAGE = `<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="utf-8" />
    <title>產品團隊週報：資料平台的下一階段</title>
    <style>
      body {
        margin: 0;
        background: #f6f4ef;
        color: #23201a;
        font-family: "PingFang TC", "Noto Sans TC", sans-serif;
        line-height: 1.9;
      }
      article {
        max-width: 720px;
        margin: 0 auto;
        padding: 72px 40px 96px;
      }
      h1 {
        font-size: 34px;
        line-height: 1.4;
        margin: 0 0 8px;
      }
      .meta {
        color: #8a8375;
        font-size: 14px;
        margin-bottom: 36px;
      }
      h2 {
        font-size: 21px;
        margin: 40px 0 12px;
      }
      p {
        font-size: 17px;
        margin: 0 0 18px;
      }
    </style>
  </head>
  <body>
    <article>
      <h1>產品團隊週報：資料平台的下一階段</h1>
      <p class="meta">產品團隊 · 內部週報</p>
      <p>
        這個版本我們把軟件的存取層重寫了一遍,新的數據庫封裝可以直接部署到測試環境,
        遞歸算法也改寫成迭代版本,遍歷鏈表的記憶體用量因此下降。
      </p>
      <h2>本週完成</h2>
      <p>
        網絡層的錯誤重試補上了退避邏輯,打印報表的排程挪到離峰時段...
        搜索索引重建完成,硬盤用量剩下原本的一半!!!
      </p>
      <h2>下週規劃</h2>
      <p>
        端點權限會依照角色分開設定,質量檢查加入到部署流程裡面。若有問題,請在週會前提出口徑一致的建議!!!
      </p>
    </article>
  </body>
</html>`;

const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 600;
const SHOT_WIDTH = 1280;
const SHOT_HEIGHT = 800;
const SCAN_OPTIONS = {
  profile: "base",
  spacing: "require",
  relaxed: false,
  off: [],
  symbol_handling: "warn",
};

function serve(html) {
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function extensionWorker(context) {
  return context.serviceWorkers()[0] ?? context.waitForEvent("serviceworker", { timeout: 30_000 });
}

// The content script listens through chrome.runtime; on the sample page the
// harness is that runtime, so the same three messages reach the same handlers.
function dispatchToPage(page, message) {
  return page.evaluate(
    (payload) =>
      new Promise((resolve) => {
        window.__zhtwListener(payload, null, (response) => resolve(response));
      }),
    message,
  );
}

async function waitForFindings(popup) {
  await popup.waitForFunction(
    () => document.querySelectorAll("#issue-list li:not(.issue--empty)").length > 0,
    null,
    { timeout: 30_000 },
  );
}

// Shot 2 frames the real popup on a plain background with the name and what the
// panel shows. The words describe the panel, so a reader knows what to look at;
// the panel itself is unedited.
function compositeHtml(popupDataUrl) {
  return `<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${SHOT_WIDTH}px;
        height: ${SHOT_HEIGHT}px;
        background: #f6f4ef;
        color: #23201a;
        font-family: "PingFang TC", "Noto Sans TC", sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 90px;
      }
      .pitch { width: 460px; }
      .name {
        font-size: 58px;
        font-weight: 700;
        letter-spacing: 6px;
        margin-bottom: 10px;
      }
      .tagline {
        font-size: 24px;
        color: #5c5546;
        margin-bottom: 34px;
      }
      .points { list-style: none; font-size: 19px; line-height: 1.8; }
      .points li { margin-bottom: 14px; padding-left: 26px; position: relative; }
      .points li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 12px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #b3261e;
      }
      img {
        width: ${POPUP_WIDTH * 1.2}px;
        height: ${POPUP_HEIGHT * 1.2}px;
        border-radius: 18px;
        box-shadow: 0 24px 60px rgba(35, 32, 26, 0.22);
      }
    </style>
  </head>
  <body>
    <div class="pitch">
      <div class="name">字正腔圓</div>
      <div class="tagline">在你閱讀的網頁上，標出正體中文該怎麼寫</div>
      <ul class="points">
        <li>每個問題都附上原因與建議寫法</li>
        <li>點一下卡片，回到頁面上的標記位置</li>
        <li>檢查強度、中英數字間距與規則都可調整</li>
      </ul>
    </div>
    <img src="${popupDataUrl}" alt="字正腔圓 popup 顯示掃描結果" />
  </body>
</html>`;
}

async function main() {
  const server = await serve(DEMO_PAGE);
  const profile = await mkdtemp(path.join(tmpdir(), "zhtw-store-shots-"));
  let context;

  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    const worker = await extensionWorker(context);
    const extensionId = new URL(worker.url()).host;

    // The sample page, scanned the way the extension scans it: the same four
    // scripts in the same order, the same collect message, the same scan.
    const article = await context.newPage();
    await article.setViewportSize({ width: SHOT_WIDTH, height: SHOT_HEIGHT });
    await article.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: {
            addListener: (listener) => {
              window.__zhtwListener = listener;
            },
          },
        },
      };
    });
    const { port } = server.address();
    await article.goto(`http://127.0.0.1:${port}/`);
    await article.addStyleTag({ path: path.join(extensionPath, "styles", "content.css") });
    for (const file of ["shared.js", "symbols.js", "editable.js", "content.js"]) {
      await article.addScriptTag({ path: path.join(srcDir, file) });
    }

    const collected = await dispatchToPage(article, {
      type: "COLLECT_TEXT",
      symbol_handling: SCAN_OPTIONS.symbol_handling,
    });
    if (!collected?.ok) {
      throw new Error(`Could not collect the sample page: ${collected?.error}`);
    }

    // The scan runs through the extension's own scanner module, the same code
    // the service worker runs it with. A service worker cannot import() on
    // demand, so the module runs in an extension page here; the scanner and the
    // WASM behind it are byte for byte the production ones.
    const workPage = await context.newPage();
    await workPage.goto(`chrome-extension://${extensionId}/popup.html`);
    const scanResult = await workPage.evaluate(
      async ({ text, options }) => {
        const { scanText } = await import(chrome.runtime.getURL("src/scanner.js"));
        return scanText(text, options);
      },
      {
        text: collected.text,
        options: {
          ...SCAN_OPTIONS,
          lang_spans: collected.lang_spans || [],
          excluded_spans: collected.excluded_spans || [],
        },
      },
    );
    await workPage.close();
    if (!scanResult.issues.length) {
      throw new Error("The sample page produced no findings; the screenshots would show nothing.");
    }

    const highlighted = await dispatchToPage(article, {
      type: "HIGHLIGHT_ISSUES",
      issues: scanResult.issues,
    });
    if (!highlighted?.ok) {
      throw new Error(`Could not mark the findings: ${highlighted?.error}`);
    }

    await article.bringToFront();
    await article.screenshot({ path: path.join(outDir, "screenshot-1-page-marks.png") });

    // The panel renders the result exactly as it renders the one the background
    // sends; the harness only answers the message the toolbar click would have
    // started, so every card, label and reason on screen is the popup's own.
    const popup = await context.newPage();
    await popup.setViewportSize({ width: POPUP_WIDTH, height: POPUP_HEIGHT });
    await popup.addInitScript((result) => {
      const original = chrome.runtime.sendMessage.bind(chrome.runtime);
      chrome.runtime.sendMessage = (message, callback) => {
        if (message && message.type === "RUN_SCAN_ACTIVE_TAB") {
          const response = { ok: true, result };
          if (typeof callback === "function") {
            callback(response);
            return;
          }
          return Promise.resolve(response);
        }
        return original(message, callback);
      };
    }, {
      ...scanResult,
      badge_count: scanResult.badge_count,
      options: SCAN_OPTIONS,
      page_title: "產品團隊週報：資料平台的下一階段",
      page_url: "",
      scanned_at: new Date().toISOString(),
    });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await waitForFindings(popup);

    const popupShot = path.join(outDir, "popup-panel.png");
    await popup.screenshot({ path: popupShot });
    const popupBase64 = (await readFile(popupShot)).toString("base64");

    const composite = await context.newPage();
    await composite.setViewportSize({ width: SHOT_WIDTH, height: SHOT_HEIGHT });
    await composite.setContent(compositeHtml(`data:image/png;base64,${popupBase64}`));
    await composite.bringToFront();
    await composite.screenshot({ path: path.join(outDir, "screenshot-2-popup-findings.png") });

    await rm(popupShot, { force: true });
    console.log(`Wrote ${path.join(outDir, "screenshot-1-page-marks.png")}`);
    console.log(`Wrote ${path.join(outDir, "screenshot-2-popup-findings.png")}`);
    console.log(`Findings shown: ${scanResult.issues.length}`);
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
    server.close();
  }
}

await mkdir(outDir, { recursive: true });
await main();
