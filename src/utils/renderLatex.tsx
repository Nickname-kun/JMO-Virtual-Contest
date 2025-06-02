import { remark } from 'remark';
import html from 'remark-html'; // これはもう使わない
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import React from 'react';

export function renderLatex(text: string) {
  // unified (remark -> rehype) パイプラインを構築し、Markdownと数式を処理する
  const processedHtmlString = String(
    remark()
      .use(remarkBreaks) // 単一改行を<br>に変換
      .use(remarkMath) // 数式を処理
      .use(remarkRehype) // remarkASTをrehypeASTに変換
      .use(rehypeKatex) // rehypeASTの数式ノードをKaTeXのHTMLに変換
      .use(rehypeStringify) // rehypeASTをHTML文字列に変換
      .processSync(text)
  );

  // 生成されたHTML文字列をdangerouslySetInnerHTMLを使ってレンダリング
  // 注意：この方法だとReactによる差分更新の恩恵を受けられず、セキュリティリスクも伴うため、
  // 理想的にはHTML文字列ではなくReact要素のツリーを生成すべきですが、
  // まずは表示崩れを解消することを優先します。
  return <div dangerouslySetInnerHTML={{ __html: processedHtmlString }} />;
} 