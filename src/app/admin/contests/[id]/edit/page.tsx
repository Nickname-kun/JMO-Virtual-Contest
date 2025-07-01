"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Box,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
} from "@chakra-ui/react";
import EditContestForm from './edit-contest-form';

// initialDataの型定義をpage.tsxにも追加
interface InitialContestData {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  year: number;
  border_a: number | null;
  border_b: number | null;
  border_c: number | null;
  pdf_url?: string | null;
}

export default function EditContestPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // 取得したコンテストデータを保持するstate
  const [initialData, setInitialData] = useState<InitialContestData | null>(null);

  // コンテストID
  const contestId = params?.id as string;

  useEffect(() => {
    // コンテストデータ取得
    const fetchContest = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contests")
        .select("id, name, description, duration_minutes, year, border_a, border_b, border_c, pdf_url")
        .eq("id", contestId)
        .single();
      if (error || !data) {
        setError("コンテストの取得に失敗しました");
        setInitialData(null);
      } else {
        setInitialData({
          id: data.id,
          name: data.name,
          description: data.description || null, // nullを許容
          duration_minutes: data.duration_minutes || 180, // デフォルト値設定
          year: data.year, // year の値を取得してセット
          border_a: data.border_a,
          border_b: data.border_b,
          border_c: data.border_c,
          pdf_url: data.pdf_url || '',
        });
        setError(null); // 成功したらエラーをクリア
      }
      setLoading(false);
    };
    if (contestId) { // contestIdが存在する場合のみフェッチ
       fetchContest();
    }

  }, [contestId, supabase]);

  // コンテスト更新処理（EditContestFormから呼び出される）
  const handleUpdateContest = async (updatedData: InitialContestData) => {
     setLoading(true);
    const { error } = await supabase
        .from("contests")
        .update({
          name: updatedData.name,
          description: updatedData.description,
          duration_minutes: updatedData.duration_minutes,
          year: updatedData.year, // year の値を更新に含める
          border_a: updatedData.border_a,
          border_b: updatedData.border_b,
          border_c: updatedData.border_c,
          pdf_url: updatedData.pdf_url || null,
        })
        .eq("id", updatedData.id);

      setLoading(false);

      if (error) {
         console.error("Error updating contest:", error);
         // エラー表示はEditContestForm側で行う
      } else {
        // 成功したらコンテスト一覧管理ページにリダイレクト
         router.push("/admin/contests");
      }
  };


  if (loading) {
    return (
      <Box py={20} textAlign="center">
        <Spinner size="xl" />
        <Heading as="h2" size="md" mt={4}>コンテストデータを読み込み中...</Heading>
      </Box>
    );
  }

  if (error || !initialData) {
    return (
      <Box maxW="xl" mx="auto" py={8} px={4}>
         <Heading as="h1" size="lg" mb={8} textAlign="center">
          コンテストの編集
        </Heading>
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error || "コンテストが見つかりませんでした。"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxW="xl" mx="auto" py={8} px={4}>
      <Heading as="h1" size="lg" mb={8} textAlign="center">
        コンテストの編集
      </Heading>
      {/* 取得したデータをinitialDataとして渡し、更新ハンドラを渡す */}
       <EditContestForm initialData={initialData} onUpdate={handleUpdateContest} />
    </Box>
  );
} 