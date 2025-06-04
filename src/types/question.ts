import { Database } from './database';

export type Category = Database['public']['Tables']['categories']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Answer = Database['public']['Tables']['answers']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type QuestionWithDetails = Question & {
  category: Category;
  user: Profile;
  answers: (Answer & {
    user: Profile;
  })[];
  _count: {
    answers: number;
  };
}; 