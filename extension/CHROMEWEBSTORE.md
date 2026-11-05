# Chrome Web Store Listing: 字正腔圓

> Last Updated: 2026-11-06
> Status: Published. Submitted 2026-11-05, review passed with auto-publish;
> live listing verified 2026-11-06.
> Store URL: https://chromewebstore.google.com/detail/ddlkbcghdkeicelpilkkbfkhdgdanelg
> Extension ID: `ddlkbcghdkeicelpilkkbfkhdgdanelg`
> Support URL (dashboard Website / Support URL): https://github.com/doggy8088/zhtw-mcp/issues

## Store Listing

**Extension Name** [REQUIRED]
<!-- Must match manifest.json "name". Max 75 characters. -->

字正腔圓

**Short Description** [REQUIRED]
<!-- Max 132 characters. Shown in search results and tiles.
     Note: the dashboard derives the item title and summary from the manifest
     package, so the store summary is the manifest "description" (English) and
     the zh-TW copy below is only the listing description. A later release can
     change the manifest description to move the store summary to zh-TW. -->

（繁體中文，49 字）在你閱讀的網頁上找出不合正體中文習慣的用語、標點與文法，並逐句標註建議寫法。

(English alternate, 103 chars) Flags non-standard Traditional Chinese wording, punctuation and grammar on the page you are reading, with suggested fixes.

**Detailed Description** [REQUIRED]
<!-- Max 16,000 characters. CWS strips markdown: the copy below is plain text
     with line breaks. No implementation details, no API or library names. -->

```text
（繁體中文）

檢查你正在閱讀的網頁，找出不合正體中文習慣的用語、標點與文法，把問題直接標在原文位置上，並告訴你正體中文該怎麼寫。

功能
• 一鍵檢查目前分頁的可見文字，問題標在頁面上的原文位置
• 每個問題附上原因與建議寫法，例如「軟件 → 軟體」「遞歸 → 遞迴」
• 工具列徽章顯示警告與錯誤數量，提示層級的發現只列在清單裡
• 點一下問題卡片，畫面捲到頁面上的標記並讓它閃爍提示
• 兩種檢查強度：Base（用語、標點、文法）與 Strict（再加上字形標準）
• 可選擇中文與英數字之間的空格要保留或移除
• UI 文案模式：放寬只適合長篇文章的標點與文法規則
• 可整組停用的規則：用語與詞彙、專有名詞大小寫、半形標點、引號、中英數字間距、全形冒號、頓號、範圍符號、異體字、刪節號、文法、AI 語感、翻譯腔、氣口
• 處理輸入欄的連續符號：Warn 顯示提醒、Remove 移除你剛打出的連續符號、Off 不處理；Markdown 的標題與程式碼圍欄不會被動到
• 一鍵複製修正提示詞，可直接交給 AI 助理批次修正

如何使用
1. 點一下工具列上的字正腔圓圖示
2. 擴充功能自動檢查目前分頁，並把問題標在頁面上
3. 在面板裡閱讀每個問題的原因與建議，點一下卡片回到頁面上的位置
4. 需要調整時，開啟「選項設定」選擇檢查強度、間距與要停用的規則

隱私
所有檢查都在你的裝置上進行。網頁內容不會離開瀏覽器，不傳送到任何伺服器。沒有分析、沒有追蹤、沒有廣告。密碼欄位永遠不會被讀取。唯一的偏好設定（輸入欄連續符號的處理方式）交由 Chrome 的同步功能保存。

權限說明
• 存取目前分頁：只在你開啟面板執行檢查時讀取該分頁顯示的文字，用來標出問題位置。
• 儲存空間：只記住你在選項設定裡做的選擇，讓下次開啟時不用重設。

支援
問題回報與建議：https://github.com/doggy8088/zhtw-mcp/issues

版本 0.1.0：首個公開版本。
```

