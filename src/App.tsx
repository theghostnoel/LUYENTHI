/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Settings, 
  ShieldAlert, 
  CheckSquare, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { Question, CandidateResponse, CandidateSubmission, QuestionType, ScoreQuestionBreakdown, SystemSettings } from './types';
import { 
  loadQuestions, 
  saveQuestions, 
  loadSubmissions, 
  saveSubmissions, 
  loadScoresPublic, 
  saveScoresPublic,
  calculateQuestionScore,
  loadSystemSettings,
  saveSystemSettings
} from './utils';
import { INITIAL_QUESTIONS, INITIAL_SUBMISSIONS } from './data';
import CandidateSection from './components/CandidateSection';
import AdminSection from './components/AdminSection';
import { onSnapshot } from 'firebase/firestore';
import { 
  questionsCol, 
  submissionsCol, 
  settingsDoc, 
  syncSaveQuestion, 
  syncDeleteQuestion, 
  syncAddSubmission, 
  syncClearSubmissions, 
  syncClearQuestions, 
  syncSeedQuestions, 
  syncSeedSubmissions, 
  syncUpdateSettings,
  handleFirestoreError,
  OperationType
} from './firebase';

export default function App() {
  // State from localStorage persistence / fallback
  const [questions, setQuestions] = useState<Question[]>(() => loadQuestions());
  const [submissions, setSubmissions] = useState<CandidateSubmission[]>(() => loadSubmissions());
  const [isScoresPublic, setIsScoresPublic] = useState<boolean>(() => loadScoresPublic());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadSystemSettings());

  // Subscribe to real-time updates from Firestore on mount
  useEffect(() => {
    // 1. Subscribe to Questions
    const unsubscribeQuestions = onSnapshot(questionsCol, (snapshot) => {
      const list: Question[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      // Sort alphabetically/chronologically by ID or createdAt
      list.sort((a, b) => a.id.localeCompare(b.id));
      setQuestions(list);
      saveQuestions(list);
    }, (err) => {
      console.warn("Firestore questions subscription is waiting or disconnected:", err.message);
    });

    // 2. Subscribe to Submissions
    const unsubscribeSubmissions = onSnapshot(submissionsCol, (snapshot) => {
      const list: CandidateSubmission[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      // Sort by submission date descending (newest first)
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      setSubmissions(list);
      saveSubmissions(list);
    }, (err) => {
      console.warn("Firestore submissions subscription is waiting or disconnected:", err.message);
    });

    // 3. Subscribe to SettingsDoc
    const unsubscribeSettings = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.isScoresPublic !== undefined) {
          setIsScoresPublic(data.isScoresPublic);
          saveScoresPublic(data.isScoresPublic);
        }
        if (data.systemSettings !== undefined) {
          setSystemSettings(data.systemSettings);
          saveSystemSettings(data.systemSettings);
        }
      } else {
        // Doc settings/global doesn't exist yet, seed initial values and default questions in Firestore
        Promise.all([
          syncUpdateSettings(false, {
            examDurationMinutes: 30,
            isExamClosed: false
          }),
          syncSeedQuestions(INITIAL_QUESTIONS)
        ]).catch(err => {
          console.error("Failed to seed initial settings in Firestore:", err);
        });
      }
    }, (err) => {
      console.warn("Firestore system settings subscription is waiting or disconnected:", err.message);
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeSubmissions();
      unsubscribeSettings();
    };
  }, []);

  // Navigation tab: 'candidate' | 'admin'
  const [activeTab, setActiveTab] = useState<'candidate' | 'admin'>('candidate');

  // Question CRUD handlers (using async Firestore updates)
  const handleAddQuestion = (newQ: Question) => {
    syncSaveQuestion(newQ).catch(err => {
      console.error("Error adding question:", err);
    });
  };

  const handleEditQuestion = (editedQ: Question) => {
    syncSaveQuestion(editedQ).catch(err => {
      console.error("Error updating question:", err);
    });
  };

  const handleDeleteQuestion = (id: string) => {
    syncDeleteQuestion(id).catch(err => {
      console.error("Error deleting question:", err);
    });
  };

  const handleToggleScoresPublic = (val: boolean) => {
    syncUpdateSettings(val, systemSettings).catch(err => {
      console.error("Error toggling public scores:", err);
    });
  };

  const handleClearSubmissions = () => {
    syncClearSubmissions().catch(err => {
      console.error("Error clearing submissions:", err);
    });
  };

  const handleClearQuestions = () => {
    syncClearQuestions().catch(err => {
      console.error("Error clearing questions:", err);
    });
  };

  const handleLoadMockData = () => {
    setIsScoresPublic(true);
    syncSeedQuestions(INITIAL_QUESTIONS)
      .then(() => syncSeedSubmissions(INITIAL_SUBMISSIONS))
      .then(() => syncUpdateSettings(true, {
        examDurationMinutes: 30,
        isExamClosed: false
      }))
      .catch(err => {
        console.error("Error loading mock data to Firestore:", err);
      });
  };

  const handleUpdateSystemSettings = (newSettings: SystemSettings) => {
    syncUpdateSettings(isScoresPublic, newSettings).catch(err => {
      console.error("Error updating system settings:", err);
    });
  };

  // Exam Grading Engine on submit
  const handleSubmitExam = (zaloName: string, email: string, responses: CandidateResponse[]) => {
    if (systemSettings.isExamClosed) {
      alert('Đề thi đã đóng. Bạn không thể nộp bài vào lúc này!');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (submissions.some(sub => sub.email === cleanEmail)) {
      alert('Lỗi: Email này đã thực hiện bài thi từ trước. Mỗi thí sinh chỉ được phép tham gia 1 lần!');
      return;
    }

    let totalScore = 0;
    const finalBreakdown: ScoreQuestionBreakdown[] = [];

    questions.forEach(q => {
      const resp = responses.find(r => r.questionId === q.id);
      const scoreBreakdown = calculateQuestionScore(q, resp);
      
      totalScore += scoreBreakdown.pointsEarned;
      finalBreakdown.push(scoreBreakdown);
    });

    const newSubmission: CandidateSubmission = {
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      zaloName: zaloName.trim(),
      submittedAt: new Date().toISOString(),
      score: Number(totalScore.toFixed(2)),
      breakdown: finalBreakdown
    };

    syncAddSubmission(newSubmission).catch(err => {
      console.error("Error recording submission:", err);
    });
  };

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Ambient glassmorphic glowing circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-500/[0.08] blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-indigo-500/[0.09] blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-teal-500/[0.05] blur-[110px]" />
      </div>

      {/* Dynamic Header / Navigation */}
      <header className="border-b border-white/[0.06] bg-[#070c17]/60 backdrop-blur-xl sticky top-0 z-40 relative">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5.5 h-5.5 text-slate-100" />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-white block">Exam Practicewise</span>
              <span className="text-[10px] font-mono text-slate-400 block tracking-wider uppercase">Thử nghiệm &amp; Khảo sát</span>
            </div>
          </div>

          {/* Nav Tab Buttons */}
          <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/[0.07] backdrop-blur-md">
            <button
              id="nav-tab-candidate"
              onClick={() => setActiveTab('candidate')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === 'candidate'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Làm đề thi (Candidate)
            </button>
            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-slate-100 font-bold shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Quản trị (Admin)
            </button>
          </div>

         </div>
      </header>

      {/* Main Container Slot */}
      <main className="flex-grow relative z-10">
        {activeTab === 'candidate' ? (
          <CandidateSection 
            questions={questions}
            isScoresPublic={isScoresPublic}
            onSubmitExam={handleSubmitExam}
            submissions={submissions}
            systemSettings={systemSettings}
          />
        ) : (
          <AdminSection 
            questions={questions}
            submissions={submissions}
            isScoresPublic={isScoresPublic}
            onAddQuestion={handleAddQuestion}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onToggleScoresPublic={handleToggleScoresPublic}
            onClearSubmissions={handleClearSubmissions}
            onClearQuestions={handleClearQuestions}
            onLoadMockData={handleLoadMockData}
            systemSettings={systemSettings}
            onUpdateSystemSettings={handleUpdateSystemSettings}
          />
        )}
      </main>

      {/* Sticky Bottom Credit Footer */}
      <footer className="py-6 border-t border-white/[0.05] bg-[#070c17]/60 backdrop-blur-md text-center relative z-10">
        <p className="text-[11px] text-slate-500 font-mono tracking-wide">
          © 2026 Exam Practice System • Designed with React 19, Vite, and Tailwind CSS. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
