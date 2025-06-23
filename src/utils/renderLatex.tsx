import { remark } from 'remark';
import html from 'remark-html'; // これはもう使わない
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import React from 'react';
import { visit } from 'unist-util-visit';

// [DIAGRAM]タグを置換するカスタムremarkプラグイン
const remarkDiagram = (options: { svg: string }) => {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index: any, parent: any) => {
      if (node.value.includes('[DIAGRAM]')) {
        const parts = node.value.split(/(\[DIAGRAM\])/g);
        const newNodes = parts.map((part: string) => {
          if (part === '[DIAGRAM]') {
            return { type: 'html', value: `<div class="diagram-wrapper" style=\"margin:1.5em auto;display:flex;justify-content:center;\">${options.svg}</div>` };
          }
          return { type: 'text', value: part };
        }).filter((n: any) => n.value); // 空のテキストノードを除外
        
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
};

export function renderLatex(text: string, diagramSvg?: string | null) {
  const processor = remark()
    .use(remarkBreaks)
    .use(remarkMath);

  if (diagramSvg && text.includes('[DIAGRAM]')) {
    processor.use(remarkDiagram, { svg: diagramSvg });
  }

  const processedHtmlString = String(
    processor
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(text)
  );

  return <div dangerouslySetInnerHTML={{ __html: processedHtmlString }} />;
} 