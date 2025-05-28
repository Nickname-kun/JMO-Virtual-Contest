import { Box, Heading, Text, List, ListItem } from '@chakra-ui/react';

export default function RulesPage() {
  return (
    <Box maxW="2xl" mx="auto" py={10} px={4}>
      <Heading as="h1" size="lg" mb={6} textAlign="center">
        ルール・ご利用ガイド
      </Heading>
      <Text fontSize="md" mb={4}>
        JMO Virtual Contest（日本数学オリンピック予選バーチャルコンテスト）は、過去のJMO予選問題を本番形式で体験できる学習サイトです。ご利用にあたって、以下のルール・注意事項をご確認ください。
      </Text>
      <Heading as="h2" size="md" mt={8} mb={2}>基本ルール</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>本番と同じ制限時間（例：180分）でバーチャルコンテストを開始できます。</ListItem>
        <ListItem>各問題は1回だけ解答を提出できます（やり直しバーチャルは何度でも可能）。</ListItem>
        <ListItem>解答は数式入力欄（math-field）で入力し、LaTeX形式で保存されます。</ListItem>
        <ListItem>
          <Text fontWeight="bold" color="red.500">注意：</Text>判定は入力された文字列そのものに対して行われます。数学的に同値であっても表現が異なると不正解となる場合があります。解答は、分数を約分したり、不必要に平方根を用いないなど、数学的に自然で一般的な形で入力してください。
        </ListItem>
        <ListItem>バーチャル中に「やめる」「完了する」ボタンで途中終了・採点が可能です。</ListItem>
        <ListItem>バーチャル履歴・採点結果はマイページからいつでも確認できます。</ListItem>
      </List>
      <Heading as="h2" size="md" mt={8} mb={2}>注意事項</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>本サービスは非公式の学習支援サイトです。実際のJMO運営とは関係ありません。</ListItem>
        <ListItem>問題・解答・採点基準は過去問公開資料等を参考にしていますが、正確性を保証するものではありません。</ListItem>
        <ListItem>不具合・要望はGitHubまたは管理者までご連絡ください。</ListItem>
        <ListItem>もし、正解となるはずの入力形式で不正解になる場合や、他の正解候補（別解）を見つけた場合は、GitHubまたは管理者までお知らせいただけますと幸いです。</ListItem>
      </List>
      <Heading as="h2" size="md" mt={8} mb={2}>プライバシーポリシー</Heading>
      <Text fontSize="md" mb={4}>
        本サービスでは、円滑なサービス提供のために以下の情報を収集・利用します。
      </Text>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>ユーザーアカウント情報（メールアドレス、パスワードのハッシュ）：ログイン、ユーザー識別のために利用します。</ListItem>
        <ListItem>コンテスト参加・解答情報：バーチャルコンテストの記録、採点、結果表示のために利用します。</ListItem>
        <ListItem>サービス利用に関する情報（アクセスログなど）：サービス改善、不正利用防止のために利用します。</ListItem>
      </List>
      <Text fontSize="md" mb={4}>
        収集した情報は、本サービスの提供および改善の目的以外には利用しません。法令に基づく場合を除き、ご本人の同意なく第三者に提供することはありません。
      </Text>
      <Heading as="h2" size="md" mt={8} mb={2}>推奨環境</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>最新のGoogle Chrome、Firefox、Edge等のモダンブラウザ</ListItem>
        <ListItem>PC・タブレット推奨（スマートフォンは一部機能が制限される場合があります）</ListItem>
      </List>
      <Text fontSize="sm" color="gray.500" mt={8} textAlign="center">
        © {new Date().getFullYear()} JMO Virtual Contest. All rights reserved.
      </Text>
    </Box>
  );
} 