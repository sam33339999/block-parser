# JSON 至 HTML 部落格頁面產生器

## 第一階段：JavaScript 解析器核心功能
- [x] 定義 `parseJsonToHtml(jsonDocument)` 函數，作為主要的進入點。
- [x] 實作 `handleHeading(data)` 函數，處理 `heading` 類型區塊，支援 level 1-6 及可選的 `anchorId`，並在標題旁產生錨點連結圖示。
- [x] 實作 `handleParagraph(data)` 函數，處理 `paragraph` 類型區塊，支援簡單 Markdown (粗體 `**text**` 和斜體 `*text*`)。
- [x] 實作 `handleCode(data)` 函數，處理 `code` 類型區塊，使用 `<pre><code class="language-xxx">` 結構，並引入 Prism.js 進行語法高亮。
- [x] 實作 `handleMermaid(data)` 函數，處理 `mermaid` 類型區塊，使用 `<div class="mermaid">` 結構，並引入 Mermaid.js 進行圖表渲染。
- [x] 實作 `handleTable(data)` 函數，處理 `table` 類型區塊，產生標準 HTML 表格結構。
- [x] 實作 `handleLayoutColumns(data)` 函數，處理 `layoutColumns` 類型區塊，使用 CSS Flexbox 或 Grid 實現多欄佈局，並能遞迴處理欄內區塊。
- [x] 確保所有處理函數對輸入數據進行基本的有效性檢查。
- [x] 確保輸出的 HTML 字串是安全轉義的，以防止 XSS 攻擊。

## 第二階段：HTML 頁面與整合
- [x] 建立一個基礎的 `index.html` 頁面，包含一個用於貼上 JSON 的 `<textarea>` 和一個觸發渲染的按鈕。
- [x] 在 `index.html` 中引入 `parser.js`、Prism.js (包含主題 CSS 和 JS) 以及 Mermaid.js。
- [x] 編寫 JavaScript 邏輯，當按鈕被點擊時：
    - [x] 獲取 `<textarea>` 中的 JSON 字串。
    - [x] 使用 `JSON.parse()` 將其轉換為 JavaScript 物件。
    - [x] 呼叫 `parseJsonToHtml()` 函數產生 HTML。
    - [x] 將產生的 HTML 顯示在頁面的指定區域 (例如一個 `<div>`)。
    - [x] 呼叫 `Prism.highlightAll()` 和 `mermaid.run()` 來渲染程式碼和圖表。
- [x] 建立一個 `style.css` 檔案，設計簡潔、清晰、響應式的部落格頁面樣式，參考使用者提供的圖片風格。
    - [x] 設計整體佈局、字體、顏色。
    - [x] 為各種 HTML 元素（標題、段落、表格、程式碼區塊、Mermaid 圖表容器、多欄佈局）提供合適的樣式。
    - [x] 確保頁面在不同螢幕尺寸下均有良好閱讀體驗。

## 第三階段：錯誤修正與 Node.js 相容性
- [x] 修正前端 Prism.js 資源完整性校驗 (SRI hash) 問題，移除 SRI 或更新為正確的 hash。
- [x] 修正 `parser.js` 中 `Cannot access 'html' before initialization` 的變數初始化錯誤。
- [x] 建立 `parser_node.js`，將 `parser.js` 轉換為 Node.js 相容版本。
    - [x] 處理 `export` / `module.exports`。
    - [x] 確保在 Node.js 環境中可以被 `require` 並正常執行。
- [x] 使用使用者提供的長 JSON (`pasted_content.txt`) 在 Node.js 環境中測試 `parser_node.js`，確保能正確產生 HTML。

## 第四階段：最終整合、測試與交付
- [x] 更新 `index.html` 以使用修復後的 `parser.js`。
- [x] 更新 `style.css` 以符合使用者提供的圖片參考，並確保簡潔、響應式設計。
- [x] 在瀏覽器中手動貼上使用者提供的長 JSON (`pasted_content.txt`) 內容，全面測試 `index.html` 的渲染效果。
    - [x] 驗證所有區塊類型（標題、段落、程式碼、Mermaid、表格、多欄）是否正確渲染。
    - [x] 驗證程式碼高亮和 Mermaid 圖表是否正常運作。
    - [x] 驗證錨點連結功能。
    - [x] 驗證響應式設計在不同視窗寬度下的表現。
    - [x] 檢查瀏覽器控制台是否有任何 JavaScript 錯誤。
- [x] 將所有相關檔案 (`index.html`, `parser.js`, `parser_node.js`, `style.css`, `todo.md`) 打包成一個 zip 檔案。
- [x] 向使用者交付 zip 檔案，並提供使用說明。

