import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import NewExplanationClient from '../../new/NewExplanationClient'

export default async function EditExplanationPage({
  params,
}: {
  params: { id: string; explanationId: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  // 問題情報取得
  const { data: problem } = await supabase
    .from('problems')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!problem) {
    notFound()
  }

  // 解説情報取得
  const { data: explanation } = await supabase
    .from('explanations')
    .select('*,explanation_images(*)')
    .eq('id', params.explanationId)
    .single()

  if (!explanation) {
    notFound()
  }

  return <NewExplanationClient problem={problem} initialExplanation={explanation} />
} 