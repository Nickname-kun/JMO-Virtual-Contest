import { InlineMath, BlockMath } from 'react-katex';
import { remark } from 'remark';
import html from 'remark-html';
import React from 'react';

export function renderLatex(text: string) {
  // 数式とテキストを分割する正規表現
  // ブロック数式 (\$\$.*?\$\$) または インライン数式 (\$.*?\$)\n  // キャプチャグループ () を使うことで、split結果に区切り文字（数式）自身も含まれる\n  const mathRegex = /(\$\$.*?[\s\S]*?\$\$)|(\$.*?[\s\S]*?\$)/g;

  // テキストを数式とそれ以外の部分に分割
  const mathRegex = /(\$\$.*?[\s\S]*?\$\$)|(\$.*?[\s\S]*?\$)/g;
  const parts = text.split(mathRegex).filter(Boolean); // split結果の空文字列を除去

  return parts.map((part, i) => {
    // ブロック数式にマッチするか判定
    if (/^\$\$.*?[\s\S]*?\$\$$/.test(part)) { // 正規表現テストを修正
      const math = part.slice(2, -2); // $$...$$ から $$ を除去
      return <BlockMath key={`block-math-${i}`} math={math} />;
    }
    // インライン数式にマッチするか判定
    else if (/^\$.*?[\s\S]*?\$$/.test(part)) { // 正規表現テストを修正
      const math = part.slice(1, -1); // $...$ から $ を除去
      return <InlineMath key={`inline-math-${i}`} math={math} />;
    }
    // 数式以外のテキストの場合
    else {
      // Markdown変換前に特殊文字をエスケープ
      let escapedPart = part.replace(/[$_]/g, '\\$&'); // $や_をエスケープ

      // MarkdownをHTMLに変換
      const processedHtml = remark().use(html).processSync(escapedPart).toString();
      return <span key={`html-${i}`} dangerouslySetInnerHTML={{ __html: processedHtml }} />;
    }
  });
} 