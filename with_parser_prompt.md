結構化的區塊式 JSON (類似 Blocknote 或 Notion API 的思路) 會是您的首選。以下是如何針對 LLM 輸出進行優化設計，並提供一些範例：

核心原則：

1. **最小化 LLM 輸出**： LLM 只需要提供內容和「意圖」(例如，這是一級標題、這是一個包含兩欄的佈局)。
2. **清晰的區塊類型 (Block Types)**： 定義一組有限但能涵蓋您需求的區塊類型。
3. **數據驅動樣式**： 樣式和佈局的具體實現（HTML/CSS）由您的前端模板引擎根據 LLM 輸出的 JSON 數據來處理。
4. **指令清晰**： 您給 LLM 的指令 (prompt) 需要清晰地說明期望的 JSON 結構和可用的區塊類型。

建議的 Schema 設計 (針對 LLM 輸出優化)：

這個 schema 旨在讓 LLM 容易理解和生成，同時也方便您的後端或前端進行解析和渲染。

```json
{
  "document": {
    "title": "文章主標題 (可選，或由第一個 heading 區塊決定)",
    "blocks": [
      // 每個元素都是一個內容區塊
    ]
  }
}
```

**區塊 (Block) 的通用結構：**

```json
{
  "type": "block_type_name", // 例如："heading", "paragraph", "code", "mermaid", "table", "layoutColumns"
  "data": {
    // 特定於該區塊類型的數據
  }
}
```

**針對您需求的區塊類型範例：**

**標題 (Heading) + 文內錨點 (Anchor)：**
1. LLM 只需要提供級別和文本。錨點可以由您的系統根據標題文本自動生成，或允許 LLM 建議一個 anchorId。

```json
{
  "type": "heading",
  "data": {
    "level": 1, // 1-6
    "text": "這是一個帶錨點的主標題",
    "anchorId": "main-title" // LLM 可選提供，或由系統生成
  }
}
```

2. **段落 (Paragraph)：**
```json
{
  "type": "paragraph",
  "data": {
    "text": "這是一段普通的文字內容。\n包含一個換行。\n可以包含 **粗體**、****也是粗體**** 或 *斜體*。\n這是一段 [color:red]紅色文字[/color]，以及一段帶有 [bgColor:yellow]黃色背景的文字[/bgColor]。\n最後是 [color:blue,bgColor:lightgray]藍色文字和淺灰色背景[/color]。"
    // 或者更結構化：
    // "richText": [
    //   { "type": "text", "content": "這是第一行。\n這是第二行。" },
    //   { "type": "text", "content": "粗體", "marks": ["bold"] },
    //   { "type": "text", "content": " 和 " },
    //   { "type": "text", "content": "斜體", "marks": ["italic"] },
    //   { "type": "text", "content": "\n[color:green]綠色文字[/color]" }
    // ]
  }
}
```
- 註：對於富文本，您可以讓 LLM 輸出簡化的 Markdown 內聯格式，然後由您的渲染器處理；或者定義更細緻的 *richText* 結構。前者對 LLM 更友好，後者控制更精確但 token 可能稍多。

3. **Mermaid 圖表：**
```json
{
  "type": "mermaid",
  "data": {
    "code": "graph TD;\nA-->B;\nB-->C;"
  }
}
```

4. **程式碼區塊 (Code Block)：**
```json
{
  "type": "code",
  "data": {
    "language": "javascript", // LLM 指定語言
    "code": "console.log('Hello, LLM!');"
  }
}
```

5. **表格 (Table)：**
```json
{
  "type": "table",
  "data": {
    "hasHeader": true,
    "headers": ["姓名", "年齡", "城市"],
    "rows": [
      ["愛麗絲", 30, "台北"],
      ["鮑勃", 24, "紐約"]
    ]
  }
}
```
- *或者更結構化的儲存每個 cell：*

```json
// {
//   "type": "table",
//   "data": {
//     "headers": [ { "text": "姓名" }, { "text": "年齡" } ],
//     "rows": [
//       [ { "text": "愛麗絲" }, { "text": "30" } ],
//       [ { "text": "鮑勃" }, { "text": "24" } ]
//     ]
//   }
// }
```

6. **同行多區塊並排 (Layout Columns)：**
- 這是關鍵。LLM 指定有幾欄，以及每一欄裡面包含哪些區塊


