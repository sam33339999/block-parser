/**
 * Parses a JSON document object and converts it to HTML.
 * @param {object} jsonDocument The JSON document object.
 * @returns {string} The HTML string.
 */
function parseJsonToHtml(jsonDocument) {
    if (!jsonDocument || !jsonDocument.document || !Array.isArray(jsonDocument.document.blocks)) {
        console.error("Invalid JSON document structure");
        return "<p>Error: Invalid JSON document structure</p>";
    }

    let html = \'\'; // Initialize html as an empty string
    jsonDocument.document.blocks.forEach(block => {
        switch (block.type) {
            case \'heading\':
                html += handleHeading(block.data);
                break;
            case \'paragraph\':
                html += handleParagraph(block.data);
                break;
            case \'code\':
                html += handleCode(block.data);
                break;
            case \'mermaid\':
                html += handleMermaid(block.data);
                break;
            case \'table\':
                html += handleTable(block.data);
                break;
            case \'layoutColumns\':
                html += handleLayoutColumns(block.data);
                break;
            default:
                console.warn(`Unsupported block type: ${block.type}`);
        }
    });
    return html;
}

/**
 * Handles heading blocks.
 * @param {object} data The data object for the heading block.
 * @returns {string} The HTML string for the heading.
 */
function handleHeading(data) {
    if (!data || !data.text || !data.level) {
        return \'\';
    }
    const level = Math.max(1, Math.min(6, parseInt(data.level, 10)));
    const anchorId = data.anchorId ? ` id="${data.anchorId}"` : \'\';
    let anchorLink = \'\';
    if (data.anchorId) {
        // The anchor link will be styled with CSS to be less obtrusive
        anchorLink = ` <a href="#${data.anchorId}" class="anchor-link" aria-label="Link to this section">#</a>`;
    }
    // Escape HTML in text to prevent XSS, but allow anchorLink HTML
    const escapedText = data.text.replace(/[&<>\'\"/]/g, function (s) {
        return {
            \'&\': \'&amp;\',
            \'<\': \'&lt;\',
            \'>\': \'&gt;\',
            \'\"\': \'&quot;\',
            "\'\": \'&#39;\',
            \'/\': \'&#x2F;\'
        }[s];
    });
    return `<h${level}${anchorId}>${escapedText}${anchorLink}</h${level}>\n`;
}

/**
 * Handles paragraph blocks.
 * @param {object} data The data object for the paragraph block.
 * @returns {string} The HTML string for the paragraph.
 */
