import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ExplanationsClient from './ExplanationsClient'

export default async function ExplanationsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const { data: problem } = await supabase
    .from('problems')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!problem) {
    notFound()
  }

  return <ExplanationsClient problem={problem} />
} 