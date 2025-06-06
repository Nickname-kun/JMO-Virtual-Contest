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

    // 認証後のユーザー情報の取得やprofilesへの保存はクライアントサイドで行う

    if (error) {
      console.error('Error exchanging code for session:', error);
    }
  }

  // 認証後にリダイレクトするURL
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 