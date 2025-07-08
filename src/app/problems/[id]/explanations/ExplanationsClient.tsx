"use client"

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Text as ChakraText,
  VStack,
  Button,
  HStack,
  Badge,
  Flex,
  Alert,
  AlertIcon,
  useToast,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Link as ChakraLink,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Switch,
  FormControl as ChakraFormControl,
  FormLabel as ChakraFormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Input,
} from '@chakra-ui/react'
import Link from 'next/link'
import { renderLatex } from '@/utils/renderLatex'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { FiTrash2 } from 'react-icons/fi'
import ColoredUserName from '@/components/ColoredUserName'
import { optimizeImage, compressImage, getImageInfo, formatFileSize } from '@/utils/imageOptimizer'
import type { UploadedImage } from '../new/NewExplanationClient'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface Problem {
  id: string
  title: string
  content: string
}

interface ExplanationImage {
  id: string;
  image_url: string;
  file_name: string;
  position: number;
  file_size?: number;
}

interface Explanation {
  id: string
  problem_id: string
  user_id: string
  title: string
  content: string
  is_official: boolean
  created_at: string
  updated_at: string
  profiles?: {
    username: string | null
  }
  explanation_images?: ExplanationImage[]
}

export default function ExplanationsClient({ problem }: { problem: Problem }) {
  const supabase = createClientComponentClient()
  const user = useUser()
  const router = useRouter()
  const toast = useToast()
  const [explanations, setExplanations] = useState<Explanation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingExplanationId, setEditingExplanationId] = useState<string | null>(null)
  const [editedExplanationContent, setEditedExplanationContent] = useState('')
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [explanationToDeleteId, setExplanationToDeleteId] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [deletingExplanation, setDeletingExplanation] = useState(false)
  const [explanationAuthors, setExplanationAuthors] = useState<{ [key: string]: { username: string; is_admin: boolean; is_public?: boolean } }>({});
  const [explanationCounts, setExplanationCounts] = useState<Record<string, number>>({});
  const [no1ExplanationUsers, setNo1ExplanationUsers] = useState<string[]>([]);
  const [bestAnswerCounts, setBestAnswerCounts] = useState<Record<string, number>>({});
  const [no1BestAnswerUsers, setNo1BestAnswerUsers] = useState<string[]>([]);
  const [editingImages, setEditingImages] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);
  const [optimizationSettings, setOptimizationSettings] = useState({
    enabled: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    targetSizeKB: 500,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      }
    }
    checkAdminStatus()
  }, [user, supabase])

  useEffect(() => {
    const fetchExplanations = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('explanations')
        .select(`
          *,
          profiles(username),
          explanation_images(id, image_url, file_name, position)
        `)
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching explanations:', error)
        setError('解説の取得に失敗しました。')
      } else {
        setExplanations(data || [])
      }
      setLoading(false)
    }

    fetchExplanations()
  }, [problem.id, supabase])

  useEffect(() => {
    const fetchExplanationAuthors = async () => {
      const authorIds = explanations.map(explanation => explanation.user_id);
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, is_admin, is_public')
          .in('id', authorIds);
        
        if (profiles) {
          const authorsMap = profiles.reduce((acc, profile) => ({
            ...acc,
            [profile.id]: { username: profile.username, is_admin: profile.is_admin, is_public: profile.is_public }
          }), {});
          setExplanationAuthors(authorsMap);
        }
      }
    };

    fetchExplanationAuthors();
  }, [explanations, supabase]);

  useEffect(() => {
    const fetchCounts = async () => {
      const userIds = explanations.map(e => e.user_id);
      if (userIds.length === 0) return;
      // 全体の解説数を取得
      const { data: allExplanations } = await supabase
        .from('explanations')
        .select('user_id');
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, is_admin');
      const counts: Record<string, number> = {};
      allExplanations?.forEach(e => {
        if (!allProfiles?.find(p => p.id === e.user_id)?.is_admin) {
          counts[e.user_id] = (counts[e.user_id] || 0) + 1;
        }
      });
      setExplanationCounts(counts);
      // No.1ユーザー
      const maxEx = Math.max(...Object.values(counts), 0);
      const exNo1Users = Object.entries(counts)
        .filter(([_, cnt]) => cnt === maxEx)
        .map(([uid]) => uid);
      setNo1ExplanationUsers(exNo1Users);
    };
    fetchCounts();
  }, [explanations, supabase]);

  useEffect(() => {
    const fetchBestAnswerCounts = async () => {
      const userIds = explanations.map(e => e.user_id);
      if (userIds.length === 0) return;
      // best_answer_idがnullでないquestionsを全件取得
      const { data: bestAnswerQuestions } = await supabase
        .from('questions')
        .select('best_answer_id')
        .not('best_answer_id', 'is', null);
      const { data: allAnswers } = await supabase
        .from('answers')
        .select('id, user_id');
      const counts: Record<string, number> = {};
      bestAnswerQuestions?.forEach(q => {
        const ans = allAnswers?.find(a => a.id === q.best_answer_id);
        if (ans) {
          counts[ans.user_id] = (counts[ans.user_id] || 0) + 1;
        }
      });
      setBestAnswerCounts(counts);
    };
    fetchBestAnswerCounts();
  }, [explanations, supabase]);

  useEffect(() => {
    const fetchNo1BestAnswerUsers = async () => {
      const userIds = explanations.map(e => e.user_id);
      if (userIds.length === 0) return;
      // best_answer_idがnullでないquestionsを全件取得
      const { data: bestAnswerQuestions } = await supabase
        .from('questions')
        .select('best_answer_id')
        .not('best_answer_id', 'is', null);
      const { data: allAnswers } = await supabase
        .from('answers')
        .select('id, user_id');
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, is_admin');
      const counts: Record<string, number> = {};
      bestAnswerQuestions?.forEach(q => {
        const ans = allAnswers?.find(a => a.id === q.best_answer_id);
        if (ans && !allProfiles?.find(p => p.id === ans.user_id)?.is_admin) {
          counts[ans.user_id] = (counts[ans.user_id] || 0) + 1;
        }
      });
      const maxBa = Math.max(...Object.values(counts), 0);
      const baNo1Users = Object.entries(counts)
        .filter(([_, cnt]) => cnt === maxBa)
        .map(([uid]) => uid);
      setNo1BestAnswerUsers(baNo1Users);
    };
    fetchNo1BestAnswerUsers();
  }, [explanations, supabase]);

  const handleToggleOfficial = async (explanationId: string, currentStatus: boolean) => {
    if (!isAdmin) return

    const { error } = await supabase
      .from('explanations')
      .update({ is_official: !currentStatus })
      .eq('id', explanationId)

    if (error) {
      console.error('Error toggling official status:', error)
      toast({
        title: 'エラー',
        description: '解説のステータス更新に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } else {
      setExplanations(prev =>
        prev.map(exp =>
          exp.id === explanationId
            ? { ...exp, is_official: !currentStatus }
            : exp
        )
      )
    }
  }

  const handleUpdateExplanation = async (explanationId: string, newContent: string) => {
    if (!user || newContent.trim() === '') return;

    const { error } = await supabase
      .from('explanations')
      .update({ content: newContent.trim() })
      .eq('id', explanationId)
      .eq('user_id', user.id); // 投稿者のみ更新可能

    if (error) {
      console.error('Error updating explanation:', error);
      toast({
        title: 'エラー',
        description: '解説の更新に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: '成功',
        description: '解説を更新しました。',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEditingExplanationId(null);
      // 更新後、解説一覧を再取得して表示を更新
      const { data, error: fetchError } = await supabase
        .from('explanations')
        .select(`
          *,
          profiles(username),
          explanation_images(id, image_url, file_name, position)
        `)
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching explanations after update:', fetchError);
      } else {
        setExplanations(data || []);
      }
    }
  };

  const handleDeleteExplanation = async () => {
    if (!explanationToDeleteId) return

    const explanation = explanations.find(exp => exp.id === explanationToDeleteId);
    if (!explanation) return;

    if (!isAdmin && user?.id !== explanation.user_id) {
      toast({
        title: '権限がありません',
        description: 'この解説を削除する権限がありません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setDeletingExplanation(false);
      setExplanationToDeleteId(null);
      setDeleteDialogOpen(false);
      return;
    }

    setDeletingExplanation(true)
    setDeleteDialogOpen(false)

    const { error } = await supabase
      .from('explanations')
      .delete()
      .eq('id', explanationToDeleteId)

    setDeletingExplanation(false)
    setExplanationToDeleteId(null)

    if (error) {
      console.error('Error deleting explanation:', error)
      toast({
        title: 'エラー',
        description: '解説の削除に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } else {
      toast({
        title: '成功',
        description: '解説を削除しました。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      // 削除後、解説一覧を再取得して表示を更新
      const { data, error: fetchError } = await supabase
        .from('explanations')
        .select(`
          *,
          profiles(username),
          explanation_images(id, image_url, file_name, position)
        `)
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching explanations after deletion:', fetchError)
      } else {
        setExplanations(data || [])
      }
    }
  }

  const handleEditImages = (explanationId: string) => {
    setEditingImages(explanationId);
    setNewImages([]);
    onOpen();
  };

  const handleAddImages = async (files: FileList | null) => {
    if (!files) return;

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        toast({
          title: 'エラー',
          description: `${file.name} のサイズが5MBを超えています。`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'エラー',
          description: `${file.name} は対応していないファイル形式です。`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        continue;
      }

      try {
        let processedFile = file;
        
        if (optimizationSettings.enabled) {
          processedFile = await optimizeImage(file, {
            maxWidth: optimizationSettings.maxWidth,
            maxHeight: optimizationSettings.maxHeight,
            quality: optimizationSettings.quality,
          });
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: UploadedImage = {
            id: `temp-${Date.now()}-${Math.random()}`,
            file: processedFile,
            preview: e.target?.result as string,
            position: newImages.length,
          };
          setNewImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: 'エラー',
          description: `${file.name} の処理に失敗しました。`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleRemoveNewImage = (imageId: string) => {
    setNewImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSaveImages = async () => {
    if (!editingImages || !user) return;

    setLoading(true);

    try {
      // 新しい画像をアップロード
      const uploadedUrls: string[] = [];
      for (const image of newImages) {
        const fileName = `${editingImages}/${Date.now()}-${image.file.name}`;
        const { data, error } = await supabase.storage
          .from('explanations-images')
          .upload(fileName, image.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('explanations-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // 既存の画像の位置を取得
      const { data: existingImages } = await supabase
        .from('explanation_images')
        .select('*')
        .eq('explanation_id', editingImages)
        .order('position', { ascending: true });

      const maxPosition = existingImages?.length ? Math.max(...existingImages.map(img => img.position)) : -1;

      // 新しい画像情報をデータベースに保存
      const imageRecords = newImages.map((image, index) => ({
        explanation_id: editingImages,
        image_url: uploadedUrls[index],
        file_name: image.file.name,
        file_size: image.file.size,
        position: maxPosition + 1 + index,
      }));

      if (imageRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('explanation_images')
          .insert(imageRecords);

        if (insertError) throw insertError;
      }

      toast({
        title: '成功',
        description: '画像を追加しました。',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // 解説一覧を再取得
      const { data, error } = await supabase
        .from('explanations')
        .select(`
          *,
          profiles(username),
          explanation_images(id, image_url, file_name, position)
        `)
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setExplanations(data);
      }

      onClose();
      setEditingImages(null);
      setNewImages([]);
    } catch (error) {
      console.error('Error saving images:', error);
      toast({
        title: 'エラー',
        description: '画像の保存に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!user) return;

    try {
      // まず画像情報を取得
      const { data: imageData, error: fetchError } = await supabase
        .from('explanation_images')
        .select('image_url')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Storageのファイルパスを抽出
      let filePath = '';
      if (imageData && imageData.image_url) {
        // 例: https://xxxx.supabase.co/storage/v1/object/public/explanations-images/abc/def.png
        // → abc/def.png
        const url = imageData.image_url;
        const match = url.match(/\/storage\/v1\/object\/public\/explanations-images\/(.+)/);
        if (match && match[1]) {
          filePath = match[1];
        }
      }

      // Storageから物理ファイルを削除
      if (filePath) {
        const { error: storageError } = await supabase.storage.from('explanations-images').remove([filePath]);
        if (storageError) {
          // ファイルが既に存在しない場合は無視
          if (!storageError.message.includes('No such file or directory')) {
            throw storageError;
          }
        }
      }

      // DBからレコード削除
      const { error } = await supabase
        .from('explanation_images')
        .delete()
        .eq('id', imageId)
        .eq('explanation_id', editingImages);

      if (error) throw error;

      toast({
        title: '成功',
        description: '画像を削除しました。',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // 解説一覧を再取得
      const { data, error: fetchError2 } = await supabase
        .from('explanations')
        .select(`
          *,
          profiles(username),
          explanation_images(id, image_url, file_name, position)
        `)
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true });

      if (!fetchError2 && data) {
        setExplanations(data);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'エラー',
        description: '画像の削除に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 本文＋画像IDリストから、[img:ID]を![](URL)に置換してreact-markdownで表示
  function renderExplanationWithImages(content: string, images: { id: string, image_url: string }[]) {
    let replaced = content;
    images.forEach(({ id, image_url }) => {
      const regex = new RegExp(`(?:\n|\r|\s|^)+\\[img:${id}\\](?:\n|\r|\s|$)+`, 'g');
      replaced = replaced.replace(regex, `\n![](${image_url})\n`);
      replaced = replaced.replaceAll(`[img:${id}]`, `![](${image_url})`);
    });
    replaced = replaced.replace(/\n{3,}/g, '\n\n');
    return (
      <Box sx={{
        'img': {
          maxWidth: '400px',
          width: '100%',
          height: 'auto',
          display: 'block',
          margin: '16px auto',
        }
      }}>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{replaced}</ReactMarkdown>
      </Box>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            {problem.title}
          </Heading>
          <ChakraText color="gray.500" fontSize="sm">
            解説一覧
          </ChakraText>
        </Box>

        <HStack spacing={4}>
          <Button as={Link} href={`/problems/${problem.id}`} colorScheme="gray" variant="outline">
            問題に戻る
          </Button>
          {user && (
            <Button
              as={Link}
              href={`/problems/${problem.id}/explanations/new`}
              colorScheme="blue"
            >
              解説を投稿
            </Button>
          )}
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <ChakraText>解説を読み込み中...</ChakraText>
        ) : (
          <VStack spacing={4} align="stretch">
            {explanations.length === 0 ? (
              <ChakraText color="gray.500" fontSize="sm">
                まだ解説はありません。
              </ChakraText>
            ) : (
              <Accordion allowMultiple>
                {explanations.map((explanation) => (
                  <AccordionItem key={explanation.id} borderWidth="1px" borderRadius="lg" shadow="md" mb={4} p={4} bg="white">
                    <h2>
                      <AccordionButton _expanded={{ bg: 'gray.100' }} py={4}>
                        <Box flex="1" textAlign="left">
                          <HStack spacing={2} alignItems="center" flexWrap="wrap">
                            <ChakraText fontWeight="semibold" fontSize="md" mb={{ base: 1, md: 0 }}>
                              {explanation.title}
                            </ChakraText>
                            {explanation.is_official && (
                              <Badge colorScheme="green" mb={{ base: 1, md: 0 }}>公式解説</Badge>
                            )}
                            <ChakraText fontSize="sm" color="gray.500" mb={{ base: 1, md: 0 }}>
                              by <ColoredUserName
                                userId={explanation.user_id}
                                username={explanationAuthors[explanation.user_id]?.username || '不明'}
                                isAdmin={explanationAuthors[explanation.user_id]?.is_admin}
                                explanationCount={explanationCounts[explanation.user_id] || 0}
                                bestAnswerCount={bestAnswerCounts[explanation.user_id] || 0}
                                isProfileLink={!!explanationAuthors[explanation.user_id]?.is_public}
                                isExplanationNo1={!explanationAuthors[explanation.user_id]?.is_admin && no1ExplanationUsers.includes(explanation.user_id)}
                                isBestAnswerNo1={!explanationAuthors[explanation.user_id]?.is_admin && no1BestAnswerUsers.includes(explanation.user_id)}
                              />
                            </ChakraText>
                            <ChakraText fontSize="sm" color="gray.500" mb={{ base: 1, md: 0 }}>
                              {formatDistanceToNow(new Date(explanation.created_at), { addSuffix: true, locale: ja })}
                            </ChakraText>
                            {(isAdmin || user?.id === explanation.user_id) && (
                              <IconButton
                                aria-label="解説を削除"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExplanationToDeleteId(explanation.id);
                                  setDeleteDialogOpen(true);
                                }}
                              />
                            )}
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Box p={4} borderRadius="md" bg="gray.50">
                        {renderExplanationWithImages(explanation.content, explanation.explanation_images || [])}
                      </Box>
                      <HStack mt={4} justifyContent="flex-end">
                        {isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => handleToggleOfficial(explanation.id, explanation.is_official)}
                            colorScheme={explanation.is_official ? 'orange' : 'green'}
                          >
                            {explanation.is_official ? '公式解説解除' : '公式解説に設定'}
                          </Button>
                        )}
                        {user && explanation.user_id === user.id && (
                          <Button
                            size="sm"
                            as={Link}
                            href={`/problems/${problem.id}/explanations/edit/${explanation.id}`}
                            colorScheme="blue"
                          >
                            編集
                          </Button>
                        )}
                      </HStack>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </VStack>
        )}
      </VStack>

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              解説の削除
            </AlertDialogHeader>
            <AlertDialogBody>
              本当にこの解説を削除しますか？この操作は元に戻せません。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteDialogOpen(false)}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDeleteExplanation} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* 画像編集モーダル */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>画像を編集</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* 最適化設定 */}
              <Box p={4} borderWidth="1px" borderRadius="md">
                <ChakraFormControl display="flex" alignItems="center" mb={3}>
                  <ChakraFormLabel htmlFor="optimization" mb="0">
                    画像最適化を有効にする
                  </ChakraFormLabel>
                  <Switch
                    id="optimization"
                    isChecked={optimizationSettings.enabled}
                    onChange={(e) => setOptimizationSettings(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                  />
                </ChakraFormControl>
                
                {optimizationSettings.enabled && (
                  <VStack spacing={3} align="stretch">
                    <ChakraFormControl>
                      <ChakraFormLabel>最大幅: {optimizationSettings.maxWidth}px</ChakraFormLabel>
                      <Slider
                        value={optimizationSettings.maxWidth}
                        onChange={(val) => setOptimizationSettings(prev => ({
                          ...prev,
                          maxWidth: val
                        }))}
                        min={800}
                        max={3840}
                        step={100}
                      >
                        <SliderMark value={800} mt="2" ml="-2.5" fontSize="sm">800</SliderMark>
                        <SliderMark value={1920} mt="2" ml="-2.5" fontSize="sm">1920</SliderMark>
                        <SliderMark value={3840} mt="2" ml="-2.5" fontSize="sm">3840</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </ChakraFormControl>

                    <ChakraFormControl>
                      <ChakraFormLabel>品質: {Math.round(optimizationSettings.quality * 100)}%</ChakraFormLabel>
                      <Slider
                        value={optimizationSettings.quality}
                        onChange={(val) => setOptimizationSettings(prev => ({
                          ...prev,
                          quality: val
                        }))}
                        min={0.1}
                        max={1}
                        step={0.1}
                      >
                        <SliderMark value={0.1} mt="2" ml="-2.5" fontSize="sm">10%</SliderMark>
                        <SliderMark value={0.5} mt="2" ml="-2.5" fontSize="sm">50%</SliderMark>
                        <SliderMark value={1} mt="2" ml="-2.5" fontSize="sm">100%</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </ChakraFormControl>
                  </VStack>
                )}
              </Box>

              {/* 新しい画像のアップロード */}
              <Box>
                <ChakraFormLabel>新しい画像を追加</ChakraFormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddImages(e.target.files)}
                />
              </Box>

              {/* 新しい画像のプレビュー */}
              {newImages.length > 0 && (
                <Box>
                  <ChakraText fontSize="sm" fontWeight="medium" mb={2}>
                    追加する画像 ({newImages.length}枚)
                  </ChakraText>
                  <VStack spacing={2} align="stretch">
                    {newImages.map((image) => (
                      <Flex key={image.id} align="center" p={2} border="1px solid" borderColor="gray.200" borderRadius="md">
                        <Image
                          src={image.preview}
                          alt={image.file.name}
                          boxSize="60px"
                          objectFit="cover"
                          borderRadius="md"
                          mr={3}
                        />
                        <Box flex={1}>
                          <ChakraText fontSize="sm" fontWeight="medium">
                            {image.file.name}
                          </ChakraText>
                          <ChakraText fontSize="xs" color="gray.500">
                            {formatFileSize(image.file.size)}
                          </ChakraText>
                        </Box>
                        <IconButton
                          aria-label="画像を削除"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveNewImage(image.id)}
                        />
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* 既存の画像 */}
              {editingImages && explanations.find(e => e.id === editingImages)?.explanation_images && (
                <Box>
                  <ChakraText fontSize="sm" fontWeight="medium" mb={2}>
                    既存の画像
                  </ChakraText>
                  <VStack spacing={2} align="stretch">
                    {explanations
                      .find(e => e.id === editingImages)
                      ?.explanation_images
                      ?.sort((a, b) => a.position - b.position)
                      .map((image) => (
                        <Flex key={image.id} align="center" p={2} border="1px solid" borderColor="gray.200" borderRadius="md">
                          <Image
                            src={image.image_url}
                            alt={image.file_name}
                            boxSize="60px"
                            objectFit="cover"
                            borderRadius="md"
                            mr={3}
                          />
                          <Box flex={1}>
                            <ChakraText fontSize="sm" fontWeight="medium">
                              {image.file_name}
                            </ChakraText>
                            {image.file_size && (
                              <ChakraText fontSize="xs" color="gray.500">
                                {formatFileSize(image.file_size)}
                              </ChakraText>
                            )}
                          </Box>
                          <IconButton
                            aria-label="画像を削除"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteImage(image.id)}
                          />
                        </Flex>
                      ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              キャンセル
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveImages}
              isLoading={loading}
              loadingText="保存中..."
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
} 