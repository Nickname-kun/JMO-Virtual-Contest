import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ProblemClient from './ProblemClient'

async function getProblem(id: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { data: problem, error } = await supabase
    .from('problems')
    .select('*, correct_answers')
    .eq('id', id)
    .single()

  if (error || !problem) {
    notFound()
  }

  return problem
}

export default async function ProblemPage({
  params,
}: {
  params: { id: string }
}) {
  const problem = await getProblem(params.id)
  return <ProblemClient problem={problem} />
} 