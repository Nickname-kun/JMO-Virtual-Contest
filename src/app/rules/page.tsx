import { Box, Heading, Text, List, ListItem, Link as ChakraLink } from '@chakra-ui/react';

export default function RulesPage() {
  return (
    <Box maxW="2xl" mx="auto" py={10} px={4}>
      <Heading as="h1" size="lg" mb={6} textAlign="center">
        ルール・ご利用ガイド
      </Heading>
      <Text fontSize="md" mb={4}>
        JMO Virtual Contestは、過去のJMO予選問題を本番形式で体験できる学習・交流サイトです。
      </Text>
      <Text fontSize="md" mb={6} color="red.600" fontWeight="bold">
        ※プライバシーポリシーは <ChakraLink href="/privacy-policy" color="blue.600" fontWeight="bold" textDecoration="underline">こちら</ChakraLink> を必ずご確認ください。
      </Text>

      <Heading as="h2" size="md" mt={8} mb={2}>主なページ</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem><b>HOME:</b> サイト紹介・最新のお知らせ・Maclath新着質問などを掲載。</ListItem>
        <ListItem><b>Community:</b> ユーザーリスト（プロフィール公開ユーザーのみ詳細閲覧可）、Maclath（Q&Aコミュニティ）。</ListItem>
        <ListItem><b>問題一覧:</b> 過去JMO予選問題を年度・分野ごとに閲覧・検索可能。</ListItem>
        <ListItem><b>コンテスト一覧:</b> バーチャルコンテストの一覧。</ListItem>
        <ListItem><b>ルール:</b> このページ。</ListItem>
        <ListItem><b>ユーザーメニュー:</b> ログイン時は右上に表示。マイページ・ログアウト。</ListItem>
      </List>

      <Heading as="h2" size="md" mt={8} mb={2}>バーチャルコンテストのルール</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>本番と同じ制限時間でバーチャルコンテストを体験できます。</ListItem>
        <ListItem>各問題は1回のみ解答提出可能（やり直しバチャは何度でもOK）。</ListItem>
        <ListItem>解答は数式入力欄（math-field）で入力し、LaTeX形式で保存・判定されます。</ListItem>
        <ListItem>ある程度同値な値は正解となるように努めていますが、分数は約分し、平方根を不必要に用いないなど、<b>数学的に自然で一般的な形</b>で入力してください。</ListItem>
        <ListItem>バチャ履歴はマイページから確認できます。</ListItem>
      </List>

      <Heading as="h2" size="md" mt={8} mb={2}>注意事項</Heading>
      <List spacing={2} mb={4} pl={4} styleType="disc">
        <ListItem>本サービスは非公式の学習支援サイトです。実際のJMO運営とは関係ありません。</ListItem>
        <ListItem>問題・解答・採点基準は過去問公開資料等を参考にしており、それらの使用申請は財団に提出済みです。</ListItem>
        <ListItem>他人への誹謗中傷・荒らし・不正利用は厳禁です。</ListItem>
        <ListItem>不適切な投稿があった場合は運営が削除・アカウント停止等の対応を行うことがあります。</ListItem>
        <ListItem>不具合・要望は管理者までご連絡ください。</ListItem>     
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
