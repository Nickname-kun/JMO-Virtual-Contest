export interface Problem {
  id: string
  title: string
  content: string
  answer: string
  points: number
  year: number
  number: number
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  problem_id: string
  user_id: string
  answer: string
  is_correct: boolean
  submitted_at: string
}

export interface VirtualContest {
  id: string
  user_id: string
  start_time: string
  end_time: string
  status: 'not_started' | 'in_progress' | 'finished'
  score: number
} 