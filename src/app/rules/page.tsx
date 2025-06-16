import { Box, Heading, Text, List, ListItem, Link as ChakraLink } from '@chakra-ui/react';

export default function RulesPage() {
  return (
    <Box maxW="2xl" mx="auto" py={10} px={4}>
      <Heading as="h1" size="lg" mb={6} textAlign="center">
        ルール・ご利用ガイド
      </Heading>
      <Text fontSize="md" mb={4}>
        JMO Virtual Contest（日本数学オリンピック予選バーチャルコンテスト）は、過去のJMO予選問題を本番形式で体験できる学習サイトです。ご利用にあたって、以下のルール・注意事項をご確認ください。
      </Text>

      <Heading as="h2" size="md" mt={8} mb={2}>ナビゲーションバー</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>
          <Text fontWeight="bold">HOME:</Text> トップページに戻ります。JMO Virtual Contestの紹介や最新のお知らせを確認できます。
        </ListItem>
        <ListItem>
          <Text fontWeight="bold">Maclath:</Text> 競技数学版のQ&Aコミュニティ「Maclath」の質問一覧ページへ移動します。
        </ListItem>
        <ListItem>
          <Text fontWeight="bold">問題一覧:</Text> 過去のJMO予選問題の一覧を見ることができます。
        </ListItem>
        <ListItem>
          <Text fontWeight="bold">コンテスト一覧:</Text> バーチャルコンテストの一覧を見ることができます。
        </ListItem>
        <ListItem>
          <Text fontWeight="bold">ルール:</Text> このページです。サービスのご利用方法やルール、プライバシーポリシーなどを確認できます。
        </ListItem>
        <ListItem>
          <Text fontWeight="bold">ユーザーメニュー（ログイン時）:</Text> ログイン中のユーザー名が表示されます。クリックすると「マイページ」や「ログアウト」などのメニューが表示されます。管理者の場合は「管理者メニュー」も表示されます。
        </ListItem>
        <ListItem>
          <Text fontWeight="bold">ログイン（未ログイン時）:</Text> ログインページへ移動します。
        </ListItem>
      </List>

      <Text fontSize="md" mb={4}>
        プライバシーポリシーは<ChakraLink href="/privacy-policy" color="blue.500" fontWeight="bold">こちら</ChakraLink>もご確認ください。
      </Text>

      <Heading as="h2" size="md" mt={8} mb={2}>基本ルール</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>本番と同じ制限時間（例：180分）でバーチャルコンテストを開始できます。</ListItem>
        <ListItem>各問題は1回だけ解答を提出できます（やり直しバーチャルは何度でも可能）。</ListItem>
        <ListItem>解答は数式入力欄（math-field）で入力し、LaTeX形式で保存されます。</ListItem>
        <ListItem>
          <Text fontWeight="bold" color="red.500">注意：</Text>判定は数学的に同値であっても表現が異なると不正解となる場合があります。解答を送信する際は分数は約分する、不必要に平方根を用いないなど、数学的に自然で一般的な形で入力してください。
        </ListItem>
        <ListItem>バーチャル中に「やめる」ボタンを押すと、バーチャルコンテスト自体が無効になり、データは保存されません。「完了する」ボタンを押すと採点が可能です。</ListItem>
        <ListItem>バーチャル履歴・採点結果はマイページからいつでも確認できます。</ListItem>
      </List>
      <Heading as="h2" size="md" mt={8} mb={2}>注意事項</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>本サービスは非公式の学習支援サイトです。実際のJMO運営とは関係ありません。</ListItem>
        <ListItem>問題・解答・採点基準は過去問公開資料等を参考にしていますが、正確性を保証するものではありません。</ListItem>
        <ListItem>不具合・要望はGitHubまたは管理者までご連絡ください。</ListItem>
        <ListItem>もし、正解となるはずの入力形式で不正解になる場合や、他の正解候補（別解）を見つけた場合は、GitHubまたは管理者までお知らせいただけますと幸いです。</ListItem>
      </List>
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
