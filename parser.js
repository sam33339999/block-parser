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

    // 确保下面这行使用的是标准的直单引号 ''
    let html = ''; // Initialize html as an empty string
    jsonDocument.document.blocks.forEach(block => {
        switch (block.type) {
            case 'heading':
                html += handleHeading(block.data);
                break;
            case 'paragraph':
                html += handleParagraph(block.data);
                break;
            case 'code':
                html += handleCode(block.data);
                break;
            case 'mermaid':
                html += handleMermaid(block.data);
                break;
            case 'table':
                html += handleTable(block.data);
                break;
            case 'layoutColumns':
                html += handleLayoutColumns(block.data);
                break;
            case 'image': // 新增 image 类型的处理
                html += handleImage(block.data);
                break;
            case 'anchorLink': // 新增 anchorLink 类型的处理
                html += handleAnchorLink(block.data);
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
        return '';
    }
    const level = Math.max(1, Math.min(6, parseInt(data.level, 10)));
    const anchorId = data.anchorId ? ` id="${data.anchorId}"` : '';
    let anchorLink = '';
    if (data.anchorId) {
        // The anchor link will be styled with CSS to be less obtrusive
        anchorLink = ` <a href="#${data.anchorId}" class="anchor-link" aria-label="Link to this section">#</a>`;
    }
    // Escape HTML in text to prevent XSS, but allow anchorLink HTML
    const escapedText = data.text.replace(/[&<>\'\"/]/g, function (s) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        }[s];
    });
    return `<h${level}${anchorId}>${escapedText}${anchorLink}</h${level}>\n`;
}

/**
 * Handles paragraph blocks.
 * @param {object} data The data object for the paragraph block.
 * @returns {string} The HTML string for the paragraph.
 */
/**
 * Handles paragraph blocks.
 * @param {object} data The data object for the paragraph block.
 * @returns {string} The HTML string for the paragraph.
 * If the paragraph block has a richText array, this function will process it and
 * return the HTML string. If the paragraph block has a text string, this function
 * will convert newline characters to <br> tags and return the HTML string.
 * If the paragraph block has neither a richText array nor a text string, this
 * function will return an empty string.
 */
function handleParagraph(data) {
    if (!data || (typeof data.text !== 'string' && !Array.isArray(data.richText))) {
        console.warn('Paragraph: Missing text or richText array.');
        return '';
    }

    let paragraphContent = '';

    if (Array.isArray(data.richText) && data.richText.length > 0) {
        // Process richText array
        data.richText.forEach(item => {
            if (!item || typeof item.content !== 'string') {
                console.warn('Paragraph richText item: Invalid item or missing content string.', item);
                return; // Skip invalid item
            }

            let textContent = escapeHtml(item.content);

            // Apply custom color/background color tags, assuming '/' in closing tag becomes '&#x2F;'
            textContent = textContent.replace(
                /\[color:([^,\]]+),bgColor:([^,\]]+)\]([\s\S]*?)\[&#x2F;color\]/g,
                (match, color, bgColor, content) => `<span style="color: ${escapeHtml(color.trim())}; background-color: ${escapeHtml(bgColor.trim())};">${content}</span>`
            );
            textContent = textContent.replace(
                /\[color:([^,\]]+)\]([\s\S]*?)\[&#x2F;color\]/g,
                (match, color, content) => `<span style="color: ${escapeHtml(color.trim())};">${content}</span>`
            );
            textContent = textContent.replace(
                /\[bgColor:([^,\]]+)\]([\s\S]*?)\[&#x2F;bgColor\]/g,
                (match, bgColor, content) => `<span style="background-color: ${escapeHtml(bgColor.trim())};">${content}</span>`
            );

            // Convert newline characters to <br> tags
            textContent = textContent.replace(/\n/g, '<br>\n');

            if (Array.isArray(item.marks)) {
                item.marks.forEach(mark => {
                    if (mark === 'bold') {
                        textContent = `<strong>${textContent}</strong>`;
                    } else if (mark === 'italic') {
                        textContent = `<em>${textContent}</em>`;
                    } else if (mark === 'underline') { // Example: adding underline support
                        textContent = `<u>${textContent}</u>`;
                    } else if (mark === 'code') { // Example: inline code
                        textContent = `<code>${textContent}</code>`;
                    }
                    // Add more marks as needed (e.g., strikethrough, superscript)
                });
            }

            if (item.type === 'link' && item.href) {
                const safeHref = escapeHtml(item.href); // Escape for attribute context
                textContent = `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${textContent}</a>`;
            }
            paragraphContent += textContent;
        });
    } else if (typeof data.text === 'string') {
        // Fallback to simple text
        let text = data.text; // Store original text before escaping for logging
        console.log("[parser.js] handleParagraph - Original data.text:", text);

        text = escapeHtml(data.text); // escapeHtml is called on the original data.text
        console.log("[parser.js] handleParagraph - After escapeHtml:", text);

        // Apply custom color/background color tags, assuming '/' in closing tag becomes '&#x2F;'
        text = text.replace(
            /\[color:([^,\]]+),bgColor:([^,\]]+)\]([\s\S]*?)\[&#x2F;color\]/g,
            (match, color, bgColor, content) => {
                const replacement = `<span style="color: ${escapeHtml(color.trim())}; background-color: ${escapeHtml(bgColor.trim())};">${content}</span>`;
                console.log(`[parser.js] handleParagraph - Replacing color/bgColor tag: '${match}' with '${replacement}'`);
                return replacement;
            }
        );
        console.log("[parser.js] handleParagraph - After dual color/bgColor replace:", text);

        text = text.replace(
            /\[color:([^,\]]+)\]([\s\S]*?)\[&#x2F;color\]/g,
            (match, color, content) => {
                const replacement = `<span style="color: ${escapeHtml(color.trim())};">${content}</span>`;
                console.log(`[parser.js] handleParagraph - Replacing color tag: '${match}' with '${replacement}'`);
                return replacement;
            }
        );
        console.log("[parser.js] handleParagraph - After color replace:", text);

        text = text.replace(
            /\[bgColor:([^,\]]+)\]([\s\S]*?)\[&#x2F;bgColor\]/g,
            (match, bgColor, content) => {
                const replacement = `<span style="background-color: ${escapeHtml(bgColor.trim())};">${content}</span>`;
                console.log(`[parser.js] handleParagraph - Replacing bgColor tag: '${match}' with '${replacement}'`);
                return replacement;
            }
        );
        console.log("[parser.js] handleParagraph - After bgColor replace:", text);

        // Convert newline characters to <br> tags
        const oldTextForNewlineCheck = text;
        text = text.replace(/\n/g, '<br>\n');
        if (text !== oldTextForNewlineCheck) {
            console.log("[parser.js] handleParagraph - After newline to <br> conversion:", text);
        }
        
        // Markdown-like conversions (order matters for correctness)
        const oldTextForBold4Check = text;
        text = text.replace(/\*{4}([^*]+)\*{4}/g, '<strong>$1</strong>'); // ****text**** (bold)
        if (text !== oldTextForBold4Check) {
             console.log("[parser.js] handleParagraph - After ****bold**** conversion:", text);
        }

        const oldTextForBold2Check = text;
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); // **text** (Bold)
        if (text !== oldTextForBold2Check) {
            console.log("[parser.js] handleParagraph - After **bold** conversion:", text);
        }

        const oldTextForItalicCheck = text;
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');       // *text* (Italic)
        if (text !== oldTextForItalicCheck) {
            console.log("[parser.js] handleParagraph - After *italic* conversion:", text);
        }
        
        paragraphContent = text;
        console.log("[parser.js] handleParagraph - Final paragraphContent for data.text:", paragraphContent);
    } else {
        console.warn('Paragraph: No valid text or richText found.');
        return '';
    }

    return `<p>${paragraphContent}</p>\n`;
}

