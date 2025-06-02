import { InlineMath, BlockMath } from 'react-katex';
import { remark } from 'remark';
import html from 'remark-html';
import remarkBreaks from 'remark-breaks';
import React from 'react';

export function renderLatex(text: string) {
  // 数式デリミタ（$...$ および $$...$$）を含むテキストを処理する
  // remark-breaksを使い、単一の改行を<br>に変換
  // remark-htmlで一度HTMLに変換し、その結果の中の数式部分をreact-katexコンポーネントに置き換える

  // 1. Markdown全体をHTMLに変換 (remark-breaksを適用)
  const processedHtmlString = remark()
    .use(remarkBreaks) // ここでremark-breaksプラグインを使用
    .use(html)
    .processSync(text)
    .toString();

  // 2. HTML文字列を解析し、数式部分を置き換えるための処理
  //    ここでは簡易的に、数式デリミタで分割してReact要素の配列を生成する
  //    より堅牢な方法としてはHTMLパーサーを使うことも考えられますが、
  //    MarkdownとKaTeXの組み合わせでよく使われる方法として、デリミタでの分割を採用します。

  // 数式とテキストを分割する正規表現
  // HTML変換後の文字列を対象とするため、エスケープされた$などを考慮する必要がある場合がある。
  // ただし、remark-htmlが数式デリミタをそのまま残すと仮定する。
  const mathRegex = /(\$\$.*?[\s\S]*?\$\$)|(\$.*?[\s\S]*?\$)/g;

  const renderedElements: React.ReactNode[] = [];
  let lastIndex = 0;

  // 正規表現でマッチした部分とマッチしなかった部分を処理
  processedHtmlString.replace(mathRegex, (match, blockMath, inlineMath, offset) => {
    // マッチする前のテキスト部分を追加
    const textBefore = processedHtmlString.substring(lastIndex, offset);
    if (textBefore) {
       // テキスト部分をdangerouslySetInnerHTMLで追加
       // remark-breaksにより、単一の改行は<br>タグに変換されているはずです。
      renderedElements.push(
        <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: textBefore }} />
      );
    }

    // 数式部分を追加
    const mathContent = blockMath || inlineMath;
    if (blockMath) {
      // ブロック数式 ($$ ... $$)
      const math = mathContent.slice(2, -2);
      renderedElements.push(<BlockMath key={`block-math-${offset}`} math={math} />);
    } else if (inlineMath) {
      // インライン数式 ($ ... $)
      const math = mathContent.slice(1, -1);
      renderedElements.push(<InlineMath key={`inline-math-${offset}`} math={math} />);
    }

    lastIndex = offset + match.length;
    return match; // replaceのコールバックはマッチした文字列を返す必要がある
  });

  // 最後のテキスト部分を追加
  const textAfter = processedHtmlString.substring(lastIndex);
  if (textAfter) {
    renderedElements.push(
      <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: textAfter }} />
    );
  }

  return renderedElements;
} 