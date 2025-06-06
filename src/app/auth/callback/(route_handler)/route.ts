import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      // TwitterなどのOAuth認証でログインした場合の処理
      if (data.user.app_metadata.provider) {
        const provider = data.user.app_metadata.provider;
        let username = data.user.email; // デフォルトとしてメールアドレスを使用

        // プロバイダー固有のメタデータからユーザー名を取得
        if (provider === 'twitter' && data.user.user_metadata) {
          // Twitterの場合、user_metadataからnameまたはscreen_nameを取得
          username = data.user.user_metadata.name || data.user.user_metadata.screen_name || data.user.email;
        }
        // 他のプロバイダーを追加する場合はここに追加
        // else if (provider === 'google' && data.user.raw_user_meta_data) { ... }

        // profilesテーブルにユーザー情報をupsert
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: username as string, // 取得したユーザー名をセット
            is_admin: false, // 必要に応じてデフォルト値を設定
          }, { onConflict: 'id' }); // idが重複した場合は更新

        if (profileError) {
          console.error('Error upserting profile for user', data.user.id, ':', profileError);
          // エラーハンドリングを適切に追加
        }
      }
    } else if (error) {
      console.error('Error exchanging code for session:', error);
    }
  }

  // 認証後にリダイレクトするURL
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 