import { InlineMath, BlockMath } from 'react-katex';
import { remark } from 'remark';
import html from 'remark-html';
import React from 'react';

export function renderLatex(text: string) {
  // 数式部分を一時的に異なる、より特殊なプレースホルダーに置換
  const blockMathPlaceholder = "__$$BLOCK_MATH_PLACEHOLDER$$__";
  const inlineMathPlaceholder = "__$INLINE_MATH_PLACEHOLDER$__";
  const blockMathRegex = /(\$\$.*?[\s\S]*?\$\$)/g;
  const inlineMathRegex = /(\$.*?[\s\S]*?\$)/g;
  
  const blockMathParts: string[] = [];
  const inlineMathParts: string[] = [];

  let textWithPlaceholders = text;

  // ブロック数式を先に置換し、元の数式を保存
  textWithPlaceholders = textWithPlaceholders.replace(blockMathRegex, (match) => {
    blockMathParts.push(match.slice(2, -2)); // $$...$$ から $$ を除去
    return blockMathPlaceholder;
  });

  // インライン数式を置換し、元の数式を保存
  textWithPlaceholders = textWithPlaceholders.replace(inlineMathRegex, (match) => {
    inlineMathParts.push(match.slice(1, -1)); // $...$ から $ を除去
    return inlineMathPlaceholder;
  });

  // MarkdownをHTMLに変換
  const processedHtml = remark().use(html).processSync(textWithPlaceholders).toString();

  // HTMLの中からプレースホルダーを探し、KaTeXコンポーネントに置換
  // プレースホルダーを区切り文字としてHTMLを分割
  const htmlParts = processedHtml.split(new RegExp(`(${blockMathPlaceholder}|${inlineMathPlaceholder})`, 'g'));

  let blockMathIndex = 0;
  let inlineMathIndex = 0;

  return htmlParts.map((part, i) => {
    if (part === blockMathPlaceholder) {
      // ブロック数式プレースホルダーの場合
      const math = blockMathParts[blockMathIndex];
      blockMathIndex++;
      return <BlockMath key={`block-math-${i}`} math={math} />;
    } else if (part === inlineMathPlaceholder) {
      // インライン数式プレースホルダーの場合
      const math = inlineMathParts[inlineMathIndex];
      inlineMathIndex++;
      return <InlineMath key={`inline-math-${i}`} math={math} />;
    } else {
      // 通常のHTML部分
      return <span key={`html-${i}`} dangerouslySetInnerHTML={{ __html: part }} />;
    }
  });
} 