```text
(English alternate)

Check the page you are reading for wording, punctuation and grammar that does not follow Standard Traditional Chinese usage. Findings are marked in place, each with the reason and the suggested Traditional Chinese form.

FEATURES
• One click checks the visible text of the current tab and marks findings in place
• Every finding comes with a reason and a suggested rewrite, for example 軟件 → 軟體
• The toolbar badge counts warnings and errors; informational notes stay in the list
• Click a finding card to scroll the page to its mark
• Two check strengths: Base (wording, punctuation, grammar) and Strict (adds standard character forms)
• Choose whether spaces between Chinese and Latin text are kept or removed
• UI copy mode relaxes punctuation and grammar rules meant for long-form writing
• Rule families you can switch off wholesale, from vocabulary to translationese
• Repeated-symbol handling for text fields: warn, remove the run you just typed, or off; Markdown headings and code fences are left alone
• Copy a fix prompt in one click and hand it to an AI assistant for batch corrections

HOW TO USE
1. Click the 字正腔圓 icon in the toolbar
2. The extension checks the current tab and marks findings on the page
3. Read each finding's reason and suggestion in the panel; click a card to jump to its mark
4. Open Options to pick the check strength, spacing policy and rules to switch off

PRIVACY
All checking runs on your device. Page content never leaves the browser and is not sent to any server. No analytics, no tracking, no ads. Password fields are never read. The one preference (repeated-symbol handling) is kept by Chrome's own sync.

PERMISSIONS
• Access the current tab: reads the visible text of that tab only when you run a check, to mark findings in place.
• Storage: remembers your option choices so you do not reset them next time.

SUPPORT
Bug reports and suggestions: https://github.com/doggy8088/zhtw-mcp/issues

Version 0.1.0: first public release.
```

**Category** [REQUIRED]

工具 (Tools), in the 提升效率 (Productivity) group

