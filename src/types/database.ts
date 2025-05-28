export type Database = {
  public: {
    Tables: {
      problems: {
        Row: Problem;
        Insert: Omit<Problem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Problem, 'id'>>;
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, 'id' | 'submitted_at' | 'created_at'>;
        Update: Partial<Omit<Submission, 'id'>>;
      };
      virtual_contests: {
        Row: VirtualContest;
        Insert: Omit<VirtualContest, 'id' | 'score'>;
        Update: Partial<Omit<VirtualContest, 'id'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      contests: {
        Row: Contest;
        Insert: Omit<Contest, 'id' | 'created_at'>;
        Update: Partial<Omit<Contest, 'id'>>;
      };
    };
  };
};

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