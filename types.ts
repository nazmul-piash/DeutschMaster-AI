
export enum ProficiencyLevel {
  A1 = 'A1',
  A2 = 'A2'
}

export type LessonStatus = 'locked' | 'available' | 'completed';

export interface Lesson {
  id: string;
  title: string;
  level: ProficiencyLevel;
  topic: string;
  description: string;
  status: LessonStatus;
  progress: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface UserProgress {
  completedLessons: string[];
  examScores: Record<string, number>;
  totalProgress: number;
  level: ProficiencyLevel;
}

export interface ExamSession {
  level: ProficiencyLevel;
  type: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  score?: number;
  feedback?: string;
}
