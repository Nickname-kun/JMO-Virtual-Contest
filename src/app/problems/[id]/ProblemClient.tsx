"use client"

import { Suspense, useRef } from 'react'
import SubmissionSection from './submission-section'
import { InlineMath, BlockMath } from 'react-katex'
import { renderLatex } from '@/utils/renderLatex'
import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  SimpleGrid,
  Badge,
  Flex,
  Container,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  List,
  ListItem,
  HStack,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { Comment } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import ColoredUserName from '@/components/ColoredUserName'

interface Problem {
  id: string
  title: string
  content: string
  correct_answers?: string[];
  has_diagram: boolean
  diagram_svg: string
  requires_multiple_answers: boolean
}

interface Explanation {
  id: string
  problem_id: string
  user_id: string
  content: string
  is_official: boolean
  created_at: string
  updated_at: string
  profiles?: {
    username: string | null
  }
}

function ProblemClientContent({ problem }: { problem: Problem }) {
  const supabase = createClientComponentClient();
  const user = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');

  const [showAllComments, setShowAllComments] = useState(false);
  const COMMENT_DISPLAY_LIMIT = 5;

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [commentAuthors, setCommentAuthors] = useState<{ [key: string]: { username: string; is_admin: boolean; is_public?: boolean } }>({});

  // 解説数No.1判定用データ
  const [explanationCounts, setExplanationCounts] = useState<Record<string, number>>({});
  const [no1ExplanationUsers, setNo1ExplanationUsers] = useState<string[]>([]);

  // ベストアンサー数集計
  const [bestAnswerCounts, setBestAnswerCounts] = useState<Record<string, number>>({});

  const [no1BestAnswerUsers, setNo1BestAnswerUsers] = useState<string[]>([]);

  const renderCommentContent = (content: string) => {
    const elements: JSX.Element[] = [];
    let lastIndex = 0;
    const mathRegex = /(?:^|[^\\])\$(.*?)(?:[^\\])?\$/g;
    let match;

    while ((match = mathRegex.exec(content)) !== null) {
      
    }
    
    const parts = content.split(/(\$.*?\$)/g);

    parts.forEach((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const mathContent = part.slice(1, -1);
        try {
           elements.push(
             <InlineMath key={`math-${index}`} math={mathContent} />
           );
        } catch (e) {
           console.error("Error rendering math in comment:", mathContent, e);
           elements.push(
              <Text as="span" key={`math-error-${index}`} color="red.500" fontFamily="sans-serif">
                 {part}
              </Text>
           );
        }
      } else {
        elements.push(
          <Text as="span" key={`text-${index}`} fontFamily="sans-serif">
            {part}
          </Text>
        );
      }
    });

    return elements;
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('problem_id', problem.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setCommentError('コメントの読み込みに失敗しました。');
    } else {
      setComments(data || []);
    }
    setLoadingComments(false);
  };

  useEffect(() => {
    fetchComments();
  }, [problem.id, supabase]);

  useEffect(() => {
    const fetchCommentAuthors = async () => {
      const authorIds = comments.map(comment => comment.user_id);
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
          setCommentAuthors(authorsMap);
        }
      }
    };

    fetchCommentAuthors();
  }, [comments, supabase]);

  useEffect(() => {
    const fetchCounts = async () => {
      const authorIds = comments.map(c => c.user_id);
      if (authorIds.length === 0) return;
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
  }, [comments, supabase]);

  useEffect(() => {
    const fetchBestAnswerCounts = async () => {
      const authorIds = comments.map(c => c.user_id);
      if (authorIds.length === 0) return;
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
  }, [comments, supabase]);

  useEffect(() => {
    const fetchNo1BestAnswerUsers = async () => {
      const authorIds = comments.map(c => c.user_id);
      if (authorIds.length === 0) return;
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
  }, [comments, supabase]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setCommentError('コメントするにはログインしてください。');
      return;
    }

    if (newComment.trim() === '') {
      setCommentError('コメント内容を入力してください。');
      return;
    }

    setPostingComment(true);
    setCommentError(null);

    const { error } = await supabase
      .from('comments')
      .insert({
        problem_id: problem.id,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (error) {
      console.error('Error posting comment:', error);
      setCommentError('コメントの投稿に失敗しました。');
    } else {
      setNewComment('');
      fetchComments();
    }
    setPostingComment(false);
  };

  const handleDeleteComment = async () => {
    if (!commentToDeleteId) return;

    setPostingComment(true);
    setDeleteDialogOpen(false);

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentToDeleteId);

    setPostingComment(false);
    setCommentToDeleteId(null);

    if (error) {
      console.error('Error deleting comment:', error);
      setCommentError('コメントの削除に失敗しました。');
    } else {
      fetchComments();
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(data?.is_admin || false);
      }
    };
    checkAdminStatus();
  }, [user, supabase]);

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">
          {problem.title}
        </Heading>
        <HStack spacing={4}>
          <Button as={Link} href="/problems" colorScheme="gray" variant="outline" size="sm">
          問題一覧へ戻る
        </Button>
          <Button as={Link} href={`/problems/${problem.id}/explanations`} colorScheme="blue" size="sm">
            解説を見る
          </Button>
        </HStack>
        
        <Box as="div" className="problem-text">{renderLatex(problem.content, problem.diagram_svg)}</Box>

        {problem.diagram_svg && !problem.content.includes('[DIAGRAM]') && (
          <Box display="flex" justifyContent="center">
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <div style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: problem.diagram_svg }} />
            </div>
          </Box>
        )}

        <SubmissionSection 
          problemId={problem.id}
          correctAnswers={problem.correct_answers || null}
          requires_multiple_answers={problem.requires_multiple_answers}
        />

        <Divider my={6} />

        <Box>
          {commentError && (
             <Alert status="error" mb={4}>
               <AlertIcon />
               {commentError}
             </Alert>
          )}
          {loadingComments ? (
            <Text>コメントを読み込み中...</Text>
          ) : (
            <List spacing={4}>
              {comments.length === 0 ? (
                <Text color="gray.500" fontSize="sm">まだコメントはありません。</Text>
              ) : (
                (showAllComments ? comments : comments.slice(0, COMMENT_DISPLAY_LIMIT)).map((comment) => (
                  <ListItem key={comment.id} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                    <Flex justify="space-between" align="center" mb={1}>
                      <ColoredUserName
                        userId={comment.user_id}
                        username={commentAuthors[comment.user_id]?.username || '匿名ユーザー'}
                        isAdmin={commentAuthors[comment.user_id]?.is_admin}
                        explanationCount={explanationCounts[comment.user_id] || 0}
                        bestAnswerCount={bestAnswerCounts[comment.user_id] || 0}
                        isProfileLink={!!commentAuthors[comment.user_id]?.is_public}
                        isExplanationNo1={!commentAuthors[comment.user_id]?.is_admin && no1ExplanationUsers.includes(comment.user_id)}
                        isBestAnswerNo1={!commentAuthors[comment.user_id]?.is_admin && no1BestAnswerUsers.includes(comment.user_id)}
                      />
                      <Text fontSize="xs" color="gray.500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ja })}</Text>
                    </Flex>
                    
                    {editingCommentId === comment.id ? (
                      <VStack align="stretch" spacing={2}>
                         <Textarea
                            value={editedCommentContent}
                            onChange={(e) => setEditedCommentContent(e.target.value)}
                            size="sm"
                            rows={3}
                         />
                         <HStack justify="flex-end">
                            <Button size="xs" onClick={() => setEditingCommentId(null)} variant="outline">キャンセル</Button>
                            <Button size="xs" colorScheme="blue" onClick={async () => {
                               if (editedCommentContent.trim() === '') return;
                               setPostingComment(true);
                               const { error } = await supabase
                                   .from('comments')
                                   .update({ content: editedCommentContent.trim() })
                                   .eq('id', comment.id);
                               setPostingComment(false);
                               if (error) {
                                   console.error('Error updating comment:', error);
                                   setCommentError('コメントの更新に失敗しました。');
                               } else {
                                   setEditingCommentId(null);
                                   fetchComments();
                               }
                            }} isLoading={postingComment}>保存</Button>
                         </HStack>
                      </VStack>
                    ) : (
                      <Box fontSize="sm">{renderCommentContent(comment.content)}</Box>
                    )}

                    {user && user.id === comment.user_id && editingCommentId !== comment.id && (
                      <HStack spacing={2} mt={2} justify="flex-end">
                         <Button size="xs" onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditedCommentContent(comment.content);
                         }} variant="outline">編集</Button>
                         <Button size="xs" colorScheme="red" onClick={async () => {
                            setCommentToDeleteId(comment.id);
                            setDeleteDialogOpen(true);
                         }} isLoading={postingComment}>削除</Button>
                      </HStack>
                    )}
                  </ListItem>
                ))
              )}
            </List>
          )}

          {!loadingComments && comments.length > COMMENT_DISPLAY_LIMIT && (
             <Flex justify="center" mt={4}>
               <Button size="sm" variant="link" onClick={() => setShowAllComments(!showAllComments)}>
                 {showAllComments ? '一部を表示' : 'すべて表示'}
               </Button>
             </Flex>
          )}

          {user ? (
             <Box mt={6} as="form" onSubmit={handlePostComment}>
               <FormControl>
                 <FormLabel htmlFor="new-comment">新しいコメント</FormLabel>
                 <Box
                   border="1px solid"
                   borderColor="gray.300"
                   borderRadius={6}
                   bg="gray.50"
                   p={1}
                 >
                   <Textarea
                     id="new-comment"
                     placeholder="コメントを入力... (LaTeX 使用可)"
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     size="sm"
                     rows={3}
                   />
                 </Box>
               </FormControl>
               <Button mt={2} size="sm" colorScheme="blue" type="submit" isLoading={postingComment}>
                 コメントを投稿
               </Button>
             </Box>
          ) : (
             <Box mt={6}>
               <Text color="gray.500" fontSize="sm">コメントを投稿するにはログインが必要です。</Text>
               <Button as={Link} href="/auth" colorScheme="blue" size="sm" mt={2}>
                 ログインする
               </Button>
             </Box>
          )}
        </Box>

        <AlertDialog
          isOpen={isDeleteDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">コメントの削除</AlertDialogHeader>
              <AlertDialogCloseButton />
              <AlertDialogBody>
                このコメントを完全に削除してもよろしいですか？ この操作は元に戻せません。
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
                <Button colorScheme="red" onClick={handleDeleteComment} ml={3} isLoading={postingComment}>
                  削除
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

      </VStack>
    </Container>
  )
}

export default function ProblemClient(props: { problem: Problem }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProblemClientContent {...props} />
    </Suspense>
  )
} 