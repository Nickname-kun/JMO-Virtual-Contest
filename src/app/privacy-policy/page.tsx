import { Box, Heading, Text, List, ListItem } from '@chakra-ui/react';

export default function PrivacyPolicyPage() {
  return (
    <Box maxW="2xl" mx="auto" py={10} px={4}>
      <Heading as="h1" size="lg" mb={6} textAlign="center">
        プライバシーポリシー
      </Heading>
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
    </Box>
  );
} 