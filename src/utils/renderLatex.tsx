import { InlineMath, BlockMath } from 'react-katex';
import { remark } from 'remark';
import html from 'remark-html';
import React from 'react';

export function renderLatex(text: string) {
  // 数式デリミタ（$...$ および $$...$$）を含むテキストを処理する
  // remark-htmlで一度HTMLに変換し、その結果の中の数式部分をreact-katexコンポーネントに置き換える

  // 1. Markdown全体をHTMLに変換
  const processedHtmlString = remark().use(html).processSync(text).toString();

  // 2. HTML文字列を解析し、数式部分を置き換えるための処理
  //    ここでは簡易的に、数式デリミタで分割してReact要素の配列を生成する
  //    より堅牢な方法としてはHTMLパーサーを使うことも考えられますが、
  //    MarkdownとKaTeXの組み合わせでよく使われる方法として、デリミタでの分割を採用します。

  // 数式とテキストを分割する正規表現
  // HTML変換後の文字列を対象とするため、エスケープされた$などを考慮する必要がある場合がある。
  // ただし、remark-htmlが数式デリミタをそのまま残すと仮定する。
  const mathRegex = /(\$\$.*?[\s\S]*?\$\$)|(\$.*?[\s\S]*?\$)/g;

  // HTML文字列を数式とそれ以外の部分に分割
  const parts = processedHtmlString.split(mathRegex).filter(Boolean);

  const renderedElements: React.ReactNode[] = [];
  let lastIndex = 0;

  // 正規表現でマッチした部分とマッチしなかった部分を処理
  processedHtmlString.replace(mathRegex, (match, blockMath, inlineMath, offset) => {
    // マッチする前のテキスト部分を追加
    const textBefore = processedHtmlString.substring(lastIndex, offset);
    if (textBefore) {
       // テキスト部分をそのままdangerouslySetInnerHTMLで追加
       // 注意：この方法だとテキスト部分に含まれるMarkdownのHTMLタグ（<p>, <strong>など）もそのままレンダリングされます。
       // 段落(<p>)タグが問題になる場合は、別途処理が必要になりますが、
       // 前回の修正で<p>タグ削除がうまくいかなかったことを踏まえ、一旦そのまま出力します。
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