```json
{
  "type": "layoutColumns",
  "data": {
    "columnCount": 2, // 例如 2 或 3
    "distribution": ["50%", "50%"], // 可選，讓 LLM 建議比例，或由模板預設
    "columns": [
      [ // 第一欄的區塊列表
        {
          "type": "paragraph",
          "data": { "text": "這是左側欄位的內容。" }
        },
        {
          "type": "image", // 假設您還有圖片區塊
          "data": { "url": "image_left.png", "caption": "左圖" }
        }
      ],
      [ // 第二欄的區塊列表
        {
          "type": "paragraph",
          "data": { "text": "這是右側欄位的內容。" }
        },
        {
          "type": "code",
          "data": { "language": "python", "code": "print('Hello from right column')" }
        }
      ]
    ]
  }
}
```

# 如何引導 LLM 輸出此格式
您需要在給 LLM 的 prompt 中包含以下信息：

1. **角色和目標：** "你是一個內容生成助手，請根據我的要求生成內容，並以特定 JSON 格式輸出。"
2. **JSON 結構說明：** 清晰地描述最外層結構 (`document.blocks`) 以及每個區塊的 `type` 和 `data` 結構。
3. **可用的區塊類型列表：** 明確告知 LLM 它可以使用哪些 type (e.g., `heading`, `paragraph`, `code`, `mermaid`, `table`, `layoutColumns`)。
4. **每個區塊的 data 字段說明：** 對於每種 type，說明其 data 對象中應包含哪些字段及其含義（例如，`heading` 的 `level` 和 `text`）。
5. **範例 (Few-shot examples)：** 提供一兩個簡單的完整 JSON 輸出範例，展示如何組合不同的區塊。

**範例 Prompt 片段：**
```markdown
請為我撰寫一篇關於 [您的主題] 的部落格文章。
請將輸出格式化為 JSON 對象，結構如下：
{
  "document": {
    "blocks": [
      // 內容區塊陣列
    ]
  }
}

每個區塊對象應包含 "type" 和 "data" 字段。
支持的 "type" 包括：
- "heading": data 包含 "level" (數字 1-6) 和 "text" (字符串)。可選 "anchorId" (字符串)。
- "paragraph": data 包含 "text" (字符串)。
  - 字符串中的 `\n` 會被轉換為換行。
  - 支持 Markdown 內聯格式，如 `**粗體**`、`****也是粗體****` 和 `*斜體*`。
  - 支持顏色標籤，如 `[color:red]文字[/color]`、`[bgColor:yellow]文字[/bgColor]` 或 `[color:red,bgColor:yellow]文字[/color]`。
- "code": data 包含 "language" (字符串，如 "javascript", "python") 和 "code" (字符串)。
- "mermaid": data 包含 "code" (Mermaid 語法字符串)。
- "table": data 包含 "headers" (字符串陣列) 和 "rows" (二維字符串陣列)。
- "layoutColumns": data 包含 "columnCount" (數字，如 2 或 3) 和 "columns" (一個陣列，每個元素是該欄的區塊列表)。

例如，一個包含標題和段落的簡單輸出可能如下：
{
  "document": {
    "title": "範例文章標題",
    "blocks": [
      {
        "type": "heading",
        "data": { "level": 1, "text": "文章標題", "anchorId": "title1" }
      },
      {
        "type": "paragraph",
        "data": { "text": "這是一段普通的文字內容。\n包含一個換行。\n可以包含 **粗體**、****也是粗體**** 或 *斜體*。\n這是一段 [color:red]紅色文字[/color]，以及一段帶有 [bgColor:yellow]黃色背景的文字[/bgColor]。\n最後是 [color:blue,bgColor:lightgray]藍色文字和淺灰色背景[/color]。"}
      }
    ]
  }
}

現在，請根據以上說明和主題 [您的主題] 生成內容。
```

優點：

- **Token 高效：** LLM 只輸出結構化數據，避免了 HTML 標籤、CSS 類名等冗余信息。
- **模板化渲染：** 您可以創建對應這些 JSON 結構的模板組件 (React, Vue, Svelte, 或後端模板引擎)，實現樣式的統一和快速套用。
- **內容與表現分離：** 方便後續修改樣式或更換模板，而無需重新生成內容。
- **可預測性：** 清晰的 schema 使得 LLM 的輸出更可預測和易於驗證。
- **可擴展性：** 未來需要新的內容樣式時，只需定義新的 type 並在模板中實現對應的渲染邏輯。

