/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, QuestionType, CandidateResponse, ScoreQuestionBreakdown, CandidateSubmission, SystemSettings } from './types';
import { INITIAL_QUESTIONS, INITIAL_SUBMISSIONS } from './data';

/**
 * Calculates scores and returns breakdown details for a single question based on candidate responses
 */
export function calculateQuestionScore(question: Question, response: CandidateResponse | undefined): ScoreQuestionBreakdown {
  const breakdown: ScoreQuestionBreakdown = {
    questionId: question.id,
    type: question.type,
    isCorrect: false,
    pointsEarned: 0,
    maxPoints: 0,
    candidateAnswerDetail: '',
    correctAnswerDetail: '',
  };

  if (!response) {
    breakdown.candidateAnswerDetail = 'Không trả lời (No answer)';
    if (question.type === QuestionType.MultipleChoice) {
      breakdown.maxPoints = question.weight;
      breakdown.correctAnswerDetail = `Đáp án đúng: ${question.correctAnswer}`;
    } else if (question.type === QuestionType.TrueFalseMatrix) {
      breakdown.maxPoints = 1.0;
      breakdown.correctAnswerDetail = question.correctAnswers.map((a, i) => `Ý ${i + 1}: ${a ? 'Đúng' : 'Sai'}`).join(', ');
    } else if (question.type === QuestionType.ShortAnswer) {
      breakdown.maxPoints = question.weight;
      breakdown.correctAnswerDetail = `Đáp án đúng: ${question.correctAnswer}`;
    }
    return breakdown;
  }

  if (question.type === QuestionType.MultipleChoice) {
    const isCorrect = response.multipleChoiceAnswer === question.correctAnswer;
    breakdown.maxPoints = question.weight;
    breakdown.pointsEarned = isCorrect ? question.weight : 0;
    breakdown.isCorrect = isCorrect;
    breakdown.candidateAnswerDetail = response.multipleChoiceAnswer ? `Chọn: ${response.multipleChoiceAnswer}` : 'Chưa chọn';
    breakdown.correctAnswerDetail = `Đáp án đúng: ${question.correctAnswer}`;
  } else if (question.type === QuestionType.TrueFalseMatrix) {
    breakdown.maxPoints = 1.0;
    const userAnswers = response.trueFalseAnswers || [];
    let correctCount = 0;
    const detailParts: string[] = [];
    
    // Evaluate 4 sub-statements
    for (let i = 0; i < 4; i++) {
      const uAns = userAnswers[i];
      const cAns = question.correctAnswers[i];
      // Note: uAns can be true, false, or null (if candidate missed selecting it)
      const isPartCorrect = uAns !== null && uAns !== undefined && uAns === cAns;
      if (isPartCorrect) {
        correctCount++;
      }
      detailParts.push(`Ý ${i + 1}: ${uAns === null || uAns === undefined ? '_' : (uAns ? 'Đ' : 'S')}`);
    }

    // Scoring Rules breakdown
    let points = 0;
    if (correctCount === 4) points = 1.0;
    else if (correctCount === 3) points = 0.5;
    else if (correctCount === 2) points = 0.25;
    else if (correctCount === 1) points = 0.1;
    else points = 0.0;

    breakdown.pointsEarned = points;
    breakdown.statementCorrectCount = correctCount;
    breakdown.isCorrect = correctCount === 4;
    
    breakdown.candidateAnswerDetail = detailParts.join(' | ');
    breakdown.correctAnswerDetail = question.correctAnswers.map((a, i) => `Ý ${i + 1}: ${a ? 'Đ' : 'S'}`).join(' | ');
  } else if (question.type === QuestionType.ShortAnswer) {
    breakdown.maxPoints = question.weight;
    const candVal = (response.shortAnswerValue || '').trim().toLowerCase();
    const corrVal = (question.correctAnswer || '').trim().toLowerCase();
    const isCorrect = candVal !== '' && candVal === corrVal;
    
    breakdown.pointsEarned = isCorrect ? question.weight : 0;
    breakdown.isCorrect = isCorrect;
    breakdown.candidateAnswerDetail = response.shortAnswerValue ? `Nhập: ${response.shortAnswerValue}` : 'Chưa nhập';
    breakdown.correctAnswerDetail = `Đáp án đúng: ${question.correctAnswer}`;
  }

  return breakdown;
}

/**
 * LocalStorage Helpers
 */
export const STORAGE_KEY_QUESTIONS = 'exam_practice_questions';
export const STORAGE_KEY_SUBMISSIONS = 'exam_practice_submissions';
export const STORAGE_KEY_PUBLIC_SCORES = 'exam_practice_public_scores';

export function loadQuestions(): Question[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading questions from localStorage', e);
  }
  return [];
}

export function saveQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error('Error saving questions to localStorage', e);
  }
}

export function loadSubmissions(): CandidateSubmission[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading submissions from localStorage', e);
  }
  return [];
}

export function saveSubmissions(submissions: CandidateSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  } catch (e) {
    console.error('Error saving submissions to localStorage', e);
  }
}

export function loadScoresPublic(): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PUBLIC_SCORES);
    if (data) {
      return JSON.parse(data) === true;
    }
  } catch (e) {
    console.error('Error loading public score status', e);
  }
  return false; // Defaults to false as requested
}

export function saveScoresPublic(status: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_PUBLIC_SCORES, JSON.stringify(status));
  } catch (e) {
    console.error('Error saving public flags to localStorage', e);
  }
}

export const STORAGE_KEY_SYSTEM_SETTINGS = 'exam_practice_system_settings';

export function loadSystemSettings(): SystemSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SYSTEM_SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading system settings', e);
  }
  return {
    examDurationMinutes: 30,
    isExamClosed: false
  };
}

export function saveSystemSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving system settings', e);
  }
}

/**
 * Format date nicely
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}
