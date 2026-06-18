/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum QuestionType {
  MultipleChoice = 'multiple_choice',
  TrueFalseMatrix = 'true_false_matrix',
  ShortAnswer = 'short_answer'
}

export interface QuestionMultipleChoice {
  id: string;
  type: QuestionType.MultipleChoice;
  text: string;
  imageUrl?: string;
  options: string[]; // Must be exactly 4 options
  optionsImages?: string[]; // Optional 4 image URLs for options
  correctAnswer: string; // 'A', 'B', 'C', or 'D'
  weight: number; // Custom scoring weight
}

export interface QuestionTrueFalseMatrix {
  id: string;
  type: QuestionType.TrueFalseMatrix;
  text: string;
  imageUrl?: string;
  statements: string[]; // Must be exactly 4 sub-statements
  statementsImages?: string[]; // Optional 4 image URLs for statements
  correctAnswers: boolean[]; // Must be exactly 4 booleans (true = Đúng, false = Sai)
}

export interface QuestionShortAnswer {
  id: string;
  type: QuestionType.ShortAnswer;
  text: string;
  imageUrl?: string;
  correctAnswer: string; // The exact answer (number or text string)
  weight: number; // Custom scoring weight
}

export type Question = QuestionMultipleChoice | QuestionTrueFalseMatrix | QuestionShortAnswer;

export interface CandidateResponse {
  questionId: string;
  type: QuestionType;
  multipleChoiceAnswer?: string; // 'A', 'B', 'C', or 'D'
  trueFalseAnswers?: (boolean | null)[]; // 4 options where true=Đúng, false=Sai, null=unanswered
  shortAnswerValue?: string;
}

export interface ScoreQuestionBreakdown {
  questionId: string;
  type: QuestionType;
  isCorrect: boolean; // boolean representing overall correctness or partial success
  statementCorrectCount?: number; // for true/false matrix (0-4)
  pointsEarned: number;
  maxPoints: number;
  candidateAnswerDetail: string; // short summary of what the candidate answered
  correctAnswerDetail: string; // summary of what the correct answer was
}

export interface CandidateSubmission {
  id: string;
  email: string;
  zaloName: string;
  submittedAt: string; // timestamp
  score: number; // total calculated score
  breakdown: ScoreQuestionBreakdown[];
}

export interface SystemSettings {
  communityImageUrl?: string;
  communityLink?: string;
  examDurationMinutes: number;
  isExamClosed: boolean;
}
