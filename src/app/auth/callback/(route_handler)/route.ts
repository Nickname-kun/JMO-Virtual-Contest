import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    console.log('Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // 認証後のユーザー情報の取得やprofilesへの保存はクライアントサイドで行う

    if (error) {
      console.error('Error exchanging code for session:', error);
    } else if (data.session) {
      console.log('Session established successfully:', data.session);
    } else {
      console.log('Code exchanged, but no session returned.');
    }
  }

  // 認証後にリダイレクトするURL
  // Supabaseのauth-helpersがセッションクッキーを設定した後、
  // クライアントサイドで認証状態が検知され次第、
  // Next.jsのミドルウェアやルートガードによって適切なページにリダイレクトされる想定。
  // ここでは単純にサイトのルートにリダイレクト。
  console.log('Redirecting to:', new URL('/', request.url).toString());
  return NextResponse.redirect(new URL('/', request.url));
} 