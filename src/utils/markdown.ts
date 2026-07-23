import { marked } from "marked";
import DOMPurify from "dompurify";

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
  const language = lang || "plaintext";
  const escaped = escapeHtml(text);
  return `<div class="code-block relative group">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
      <span class="text-xs text-gray-400">${language}</span>
      <button class="copy-btn text-xs text-gray-400 hover:text-white transition-colors" data-code="${escapeAttr(text)}">
        Copiar
      </button>
    </div>
    <pre class="p-4 overflow-x-auto bg-gray-900 rounded-b-lg"><code class="language-${language}">${escaped}</code></pre>
  </div>`;
};

renderer.table = (table) => {
  return `<div class="overflow-x-auto my-4">${table}</div>`;
};

renderer.image = ({ href, title, text }) => {
  return `<img src="${href}" alt="${text || ""}" title="${title || ""}" class="rounded-lg max-w-full" />`;
};

export { renderMarkdown as markdown };

export function renderMarkdown(content: string): string {
  const raw = marked.parse(content, { renderer, breaks: true, gfm: true }) as string;
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
    ADD_TAGS: ["iframe"],
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
