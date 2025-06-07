import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import NewExplanationClient from './NewExplanationClient'

export default async function NewExplanationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  const { data: problem } = await supabase
    .from('problems')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!problem) {
    notFound()
  }

  return <NewExplanationClient problem={problem} />
} 