function handleParagraph(data) {
    if (!data || typeof data.text !== \'string\') {
        return \'\';
    }
    // Basic Markdown to HTML conversion for bold and italic
    // Escape HTML first, then apply markdown
    let text = data.text.replace(/[&<>\'\"/]/g, function (s) {
        return {
            \'&\': \'&amp;\',
            \'<\': \'&lt;\',
            \'>\': \'&gt;\',
            \'\"\': \'&quot;\',
            "\'\": \'&#39;\',
            \'/\': \'&#x2F;\'
        }[s];
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, \'<strong>$1</strong>\'); // Bold
    text = text.replace(/\*([^*]+)\*/g, \'<em>$1</em>\');       // Italic
    return `<p>${text}</p>\n`;
}

/**
 * Handles code blocks.
 * @param {object} data The data object for the code block.
 * @returns {string} The HTML string for the code block.
 */
function handleCode(data) {
    if (!data || typeof data.code !== \'string\') {
        return \'\';
    }
    const language = data.language ? `language-${data.language}` : \'language-none\';
    // Escape HTML within the code block to display it correctly
    const escapedCode = data.code.replace(/[&<>\'\"/]/g, function (s) {
        return {
            \'&\': \'&amp;\',
            \'<\': \'&lt;\',
            \'>\': \'&gt;\',
            \'\"\': \'&quot;\',
            "\'\": \'&#39;\',
            \'/\': \'&#x2F;\'
        }[s];
    });
    return `<pre><code class="${language}">${escapedCode}</code></pre>\n`;
}

/**
 * Handles Mermaid diagram blocks.
 * @param {object} data The data object for the Mermaid block.
 * @returns {string} The HTML string for the Mermaid diagram.
 */
function handleMermaid(data) {
    if (!data || typeof data.code !== \'string\') {
        return \'\';
    }
    // Mermaid code should not be HTML escaped as the library processes it directly.
    // However, to prevent XSS if the content is somehow displayed raw before mermaid processing,
    // it\'s a good practice to ensure it\'s within a container that won\'t misinterpret it.
    // The Mermaid library itself will handle the rendering.
    const escapedMermaidCode = data.code.replace(/[&<>\'\"/]/g, function (s) {
        return {
            \'&\': \'&amp;\',
            \'<\': \'&lt;\',
            \'>\': \'&gt;\',
            \'\"\': \'&quot;\',
            "\'\": \'&#39;\',
            \'/\': \'&#x2F;\'
        }[s];
    });
    return `<div class="mermaid">${escapedMermaidCode}</div>\n`;
}

/**
 * Handles table blocks.
 * @param {object} data The data object for the table block.
 * @returns {string} The HTML string for the table.
 */
function handleTable(data) {
    if (!data || !Array.isArray(data.headers) || !Array.isArray(data.rows)) {
        return \'\';
    }
    let tableHtml = \'<table>\n\';
    // Table headers
    tableHtml += \'  <thead>\n    <tr>\n\';
    data.headers.forEach(header => {
        const escapedHeader = String(header).replace(/[&<>\'\"/]/g, function (s) {
            return {
                \'&\': \'&amp;\',
                \'<\': \'&lt;\',
                \'>\': \'&gt;\',
                \'\"\': \'&quot;\',
                "\'\": \'&#39;\',
                \'/\': \'&#x2F;\'
            }[s];
        });
        tableHtml += `      <th>${escapedHeader}</th>\n`;
    });
    tableHtml += \'    </tr>\n  </thead>\n\';

    // Table rows
    tableHtml += \'  <tbody>\n\';
    data.rows.forEach(row => {
        tableHtml += \'    <tr>\n\';
        if (Array.isArray(row)) {
            row.forEach(cell => {
                const escapedCell = String(cell).replace(/[&<>\'\"/]/g, function (s) {
                    return {
                        \'&\': \'&amp;\',
                        \'<\': \'&lt;\',
                        \'>\': \'&gt;\',
                        \'\"\': \'&quot;\',
                        "\'\": \'&#39;\',
                        \'/\': \'&#x2F;\'
                    }[s];
                });
                tableHtml += `      <td>${escapedCell}</td>\n`;
            });
        }
        tableHtml += \'    </tr>\n\';
    });
    tableHtml += \'  </tbody>\n</table>\n\';
    return tableHtml;
}

/**
 * Handles layout columns blocks.
 * @param {object} data The data object for the layout columns block.
 * @returns {string} The HTML string for the layout columns.
 */
function handleLayoutColumns(data) {
    if (!data || !data.columnCount || !Array.isArray(data.columns)) {
        return \'\';
    }
    const columnCount = parseInt(data.columnCount, 10);
    // Using CSS classes for flexible column layout (e.g., with Flexbox or Grid)
    // The actual styling will be handled in CSS.
    let columnsHtml = `<div class="layout-columns columns-${columnCount}">\n`;
    data.columns.forEach((column, index) => {
        columnsHtml += `  <div class="column column-${index + 1}">\n`;
        if (Array.isArray(column)) {
            column.forEach(block => {
                // Recursively parse blocks within each column
                // This requires the main parseJsonToHtml or a similar dispatcher
                // For now, let\'s assume block is a standard block structure
                if (block && block.type && block.data) {
                    switch (block.type) {
                        case \'heading\':
                            columnsHtml += handleHeading(block.data);
                            break;
                        case \'paragraph\':
                            columnsHtml += handleParagraph(block.data);
                            break;
                        case \'code\':
                            columnsHtml += handleCode(block.data);
                            break;
                        case \'mermaid\':
                            columnsHtml += handleMermaid(block.data);
                            break;
                        case \'table\':
                            columnsHtml += handleTable(block.data);
                            break;
                        // Note: Avoid nesting layoutColumns directly within layoutColumns via this simple recursive call
                        // A more robust parser might handle depth or specific constraints.
                        default:
                            console.warn(`Unsupported block type in column: ${block.type}`);
                    }
                }
            });
        }
        columnsHtml += \'  </div>\n\';
    });
    columnsHtml += \'</div>\n\';
    return columnsHtml;
}

// Example Usage (for testing purposes):
/*
const exampleJson = {
  "document": {
    "blocks": [
      {
        "type": "heading",
        "data": { "level": 1, "text": "文章標題", "anchorId": "title1" }
      },
      {
        "type": "paragraph",
        "data": { "text": "這是第一段內容，包含 **粗體** 和 *斜體* 文字。" }
      },
      {
        "type": "code",
        "data": { "language": "javascript", "code": "console.log(\'Hello, world!\');\nconst x = 10;" }
      },
      {
        "type": "mermaid",
        "data": { "code": "graph TD;\nA-->B;" }
      },
      {
        "type": "table",
        "data": {
          "headers": ["姓名", "年齡"],
          "rows": [
            ["小明", "20"],
            ["小華", "22"]
          ]
        }
      },
      {
        "type": "layoutColumns",
        "data": {
          "columnCount": 2,
          "columns": [
            [
              { "type": "paragraph", "data": { "text": "這是第一欄。" } },
              { "type": "code", "data": { "language": "css", "code": ".column { padding: 10px; }" } }
            ],
            [
              { "type": "paragraph", "data": { "text": "這是第二欄。" } },
              { "type": "heading", "data": { "level": 3, "text": "欄內標題" } }
            ]
          ]
        }
      }
    ]
  }
};

console.log(parseJsonToHtml(exampleJson));

const testJsonForXSS = {
    "document": {
        "blocks": [
            {
                "type": "heading",
                "data": { "level": 1, "text": "<script>alert(\'XSS in heading\')</script>" }
            },
            {
                "type": "paragraph",
                "data": { "text": "Test XSS <img src=x onerror=alert(\'XSS in paragraph\')>" }
            },
            {
                "type": "code",
                "data": { "language": "html", "code": "<script>alert(\'XSS in code\')</script>" }
            },
            {
                "type": "mermaid",
                "data": { "code": "graph TD;\nA[<img src=x onerror=alert(\'XSS in mermaid\')>]-->B;" }
            },
            {
                "type": "table",
                "data": {
                    "headers": ["<script>alert(\'XSS in header\')</script>"],
                    "rows": [
                        ["<img src=x onerror=alert(\'XSS in cell\')>"]
                    ]
                }
            }
        ]
    }
};
console.log("Testing XSS escaping:");
console.log(parseJsonToHtml(testJsonForXSS));

*/
