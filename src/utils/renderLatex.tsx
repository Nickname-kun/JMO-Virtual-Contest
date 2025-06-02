import { InlineMath, BlockMath } from 'react-katex';
import { remark } from 'remark';
import html from 'remark-html';
import React from 'react';

export function renderLatex(text: string) {
  // MarkdownをHTMLに変換
  const processedHtml = remark().use(html).processSync(text).toString();

  // HTMLの中からLaTeX部分を探し、KaTeXコンポーネントに置換
  const parts = processedHtml.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      return <BlockMath key={i} math={math} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return <InlineMath key={i} math={math} />;
    } else {
      // LaTeX部分以外のHTMLを表示
      return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
    }
  });
} 