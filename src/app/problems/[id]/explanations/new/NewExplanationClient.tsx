"use client"

import { useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  useToast,
  HStack,
  Input,
  Image,
  IconButton,
  Flex,
  Text as ChakraText,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react'
import Link from 'next/link'
import { renderLatex } from '@/utils/renderLatex'
import { DeleteIcon, AddIcon, DragHandleIcon } from '@chakra-ui/icons'
import { Problem } from '@/types/problem'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  position: number;
}

interface SortableImageItemProps {
  image: UploadedImage;
  onRemove: (id: string) => void;
  borderColor: string;
}

function SortableImageItem({ image, onRemove, borderColor }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      p={2}
      border="1px solid"
      borderColor={isDragging ? 'blue.400' : borderColor}
      borderRadius="md"
      bg={isDragging ? 'blue.50' : 'white'}
      boxShadow={isDragging ? 'lg' : 'none'}
      transition="all 0.2s"
    >
      <Flex align="center">
        <Box
          {...attributes}
          {...listeners}
          mr={3}
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
        >
          <DragHandleIcon color="gray.400" />
        </Box>
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
            {(image.file.size / 1024 / 1024).toFixed(2)} MB
          </ChakraText>
          <Badge size="sm" colorScheme="blue" mt={1}>
            順序: {image.position + 1}
          </Badge>
        </Box>
        <IconButton
          aria-label="画像を削除"
          icon={<DeleteIcon />}
          size="sm"
          colorScheme="red"
          variant="ghost"
          onClick={() => onRemove(image.id)}
        />
      </Flex>
    </Box>
  )
}

interface ImageMapEntry {
  id: string;
  url: string;
  file_name: string;
  file_size: number;
  storage_path: string;
}

