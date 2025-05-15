// Node.js compatible version of parser.js

function parseJsonToHtml(jsonDocument) {
    if (!jsonDocument || !jsonDocument.document || !Array.isArray(jsonDocument.document.blocks)) {
        console.error("Invalid JSON document structure");
        return "<p>Error: Invalid JSON document structure</p>";
    }

    let html = "";
    jsonDocument.document.blocks.forEach(block => {
        switch (block.type) {
            case "heading":
                html += handleHeading(block.data);
                break;
            case "paragraph":
                html += handleParagraph(block.data);
                break;
            case "code":
                html += handleCode(block.data);
                break;
            case "mermaid":
                html += handleMermaid(block.data);
                break;
            case "table":
                html += handleTable(block.data);
                break;
            case "layoutColumns":
                html += handleLayoutColumns(block.data);
                break;
            default:
                console.warn("Unsupported block type: " + block.type);
        }
    });
    return html;
}

function handleHeading(data) {
    if (!data || !data.text || !data.level) {
        return "";
    }
    const level = Math.max(1, Math.min(6, parseInt(data.level, 10)));
    const anchorId = data.anchorId ? " id=\"" + data.anchorId + "\"" : "";
    let anchorLink = "";
    if (data.anchorId) {
        anchorLink = " <a href=\"#" + data.anchorId + "\" class=\"anchor-link\" aria-label=\"Link to this section\">#</a>";
    }
    const escapedText = escapeHtml(data.text);
    return "<h" + level + anchorId + ">" + escapedText + anchorLink + "</h" + level + ">\n";
}

function handleParagraph(data) {
    if (!data || typeof data.text !== "string") {
        console.warn('Paragraph: Missing text string.');
        return "";
    }

    let text = escapeHtml(data.text);

    // Apply custom color/background color tags FIRST
    text = text.replace(
        /\[color:([^,]+),bgColor:([^,\]]+)\]([\s\S]*?)\[\/color\]/g,
        (match, color, bgColor, content) => `<span style="color: ${escapeHtml(color.trim())}; background-color: ${escapeHtml(bgColor.trim())};">${content}</span>`
    );
    text = text.replace(
        /\[color:([^,\]]+)\]([\s\S]*?)\[\/color\]/g,
        (match, color, content) => `<span style="color: ${escapeHtml(color.trim())};">${content}</span>`
    );
    text = text.replace(
        /\[bgColor:([^,\]]+)\]([\s\S]*?)\[\/bgColor\]/g,
        (match, bgColor, content) => `<span style="background-color: ${escapeHtml(bgColor.trim())};">${content}</span>`
    );

    // Convert newline characters to <br> tags
    text = text.replace(/\n/g, '<br>\n');
    
    // Markdown-like conversions (order matters for correctness)
    text = text.replace(/\*{4}([^*]+)\*{4}/g, '<strong>$1</strong>'); // ****text**** (bold)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); // **text** (Bold)
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');       // *text* (Italic)
    
    return "<p>" + text + "</p>\n";
}

function handleCode(data) {
    if (!data || typeof data.code !== "string") {
        return "";
    }
    const language = data.language ? "language-" + data.language : "language-none";
    const escapedCode = escapeHtml(data.code);
    return "<pre><code class=\"" + language + "\">" + escapedCode + "</code></pre>\n";
}

function handleMermaid(data) {
    if (!data || typeof data.code !== "string") {
        return "";
    }
    const escapedMermaidCode = escapeHtml(data.code);
    return "<div class=\"mermaid\">" + escapedMermaidCode + "</div>\n";
}

function handleTable(data) {
    if (!data || !Array.isArray(data.headers) || !Array.isArray(data.rows)) {
        return "";
    }
    let tableHtml = "<table>\n";
    tableHtml += "  <thead>\n    <tr>\n";
    data.headers.forEach(header => {
        const escapedHeader = escapeHtml(header);
        tableHtml += "      <th>" + escapedHeader + "</th>\n";
    });
    tableHtml += "    </tr>\n  </thead>\n";
    tableHtml += "  <tbody>\n";
    data.rows.forEach(row => {
        tableHtml += "    <tr>\n";
        if (Array.isArray(row)) {
            row.forEach(cell => {
                const escapedCell = escapeHtml(cell);
                tableHtml += "      <td>" + escapedCell + "</td>\n";
            });
        }
        tableHtml += "    </tr>\n";
    });
    tableHtml += "  </tbody>\n</table>\n";
    return tableHtml;
}

function handleLayoutColumns(data) {
    if (!data || !data.columnCount || !Array.isArray(data.columns)) {
        return "";
    }
    const columnCount = parseInt(data.columnCount, 10);
    let columnsHtml = "<div class=\"layout-columns columns-" + columnCount + "\">\n";
    data.columns.forEach((column, index) => {
        columnsHtml += "  <div class=\"column column-" + (index + 1) + "\">\n";
        if (Array.isArray(column)) {
            column.forEach(block => {
                if (block && block.type && block.data) {
                    switch (block.type) {
                        case "heading":
                            columnsHtml += handleHeading(block.data);
                            break;
                        case "paragraph":
                            columnsHtml += handleParagraph(block.data);
                            break;
                        case "code":
                            columnsHtml += handleCode(block.data);
                            break;
                        case "mermaid":
                            columnsHtml += handleMermaid(block.data);
                            break;
                        case "table":
                            columnsHtml += handleTable(block.data);
                            break;
                        default:
                            console.warn("Unsupported block type in column: " + block.type);
                    }
                }
            });
        }
        columnsHtml += "  </div>\n";
    });
    columnsHtml += "</div>\n";
    return columnsHtml;
}

// Helper function to escape HTML characters
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;");
}

// Export for Node.js environment if module is defined
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        parseJsonToHtml,
        // also export other handlers if they need to be tested individually
        handleHeading,
        handleParagraph,
        handleCode,
        handleMermaid,
        handleTable,
        handleLayoutColumns
    };
}