/**
 * Handles code blocks.
 * @param {object} data The data object for the code block.
 * @returns {string} The HTML string for the code block.
 */
function handleCode(data) {
    if (!data || typeof data.code !== 'string') {
        return '';
    }
    const language = data.language ? `language-${data.language}` : 'language-none';
    // Escape HTML within the code block to display it correctly
    const escapedCode = data.code.replace(/[&<>\'\"/]/g, function (s) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
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
    if (!data || typeof data.code !== 'string') {
        return '';
    }
    // Mermaid code should not be HTML escaped as the library processes it directly.
    // However, to prevent XSS if the content is somehow displayed raw before mermaid processing,
    // it's a good practice to ensure it's within a container that won't misinterpret it.
    // The Mermaid library itself will handle the rendering.
    const escapedMermaidCode = data.code.replace(/[&<>\'\"/]/g, function (s) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
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
    if (!data || (!Array.isArray(data.headers) && typeof data.hasHeader !== 'boolean') || !Array.isArray(data.rows)) {
        console.warn('Table: Invalid data structure. Missing headers/hasHeader or rows array.');
        return '';
    }

    let tableHtml = '<table>\n';

    // Determine if header should be rendered
    const renderHeader = (typeof data.hasHeader === 'boolean' ? data.hasHeader : (Array.isArray(data.headers) && data.headers.length > 0));

    if (renderHeader && Array.isArray(data.headers) && data.headers.length > 0) {
        tableHtml += '  <thead>\n    <tr>\n';
        data.headers.forEach(headerItem => {
            let headerContent = '';
            if (typeof headerItem === 'string') {
                headerContent = escapeHtml(headerItem);
            } else if (headerItem && typeof headerItem.text === 'string') {
                headerContent = escapeHtml(headerItem.text);
            } else {
                console.warn('Table header item: Invalid format.', headerItem);
            }
            tableHtml += `      <th>${headerContent}</th>\n`;
        });
        tableHtml += '    </tr>\n  </thead>\n';
    }

    // Table rows
    if (Array.isArray(data.rows) && data.rows.length > 0) {
        tableHtml += '  <tbody>\n';
        data.rows.forEach((row, rowIndex) => {
            if (!Array.isArray(row)) {
                console.warn(`Table row ${rowIndex}: Is not an array.`, row);
                return; // Skip invalid row
            }
            tableHtml += '    <tr>\n';
            row.forEach(cellItem => {
                let cellContent = '';
                if (typeof cellItem === 'string') {
                    cellContent = escapeHtml(cellItem);
                } else if (cellItem && typeof cellItem.text === 'string') {
                    cellContent = escapeHtml(cellItem.text);
                } else {
                     console.warn('Table cell item: Invalid format.', cellItem);
                }
                tableHtml += `      <td>${cellContent}</td>\n`;
            });
            tableHtml += '    </tr>\n';
        });
        tableHtml += '  </tbody>\n';
    } else {
        // Optionally render a message if there are no rows, or just an empty tbody
        // Calculate colspan based on headers if they were rendered, otherwise a default large number
        const colspan = (renderHeader && Array.isArray(data.headers) && data.headers.length > 0) ? data.headers.length : 1;
        tableHtml += `  <tbody><tr><td colspan="${colspan > 0 ? colspan : 1}">No data available</td></tr></tbody>\n`;
    }

    tableHtml += '</table>\n';
    return tableHtml;
}

/**
 * Handles layout columns blocks.
 * @param {object} data The data object for the layout columns block.
 * @returns {string} The HTML string for the layout columns.
 */
function handleLayoutColumns(data) {
    if (!data || !data.columnCount || !Array.isArray(data.columns)) {
        console.warn('LayoutColumns: Missing columnCount or columns array.');
        return '';
    }

    const columnCount = parseInt(data.columnCount, 10);
    if (isNaN(columnCount) || columnCount <= 0) {
        console.warn('LayoutColumns: Invalid columnCount.');
        return '';
    }

    if (data.columns.length !== columnCount) {
        console.warn(`LayoutColumns: data.columns.length (${data.columns.length}) does not match columnCount (${columnCount}).`);
        // Depending on desired strictness, could return error or try to adapt.
        // For now, we will proceed to render columns based on columnCount,
        // and content from data.columns if available for that index.
    }

    let layoutContainerClasses = 'layout-columns gap-4'; // Base classes including Tailwind's gap utility
    let layoutContainerStyle = '';

    if (data.distribution && Array.isArray(data.distribution) && data.distribution.length === columnCount) {
        // Basic validation: check if all distribution values are non-empty strings
        const isValidDistributionValue = (val) => typeof val === 'string' && val.trim() !== '';
        const allDistributionValuesValid = data.distribution.every(isValidDistributionValue);

        if (allDistributionValuesValid) {
            layoutContainerClasses += ' grid'; // Ensure display: grid
            layoutContainerStyle = `grid-template-columns: ${data.distribution.join(' ')};`;
        } else {
            console.warn('LayoutColumns: Some distribution values are invalid. Falling back to equal columns.');
            layoutContainerClasses += ` grid grid-cols-${columnCount}`; // Fallback to Tailwind's equal column distribution
        }
    } else {
        if (data.distribution) { // If distribution exists but is invalid (e.g., length mismatch)
            console.warn('LayoutColumns: Distribution array is invalid or its length does not match columnCount. Falling back to equal columns.');
        }
        layoutContainerClasses += ` grid grid-cols-${columnCount}`; // Default or fallback
    }

    let columnsHtml = `<div class="${layoutContainerClasses}" ${layoutContainerStyle ? `style="${escapeHtml(layoutContainerStyle)}"` : ''}>\n`;

    for (let i = 0; i < columnCount; i++) {
        const columnDataArray = data.columns[i]; // Array of blocks for the current column

        columnsHtml += `  <div class="column">\n`; // Each direct child of the grid container is a grid item.
                                                 // No specific col-span-X needed here if parent defines template columns.
        if (Array.isArray(columnDataArray)) {
            columnDataArray.forEach(block => {
                if (block && block.type && block.data) {
                    switch (block.type) {
                        case 'heading':
                            columnsHtml += handleHeading(block.data);
                            break;
                        case 'paragraph':
                            columnsHtml += handleParagraph(block.data);
                            break;
                        case 'code':
                            columnsHtml += handleCode(block.data);
                            break;
                        case 'mermaid':
                            columnsHtml += handleMermaid(block.data);
                            break;
                        case 'table':
                            columnsHtml += handleTable(block.data);
                            break;
                        case 'image':
                            columnsHtml += handleImage(block.data);
                            break;
                        case 'anchorLink':
                            columnsHtml += handleAnchorLink(block.data);
                            break;
                        default:
                            console.warn(`Unsupported block type in layout column: ${block.type}`);
                    }
                } else {
                    console.warn('Invalid block structure encountered within a layout column.');
                }
            });
        } else {
            // If columnDataArray for this index is not an array (e.g. missing column data for a declared columnCount)
            console.warn(`LayoutColumns: Data for column index ${i} is missing or not an array. Rendering an empty column.`);
        }
        columnsHtml += '  </div>\n';
    }

    columnsHtml += '</div>\n';
    return columnsHtml;
}

/**
 * Handles image blocks.
 * @param {object} data The data object for the image block.
 * @returns {string} The HTML string for the image.
 */
function handleImage(data) {
    if (!data || !data.url) {
        console.warn('Image: Missing URL.');
        return '';
    }
    const url = escapeHtml(data.url);
    const alt = data.alt ? escapeHtml(data.alt) : '';
    const caption = data.caption ? `<figcaption class="text-sm text-center text-gray-500 mt-2">${escapeHtml(data.caption)}</figcaption>` : '';
    // Added 'mx-auto' for centering and 'my-4' for vertical margin
    return `<figure class="my-4"><img src="${url}" alt="${alt}" class="max-w-full h-auto rounded-md shadow-md mx-auto">${caption}</figure>\n`;
}

/**
 * Handles anchorLink blocks.
 * @param {object} data The data object for the anchorLink block.
 * @returns {string} The HTML string for the anchor link.
 */
function handleAnchorLink(data) {
    if (!data || typeof data.text !== 'string' || typeof data.href !== 'string') {
        console.warn('AnchorLink: Missing text or href string.');
        return '';
    }

    const text = escapeHtml(data.text);
    const hrefAttribute = escapeHtml(data.href); // Escape href for attribute context

    let targetAttribute = '';
    let relAttribute = '';

    // Check if it's an external link (starts with http://, https://) or a protocol-relative URL (starts with //)
    if (/^(https?:)?\/\//.test(data.href)) { // Check original data.href
        targetAttribute = ' target="_blank"';
        relAttribute = ' rel="noopener noreferrer"';
    }
    // Internal page links (e.g., /about.html or about.html) and anchors (#section) will not have target="_blank"

    return `<p><a href="${hrefAttribute}"${targetAttribute}${relAttribute}>${text}</a></p>\n`; // Wrap in <p> for block display
}

// 辅助函数，用于转义 HTML，避免 XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\//g, "&#x2F;");
}

// Example Usage (for testing purposes):
/*
const exampleJson = {
  "document": {
    "blocks": [
      {
        "type": "heading",
        "data": { "level": 1, "text": "Main Title with Anchor", "anchorId": "main-title" }
      },
      {
        "type": "paragraph",
        "data": {
          "richText": [
            { "type": "text", "content": "This is a paragraph with " },
            { "type": "text", "content": "rich text", "marks": ["bold"] },
            { "type": "text", "content": " formatting, including " },
            { "type": "text", "content": "italic text", "marks": ["italic"] },
            { "type": "text", "content": ", " },
            { "type": "text", "content": "underlined text", "marks": ["underline"] },
            { "type": "text", "content": ", and inline " },
            { "type": "text", "content": "code", "marks": ["code"] },
            { "type": "text", "content": ". Here is a " },
            { "type": "link", "href": "https://www.example.com", "content": "link to Example.com" },
            { "type": "text", "content": "." }
          ]
        }
      },
      {
        "type": "image",
        "data": { "url": "https://via.placeholder.com/300x200", "caption": "A placeholder image" }
      },
      {
        "type": "code",
        "data": { "language": "javascript", "code": "console.log('Hello, world!');\nconst x = 10;" }
      },
      {
        "type": "mermaid",
        "data": { "code": "graph TD;\nA-->B;\nB-->C;" }
      },
      {
        "type": "table",
        "data": {
          "hasHeader": true,
          "headers": [
            { "text": "Product Name" }, // Structured header
            "Price",                   // Simple string header
            { "text": "In Stock" }
          ],
          "rows": [
            [ { "text": "Awesome Gadget" }, "$99.99", { "text": "Yes" } ],
            [ "Super Widget", "$149.50", { "text": "No" } ],
            [ { "text": "Mega Gizmo" }, { "text": "$299.00" }, "Yes" ]
          ]
        }
      },
      {
        "type": "table", // Example of table with no header
        "data": {
          "hasHeader": false,
          // "headers": ["This", "Should", "Not Render"], // Headers array might exist but won't be used if hasHeader is false
          "rows": [
            ["Data point 1", "Value 1"],
            ["Data point 2", "Value 2"]
          ]
        }
      },
      {
        "type": "layoutColumns",
        "data": {
          "columnCount": 2,
          "distribution": ["30%", "70%"], // Example with distribution
          "columns": [
            [
              { "type": "paragraph", "data": { "text": "Left column content (30%)." } },
              { "type": "image", "data": { "url": "https://via.placeholder.com/150", "caption": "Left image" } }
            ],
            [
              { "type": "paragraph", "data": { "text": "Right column content (70%)." } },
              { "type": "code", "data": { "language": "python", "code": "print('Hello from right')" } }
            ]
          ]
        }
      }
    ]
  }
};

// To test in browser console:
// const htmlOutput = parseJsonToHtml(exampleJson);
// document.getElementById('someOutputDiv').innerHTML = htmlOutput;

// Test with XSS potentially harmful JSON (ensure your functions handle escaping)
const xssTestJson = {
    "document": {
        "blocks": [
            {
                "type": "heading",
                "data": { "level": 1, "text": "<script>alert('XSS in heading')</script>" }
            },
            {
                "type": "paragraph",
                "data": { "text": "Test XSS <img src=x onerror=alert('XSS in paragraph')>" }
            },
            {
                "type": "image",
                "data": { "url": "javascript:alert('XSS via URL')", "caption": "<script>alert('XSS in caption')</script>" }
            },
            {
                "type": "code",
                "data": { "language": "html", "code": "<script>alert('XSS in code')</script>" }
            },
            {
                "type": "mermaid",
                "data": { "code": "graph TD;\nA[<img src=x onerror=alert('XSS in mermaid')>]-->B;" }
            },
            {
                "type": "table",
                "data": {
                    "headers": ["<script>alert('XSS in header')</script>"],
                    "rows": [
                        ["<img src=x onerror=alert('XSS in cell')>"]
                    ]
                }
            }
        ]
    }
};

// const xssHtmlOutput = parseJsonToHtml(xssTestJson);
// console.log("XSS Test Output:", xssHtmlOutput);
// document.getElementById('someOutputDiv').innerHTML = xssHtmlOutput; // Be careful rendering this raw if escaping is broken
*/
