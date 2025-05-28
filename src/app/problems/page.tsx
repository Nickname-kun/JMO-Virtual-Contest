import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import ProblemsClient from './ProblemsClient'

export default async function ProblemsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  let correctProblemIds: string[] = [];
  if (userId) {
    const { data: correctSubs } = await supabase
      .from('submissions')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('is_correct', true);
    if (correctSubs) {
      correctProblemIds = correctSubs.map((s: any) => s.problem_id);
    }
  }
  const { data: contests } = await supabase
    .from('contests')
    .select('*')
    .order('name', { ascending: false })
  const problemsByContest = await Promise.all(
    (contests || []).map(async (contest) => {
      const { data: problems } = await supabase
        .from('problems')
        .select('*')
        .eq('contest_id', contest.id)
        .order('number', { ascending: true })
      return {
        contest,
        problems: problems || []
      }
    })
  )
  return <ProblemsClient problemsByContest={problemsByContest} correctProblemIds={correctProblemIds} />
} 