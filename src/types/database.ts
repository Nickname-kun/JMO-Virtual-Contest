export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          is_admin: boolean
        }
        Insert: {
          id: string
          username: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          username?: string
          is_admin?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Problem = {
  id: string;
  title: string;
  content: string;
  correct_answers: string[];
  points: number;
  number: number;
  contest_id: string;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  problem_id: string;
  user_id: string;
  answer: string;
  is_correct: boolean;
  submitted_at: string;
  created_at: string;
  problems?: {
    id: string;
    title: string;
    number: number;
    field: string;
  };
};

export type VirtualContest = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: 'not_started' | 'in_progress' | 'finished';
  score: number;
  contest_id: string;
  contests?: {
    id: string;
    name: string;
  };
};

export type Profile = {
  id: string;
  is_admin: boolean;
  username: string | null;
};

export type Contest = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  created_at: string;
};

export type Comment = {
  id: string;
  problem_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { // コメント投稿者のプロフィール情報を取得する場合に備えて追加
    username: string | null;
  };
};

export interface VirtualContestContest {
  id: string;
  name: string;
}

export interface VirtualContest {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  score: number;
  contest_id: string | null;
  // Supabaseのリレーション取得は配列で返されるため、型を修正
  contests: VirtualContestContest[] | null; 
} 