export default function NewExplanationClient({ problem, initialExplanation }: { problem: Problem, initialExplanation?: any }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const toast = useToast()
  const [content, setContent] = useState(initialExplanation?.content || '')
  const [title, setTitle] = useState(initialExplanation?.title || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageMap, setImageMap] = useState<ImageMapEntry[]>(
    initialExplanation?.explanation_images?.map((img: any) => ({
      id: img.id,
      url: img.image_url,
      file_name: img.file_name,
      file_size: img.file_size,
      storage_path: img.storage_path || `${img.id}-${img.file_name}`,
    })) || []
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const insertImageTag = (id: string) => {
    if (!textareaRef.current) {
      setContent(content + `\n[img:${id}]\n`)
      return
    }
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    const newContent = before + `[img:${id}]` + after
    setContent(newContent)
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + `[img:${id}]`.length
    }, 0)
  }

  const handleImageUploadAndInsert = async (files: FileList | null) => {
    if (!files) return
    const maxFileSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        toast({ title: 'エラー', description: `${file.name} のサイズが5MBを超えています。`, status: 'error', duration: 3000, isClosable: true })
        continue
      }
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'エラー', description: `${file.name} は対応していないファイル形式です。`, status: 'error', duration: 3000, isClosable: true })
        continue
      }
      // 画像IDをUUIDで発行
      const newId = crypto.randomUUID();
      const fileName = `${newId}-${file.name}`
      // Storageにアップロード
      const { data, error } = await supabase.storage.from('explanations-images').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) {
        toast({ title: 'エラー', description: `${file.name} のアップロードに失敗しました。`, status: 'error', duration: 3000, isClosable: true })
        continue
      }
      // 公開URL取得
      const { data: urlData } = supabase.storage.from('explanations-images').getPublicUrl(fileName)
      if (urlData && urlData.publicUrl) {
        setImageMap(prev => [...prev, { id: newId, url: urlData.publicUrl, file_name: file.name, file_size: file.size, storage_path: fileName }])
        insertImageTag(newId)
        toast({ title: '画像挿入', description: '画像を本文に挿入しました。', status: 'success', duration: 2000, isClosable: true })
      }
    }
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return

    const newImages: UploadedImage[] = []
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    Array.from(files).forEach((file, index) => {
      if (file.size > maxFileSize) {
        toast({
          title: 'エラー',
          description: `${file.name} のサイズが5MBを超えています。`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'エラー',
          description: `${file.name} は対応していないファイル形式です。`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `temp-${Date.now()}-${index}`,
          file,
          preview: e.target?.result as string,
          position: uploadedImages.length + newImages.length,
        }
        newImages.push(newImage)
        
        if (newImages.length === Array.from(files).length) {
          setUploadedImages(prev => [...prev, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setUploadedImages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // 位置を更新
        return newItems.map((item, index) => ({
          ...item,
          position: index,
        }))
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleImageUploadAndInsert(e.dataTransfer.files)
  }

  const uploadImagesToStorage = async (explanationId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const image of uploadedImages) {
      const fileName = `${explanationId}/${Date.now()}-${image.file.name}`
      const { data, error } = await supabase.storage
        .from('explanations-images')
        .upload(fileName, image.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading image:', error)
        throw new Error(`画像のアップロードに失敗しました: ${image.file.name}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('explanations-images')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const isEdit = !!initialExplanation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('タイトルを入力してください。')
      return
    }
    if (!content.trim()) {
      setError('解説を入力してください。')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('Error getting user:', userError)
        setError('ユーザー情報の取得に失敗しました。再度ログインしてください。')
        setLoading(false)
        return
    }

    try {
      // 本文中の[img:UUID]を抽出
      const imgTagRegex = /\[img:([a-fA-F0-9\-]+)\]/g;
      const usedIds: string[] = [];
      let match;
      while ((match = imgTagRegex.exec(content)) !== null) {
        usedIds.push(match[1]);
      }
      // imageMapから未使用画像を抽出
      const unusedImages = imageMap.filter(img => !usedIds.includes(img.id));
      // 未使用画像をStorageから削除
      for (const img of unusedImages) {
        await supabase.storage.from('explanations-images').remove([img.storage_path]);
      }

      let explanationData;
      let submitError;
      if (isEdit) {
        // 編集（update）
        const { data, error } = await supabase
          .from('explanations')
          .update({
            content: content.trim(),
            title: title.trim(),
          })
          .eq('id', initialExplanation.id)
          .select()
          .single();
        explanationData = data;
        submitError = error;
      } else {
        // 新規作成（insert）
        const { data, error } = await supabase
        .from('explanations')
        .insert([
          {
            problem_id: problem.id,
            content: content.trim(),
            user_id: user.id,
            title: title.trim(),
          },
        ])
        .select()
          .single();
        explanationData = data;
        submitError = error;
      }

      if (submitError) {
        console.error('Error submitting explanation:', submitError)
        setError(isEdit ? '解説の編集に失敗しました。' : '解説の投稿に失敗しました。')
        toast({
          title: 'エラー',
          description: isEdit ? '解説の編集に失敗しました。' : '解説の投稿に失敗しました。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setLoading(false)
        return
      }

      // 画像情報の更新（編集時は一度削除して再insert）
      if (isEdit) {
        // 既存のexplanation_imagesを削除
        await supabase.from('explanation_images').delete().eq('explanation_id', initialExplanation.id);
      }
      // 本文中の[img:UUID]タグに対応する画像のみexplanation_imagesにinsert
      if (usedIds.length > 0) {
        const imageRecords = usedIds.map((id, position) => {
          const mapEntry = imageMap.find(img => img.id === id);
          if (!mapEntry) return null;
          return {
            id,
            explanation_id: explanationData.id,
            image_url: mapEntry.url,
            file_name: mapEntry.file_name,
            file_size: mapEntry.file_size,
            position,
          };
        }).filter(Boolean);
        if (imageRecords.length > 0) {
          const { error: imageError } = await supabase
            .from('explanation_images')
            .insert(imageRecords);
          if (imageError) {
            console.error('Error saving image records:', imageError)
            toast({
              title: '警告',
              description: '画像情報の保存に失敗しました。',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            })
          }
        }
      }

      // 画像がある場合はアップロード
      if (uploadedImages.length > 0) {
        try {
          const imageUrls = await uploadImagesToStorage(explanationData.id)
          // 画像情報をデータベースに保存
          const imageRecords = uploadedImages.map((image, index) => ({
            explanation_id: explanationData.id,
            image_url: imageUrls[index],
            file_name: image.file.name,
            file_size: image.file.size,
            position: image.position,
          }))
          const { error: imageError } = await supabase
            .from('explanation_images')
            .insert(imageRecords)
          if (imageError) {
            console.error('Error saving image records:', imageError)
            toast({
              title: '警告',
              description: isEdit ? '解説は編集されましたが、画像の保存に失敗しました。' : '解説は投稿されましたが、画像の保存に失敗しました。',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            })
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError)
          toast({
            title: '警告',
            description: isEdit ? '解説は編集されましたが、画像のアップロードに失敗しました。' : '解説は投稿されましたが、画像のアップロードに失敗しました。',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        }
      }

      // 通知（新規作成時のみ）
      if (!isEdit) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true);
      let posterName = '';
      const { data: posterProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (posterProfile && posterProfile.username) {
        posterName = posterProfile.username;
      }
      if (admins && Array.isArray(admins)) {
        const notificationInserts = admins.map((admin) => ({
          user_id: admin.id,
          type: 'explanation_posted',
          message: `新しいユーザー解説が投稿されました（${title.trim()}）\n問題: ${problem.title}\n投稿者: ${posterName}`,
          related_entity_id: problem.id,
          is_read: false,
        }));
        if (notificationInserts.length > 0) {
          await supabase.from('notifications').insert(notificationInserts);
          }
        }
      }
      toast({
        title: '成功',
        description: isEdit ? '解説を編集しました。' : '解説を投稿しました。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      router.push(`/problems/${problem.id}/explanations`)
    } catch (error) {
      console.error('Error in submission process:', error)
      setError(isEdit ? '解説の編集に失敗しました。' : '解説の投稿に失敗しました。')
      setLoading(false)
    }
    setLoading(false)
  }

  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const bgColor = useColorModeValue('gray.50', 'gray.700')

  // プレビュー用：タグを画像Markdownに置換し、react-markdownで表示
  const renderWithImages = (text: string) => {
    let replaced = text;
    imageMap.forEach(({ id, url }) => {
      replaced = replaced.replaceAll(`[img:${id}]`, `![](${url})`);
    });
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: (props) => (
            <img
              {...props}
              style={{
                maxWidth: '400px',
                width: '100%',
                height: 'auto',
                display: 'block',
                margin: '16px auto',
                ...props.style,
              }}
            />
          ),
        }}
      >
        {replaced}
      </ReactMarkdown>
    );
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            {problem.title}
          </Heading>
          <Text color="gray.500" fontSize="sm">
            {isEdit ? '解説を編集' : '解説を投稿'}
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>タイトル</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="解説のタイトルを入力してください"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>画像（任意）</FormLabel>
              <Box
                border="2px dashed"
                borderColor={isDragOver ? 'blue.400' : borderColor}
                borderRadius="md"
                p={6}
                textAlign="center"
                bg={isDragOver ? 'blue.50' : bgColor}
                transition="all 0.2s"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleImageUploadAndInsert(e.dataTransfer.files); }}
              >
                <VStack spacing={4}>
                  <ChakraText fontSize="lg" fontWeight="medium">
                    画像をドラッグ&ドロップまたはクリックして選択（本文中に[img:ID]タグで挿入されます）
                  </ChakraText>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUploadAndInsert(e.target.files)}
                    display="none"
                    id="image-upload"
                  />
                  <Button
                    as="label"
                    htmlFor="image-upload"
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<AddIcon />}
                    cursor="pointer"
                  >
                    画像を選択
                  </Button>
                  <ChakraText fontSize="sm" color="gray.500">
                    対応形式: JPG, PNG, GIF, WebP（最大5MB）
                  </ChakraText>
                </VStack>
              </Box>
              <Box mt={2} p={3} bg="gray.50" borderRadius="md" fontSize="sm" color="gray.700">
                <b>画像の挿入・管理について</b><br />
                ・画像をアップロードすると、本文中に <b>[img:画像ID]</b> タグが自動で挿入されます。<br />
                ・このタグがある位置に画像が表示されます。表示位置を変えたい場合はタグを好きな場所に移動してください。<br />
                ・画像を削除したい場合は、本文中から該当する <b>[img:画像ID]</b> タグを削除して「保存」してください。タグが削除された画像は自動でデータベースからも削除されます。<br />
                ・画像は最大5MBまで、対応形式はJPG, PNG, GIF, WebPです。<br />
              </Box>
            </FormControl>

            {uploadedImages.length > 0 && (
              <Box>
                <ChakraText fontSize="sm" fontWeight="medium" mb={2}>
                  アップロード済み画像 ({uploadedImages.length}枚)
                </ChakraText>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={uploadedImages.map(img => img.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <VStack spacing={2} align="stretch">
                      {uploadedImages.map((image) => (
                        <SortableImageItem
                          key={image.id}
                          image={image}
                          onRemove={handleRemoveImage}
                          borderColor={borderColor}
                        />
                      ))}
                    </VStack>
                  </SortableContext>
                </DndContext>
              </Box>
            )}

            <FormControl isRequired>
              <FormLabel>解説</FormLabel>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="解説を入力してください。LaTeXの数式は $...$ で囲んでください。画像は[img:ID]タグで本文中に挿入されます。"
                minH="200px"
              />
              <FormHelperText>
                LaTeXの数式は $...$ で、Markdownも使用できます。画像は[img:ID]タグで本文中に挿入されます。
              </FormHelperText>
            </FormControl>

            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Heading as="h2" size="md" mb={2}>プレビュー</Heading>
              {renderWithImages(content)}
            </Box>

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <HStack spacing={4}>
              <Button
                as={Link}
                href={`/problems/${problem.id}/explanations`}
                colorScheme="gray"
                variant="outline"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText={isEdit ? '編集中...' : '投稿中...'}
              >
                {isEdit ? '編集を保存' : '投稿する'}
              </Button>
            </HStack>
          </VStack>
        </form>

      </VStack>
    </Container>
  )
} 