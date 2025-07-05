"use client";

import { Box, VStack, FormControl, FormLabel, Input, Button, useToast, FormHelperText, Checkbox, Textarea } from '@chakra-ui/react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileFormProps {
  initialUsername: string;
  initialIsPublic: boolean;
  initialAffiliation?: string;
  initialBio?: string;
  initialTwitter?: string;
  initialGithub?: string;
  initialWebsite?: string;
  initialOmc?: string;
}

export default function ProfileForm({
  initialUsername,
  initialIsPublic,
  initialAffiliation = '',
  initialBio = '',
  initialTwitter = '',
  initialGithub = '',
  initialWebsite = '',
  initialOmc = '',
}: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [affiliation, setAffiliation] = useState(initialAffiliation);
  const [bio, setBio] = useState(initialBio);
  const [twitter, setTwitter] = useState(initialTwitter);
  const [github, setGithub] = useState(initialGithub);
  const [website, setWebsite] = useState(initialWebsite);
  const [omc, setOmc] = useState(initialOmc);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const supabase = createClientComponentClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const MAX_USERNAME_LENGTH = 15;

    if (username.trim().length === 0) {
      toast({
        title: 'エラー',
        description: 'ユーザー名は空にできません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    if (username.trim().length > MAX_USERNAME_LENGTH) {
      toast({
        title: 'エラー',
        description: `ユーザー名は${MAX_USERNAME_LENGTH}文字以内で入力してください。`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // バッジ絵文字禁止
    const BADGE_EMOJIS = ['👑', '🌟'];
    if (BADGE_EMOJIS.some(e => username.includes(e))) {
      toast({
        title: 'エラー',
        description: 'ユーザー名に👑や🌟などのバッジ絵文字は使用できません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // ユーザー名の重複チェック
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (existingUser) {
      toast({
        title: 'エラー',
        description: 'このユーザー名は既に使用されています。別のユーザー名を選択してください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast({
        title: 'エラー',
        description: 'ユーザー情報の取得に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        is_public: isPublic,
        affiliation: affiliation.trim(),
        bio: bio.trim(),
        twitter: twitter.trim(),
        github: github.trim(),
        website: website.trim(),
        omc: omc.trim(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating username:', updateError);
      toast({
        title: 'エラー',
        description: updateError.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: '成功',
        description: 'プロフィールが更新されました！',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="start">
        <FormControl id="username">
          <FormLabel>ユーザー名</FormLabel>
          <Input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <FormHelperText>ユーザー名は15文字以内で入力してください。</FormHelperText>
        </FormControl>
        {isPublic && (
          <>
            <FormControl id="affiliation">
              <FormLabel>所属</FormLabel>
              <Input
                type="text"
                name="affiliation"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="学校名・会社名など"
              />
            </FormControl>
            <FormControl id="bio">
              <FormLabel>自己紹介</FormLabel>
              <Textarea
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介や目標を入力してください"
                rows={3}
              />
            </FormControl>
            <FormControl id="twitter">
              <FormLabel>X（Twitter）</FormLabel>
              <Input
                type="text"
                name="twitter"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username または URL"
              />
            </FormControl>
            <FormControl id="github">
              <FormLabel>GitHub</FormLabel>
              <Input
                type="text"
                name="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="ユーザー名 または URL"
              />
            </FormControl>
            <FormControl id="website">
              <FormLabel>個人ウェブサイト</FormLabel>
              <Input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </FormControl>
            <FormControl id="omc">
              <FormLabel>OMC</FormLabel>
              <Input
                type="text"
                name="omc"
                value={omc}
                onChange={(e) => setOmc(e.target.value)}
                placeholder="ユーザー名 または URL"
              />
            </FormControl>
          </>
        )}
        <FormControl id="is_public">
          <Checkbox
            isChecked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          >
            プロフィールを公開する <span style={{fontSize:'0.9em', color:'#888'}}>(SNSリンクなどが設定できます)</span>
          </Checkbox>
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          プロフィールを更新
        </Button>
      </VStack>
    </form>
  );
} 