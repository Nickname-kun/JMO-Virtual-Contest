import { InlineMath, BlockMath } from 'react-katex';
import { remark } from 'remark';
import html from 'remark-html';
import React from 'react';

export function renderLatex(text: string) {
  // 数式部分を一時的にプレースホルダーに置換
  const mathPlaceholder = "__MATH_PLACEHOLDER__";
  const blockMathRegex = /(\$\$.*?\$\$)/g;
  const inlineMathRegex = /(\$.*?\$)/g;
  
  const blockMathParts: string[] = [];
  const inlineMathParts: string[] = [];

  let textWithPlaceholders = text.replace(blockMathRegex, (match) => {
    blockMathParts.push(match);
    return mathPlaceholder;
  });

  textWithPlaceholders = textWithPlaceholders.replace(inlineMathRegex, (match) => {
    inlineMathParts.push(match);
    return mathPlaceholder;
  });

  // MarkdownをHTMLに変換
  const processedHtml = remark().use(html).processSync(textWithPlaceholders).toString();

  // HTMLの中からプレースホルダーを探し、KaTeXコンポーネントに置換
  const parts = processedHtml.split(mathPlaceholder);

  let blockMathIndex = 0;
  let inlineMathIndex = 0;

  return parts.map((part, i) => {
    const htmlPart = <span key={`html-${i}`} dangerouslySetInnerHTML={{ __html: part }} />;

    if (i < parts.length - 1) {
      // 次のプレースホルダーがブロック数式かインライン数式か判断
      const nextMathPart = blockMathParts[blockMathIndex] || inlineMathParts[inlineMathIndex];

      if (blockMathParts[blockMathIndex] && nextMathPart === blockMathParts[blockMathIndex]) {
         const math = blockMathParts[blockMathIndex].slice(2, -2);
         blockMathIndex++;
         return <React.Fragment key={i}>{htmlPart}<BlockMath key={`math-${i}`} math={math} /></React.Fragment>;
      } else if (inlineMathParts[inlineMathIndex] && nextMathPart === inlineMathParts[inlineMathIndex]) {
         const math = inlineMathParts[inlineMathIndex].slice(1, -1);
         inlineMathIndex++;
         return <React.Fragment key={i}>{htmlPart}<InlineMath key={`math-${i}`} math={math} /></React.Fragment>;
      } else {
        // ここには到達しないはずだが念のため
         return htmlPart;
      }

    } else {
      return htmlPart;
    }
  });
} 