<!-- The dashboard's category picker is a group plus a subcategory, and there is
     no flat "Productivity" to pick. 工具 is the closest subcategory and sits in
     the 提升效率 (Productivity) group. -->`

**Single Purpose** [REQUIRED]

Checks the visible text of the current page for non-standard Traditional Chinese usage and marks each finding with a suggested rewrite.

（繁體中文）檢查目前分頁的可見文字，標出不合正體中文習慣的用語、標點與文法，並附上建議寫法。

**Primary Language** [REQUIRED]

Traditional Chinese (zh-TW)

<!-- The dashboard listing and the manifest name are both 字正腔圓. The manifest
     "description" stays in English as the in-browser string and is 78 characters,
     within the 132 limit; the store short description above is the listing copy. -->

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | icons/icon-128.png |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Ready | store-assets/screenshot-1-page-marks.png |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ✅ Ready | store-assets/screenshot-2-popup-findings.png |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes

Both screenshots are captured from the real extension code running in a real
Chromium, by `scripts/store-screenshots.mjs`, at 1280×800. Nothing in them is
drawn or retouched. The harness stands in only for the toolbar click (headless
Chromium cannot grant `activeTab` without a real gesture on the action): the
collector, the WASM scan, the highlighter and the popup rendering all run their
production code paths, so the images show exactly what a user sees after
clicking the icon.

- Screenshot 1: a sample article page after a scan, with findings marked in the
  text. Shows what the reader sees while writing or reviewing.
- Screenshot 2: the popup panel after the same scan, with finding cards, reasons
  and suggested rewrites. Shows what the user reads to act on a finding.

Screenshot 3 candidate: the popup options section (check strength, spacing,
rule family list). Not required for submission.

## Permissions Justification

<!-- Every permission in manifest.json needs a justification. The review team reads these. -->

| Permission | Type | Justification |
|------------|------|---------------|
| `activeTab` | permissions | Lets the extension read the visible text of the tab you are looking at, but only after you open the panel to run a check. The text is scanned so findings can be marked in place. No other tab is read and nothing is read in the background. |
| `scripting` | permissions | Runs the checker inside that same tab at the moment you ask for a scan, so the findings can be marked on the page and the marks can be removed afterwards. Nothing is injected without your click. |
| `storage` | permissions | Remembers one preference: how repeated symbol runs in text fields are handled (warn, remove, off). Chrome keeps this small setting with its own sync, so it follows your Chrome profile. It contains no page content and no personal data. |

There are no `host_permissions`: the extension touches only the tab you
explicitly scan.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes (one item: your own option choice)

<!-- The disclosure form must match the code and the privacy policy. The code
     reads chrome.storage.sync (src/popup.js) and nothing else: no fetch, no
     analytics, no remote logging. Page text is scanned on the device and
     discarded. The one stored value leaves the device only through Chrome's own
     sync, which the user controls. -->

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | | |
| Health info | No | No | | |
| Financial info | No | No | | |
| Authentication info | No | No | | |
| Personal communications | No | No | | |
| Location | No | No | | |
| Web history | No | No | | |
| User activity | No | No | | |
| Website content | No | No | | |
| User preferences (one option: repeated-symbol handling) | Yes | Yes, through Chrome sync only, and only when the user has Chrome sync on | Remember the choice across sessions and devices | No |

<!-- If the dashboard form has no "user preferences" category, answer the nine
     standard categories with No and describe the one synced preference in the
     free-text field and the privacy policy. The wording must match
     store-assets/privacy-policy.md exactly in substance. -->

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

https://www.duotify.com/PrivacyPolicy/

<!-- Filled at submission, 2026-11-05. The policy lives on the publisher's
     duotify.com site and has to cover this extension's practices (one synced
     preference, no page content off-device). store-assets/privacy-policy.md is
     the reference text for what it needs to say, and the wording must match the
     table above. -->

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

Will 保哥

**Contact Email** [REQUIRED]

doggy.huang@gmail.com (the developer account email on file)

**Support URL / Email** [RECOMMENDED]

https://www.facebook.com/will.fans/

**Homepage URL** [RECOMMENDED]

https://www.facebook.com/will.fans/

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.1.0 | 2026-11-05 | First public release: page scan with findings marked in place, Base and Strict check strengths, spacing and UI-copy options, rule family switches, repeated-symbol handling for text fields, copyable fix prompt. | Published |

<!-- Status options: Draft | Submitted | In Review | Published | Rejected -->

## Review Notes

### Known Issues / Limitations

- Chrome internal pages (`chrome://`, the Web Store, other extensions) cannot be
  scanned; the panel says so instead of failing silently. This is a browser
  restriction, not a defect.
- The scan covers the visible text of the page. Text inside closed disclosure
  widgets or below lazy-loaded content may not be collected until it is shown.
- Password fields are never read, and the check runs locally, so nothing about
  the page leaves the device.

### Submission Readiness

- [x] `manifest_version` is 3
- [x] Version 0.1.0 in manifest.json, package.json and the ZIP name
- [x] Store name matches manifest name (字正腔圓)
- [x] Manifest description within 132 characters
- [x] ZIP built by `scripts/package-store.sh`: no tests, no `node_modules`, no
      README, no CHROMEWEBSTORE.md, no build scripts
- [x] Minimum permissions, every one justified above; no `host_permissions`
- [x] No remotely loaded code, no obfuscation, no source maps in the package
- [x] Store icon 128×128 real PNG; screenshots 1280×800 captured from the real UI
- [x] Privacy policy live at https://www.duotify.com/PrivacyPolicy/
- [x] Developer account and publisher display name (Will 保哥)
- [x] Contact and support URLs (Facebook page as support and homepage)
- [x] Data disclosure form filled to match the Privacy & Data Use table: the nine
      categories answered No, the three certifications checked, remote code
      answered No (the WASM ships inside the package)
- [x] Submitted for review 2026-11-05 with auto-publish on approval

### Rejection History

| Date | Reason | Fix Applied | Resubmitted |
|------|--------|-------------|-------------|
