import katex from "katex";

export function renderLatexInline(text: string): string {
  return text.replace(/\$([^\$]+)\$/g, (_match, expr) => {
    try {
      return katex.renderToString(expr.trim(), { throwOnError: false });
    } catch {
      return _match;
    }
  });
}

export function renderLatexBlock(text: string): string {
  return text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, expr) => {
    try {
      return katex.renderToString(expr.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return _match;
    }
  });
}

export function renderLatex(text: string): string {
  return renderLatexBlock(renderLatexInline(text));
}