這種方式將 LLM 的強項（內容理解和生成）與傳統軟體開發的強項（結構化數據處理和模板化渲染）完美結合，是實現您目標的理想途徑。



PROMPTS:

```
你好！你是一個內容生成助手。你的任務是根據我的要求生成內容，並將這些內容嚴格按照指定的 JSON 格式輸出。

請為我撰寫一篇關於 **[請在此處填寫您的主題]** 的文章。

**輸出格式要求：**

請將完整的輸出內容格式化為一個 JSON 物件。該 JSON 物件的根層級應包含一個 `document` 鍵，其值為一個包含以下內容的物件：
- `title` (可選): 字串，代表文章主標題。如果未提供，則可由第一個 `heading` 區塊決定。
- `blocks`: 一個陣列，其中每個元素都是一個描述內容區塊的 JSON 物件。

**區塊 (Block) 結構：**

每個內容區塊物件都必須包含以下兩個鍵：
1.  `type`: 字串，表示區塊的類型。
2.  `data`: 一個 JSON 物件，包含該區塊類型特定的數據。

**支持的區塊類型 (`type`) 及其 `data` 結構：**

1.  **`heading`** (標題)
    *   `data`:
        *   `level`: 數字，表示標題級別 (1 到 6)。
        *   `text`: 字串，標題的文字內容。
        *   `anchorId` (可選): 字串，用於文內錨點。如果未提供，系統可能會自動生成。

2.  **`paragraph`** (段落)
    *   `data`:
        *   `text`: 字串，段落的文字內容。
          - 字符串中的 `\n` 會被轉換為換行。
          - 支持 Markdown 內聯格式，如 `**粗體**`、`****也是粗體****` 和 `*斜體*`。
          - 支持顏色標籤，如 `[color:red]文字[/color]`、`[bgColor:yellow]文字[/bgColor]` 或 `[color:red,bgColor:yellow]文字[/color]`。

3.  **`code`** (程式碼區塊)
    *   `data`:
        *   `language`: 字串，指定程式碼的語言 (例如："javascript", "python", "html")。
        *   `code`: 字串，實際的程式碼內容。

4.  **`mermaid`** (Mermaid 圖表)
    *   `data`:
        *   `code`: 字串，Mermaid 圖表的語法定義。

5.  **`table`** (表格)
    *   `data`:
        *   `hasHeader` (可選): 布林值 (true/false)，指示表格是否有表頭。建議 LLM 盡可能提供此欄位，若適用則設為 `true`。
        *   `headers`: 一個字串陣列，代表表頭的各個儲存格內容 (僅當 `hasHeader` 為 `true` 或預期有表頭時相關)。
        *   `rows`: 一個二維字串陣列。每個內部陣列代表表格的一行，其中每個元素是該行對應儲存格的字串內容。

6.  **`layoutColumns`** (同行多區塊並排 / 欄位佈局)
    *   `data`:
        *   `columnCount`: 數字，表示欄位的數量 (例如：2 或 3)。
        *   `distribution` (可選): 一個字串陣列，表示各欄位的寬度比例 (例如：`["50%", "50%"]`, `["1fr", "2fr"]`)。如果未提供，可使用均分。
        *   `columns`: 一個陣列，其長度應等於 `columnCount`。此陣列的每個元素本身又是一個**區塊物件的陣列**，代表該欄位内包含的內容區塊。這些內嵌的區塊物件同樣遵循本提示中定義的 `type` 和 `data` 結構。

**輸出範例：**

以下是一個簡單的 JSON 輸出範例，包含一個一級標題和一個段落：
```json
{
  "document": {
    "title": "範例文章標題",
    "blocks": [
      {
        "type": "heading",
        "data": {
          "level": 1,
          "text": "這是文章的主標題",
          "anchorId": "main-title-example"
        }
      },
      {
        "type": "paragraph",
        "data": {
          "text": "這是一段普通的文字內容。\n包含一個換行。\n可以包含 **粗體**、****也是粗體**** 或 *斜體*。\n這是一段 [color:red]紅色文字[/color]，以及一段帶有 [bgColor:yellow]黃色背景的文字[/bgColor]。\n最後是 [color:blue,bgColor:lightgray]藍色文字和淺灰色背景[/color]。"
        }
      }
    ]
  }
}
```