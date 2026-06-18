/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Trophy, 
  Trash2, 
  Plus, 
  Edit3, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp,
  Award, 
  FileText,
  Percent,
  TrendingUp,
  Check,
  X,
  PlusCircle,
  HelpCircle,
  Calendar,
  LogOut,
  Database,
  RefreshCw,
  Settings,
  Link as LinkIcon,
  Clock
} from 'lucide-react';
import { Question, QuestionType, CandidateSubmission, QuestionMultipleChoice, QuestionTrueFalseMatrix, QuestionShortAnswer, SystemSettings } from '../types';
import { formatDate } from '../utils';

interface AdminSectionProps {
  questions: Question[];
  submissions: CandidateSubmission[];
  isScoresPublic: boolean;
  onAddQuestion: (q: Question) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onToggleScoresPublic: (val: boolean) => void;
  onClearSubmissions: () => void;
  onClearQuestions: () => void;
  onLoadMockData: () => void;
  systemSettings: SystemSettings;
  onUpdateSystemSettings: (s: SystemSettings) => void;
}

export default function AdminSection({
  questions,
  submissions,
  isScoresPublic,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onToggleScoresPublic,
  onClearSubmissions,
  onClearQuestions,
  onLoadMockData,
  systemSettings,
  onUpdateSystemSettings
}: AdminSectionProps) {
  // Security
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

  // Editing states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states for adding/editing questions
  const [formType, setFormType] = useState<QuestionType>(QuestionType.MultipleChoice);
  const [formText, setFormText] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  
  // Type 1 states
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formOptionsImages, setFormOptionsImages] = useState<string[]>(['', '', '', '']);
  const [formCorrectAnswerMC, setFormCorrectAnswerMC] = useState('A');
  const [formWeightMC, setFormWeightMC] = useState(1.0);

  // Type 2 states
  const [formStatements, setFormStatements] = useState<string[]>(['', '', '', '']);
  const [formStatementsImages, setFormStatementsImages] = useState<string[]>(['', '', '', '']);
  const [formCorrectAnswersTF, setFormCorrectAnswersTF] = useState<boolean[]>([true, true, true, true]);

  // Type 3 states
  const [formCorrectAnswerShort, setFormCorrectAnswerShort] = useState('');
  const [formWeightShort, setFormWeightShort] = useState(1.0);

  // Expanded tables rows
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // System Configurations States
  const [durationInput, setDurationInput] = useState<number | string>(systemSettings.examDurationMinutes);
  const [imageUrlInput, setImageUrlInput] = useState(systemSettings.communityImageUrl || '');
  const [linkInput, setLinkInput] = useState(systemSettings.communityLink || '');
  const [isClosedInput, setIsClosedInput] = useState(systemSettings.isExamClosed);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'info'
  });

  const triggerConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' = 'info'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  useEffect(() => {
    setDurationInput(systemSettings.examDurationMinutes);
    setImageUrlInput(systemSettings.communityImageUrl || '');
    setLinkInput(systemSettings.communityLink || '');
    setIsClosedInput(systemSettings.isExamClosed);
  }, [systemSettings]);

  const handleSaveSettings = () => {
    onUpdateSystemSettings({
      examDurationMinutes: Number(durationInput) || 30,
      communityImageUrl: imageUrlInput.trim(),
      communityLink: linkInput.trim(),
      isExamClosed: isClosedInput
    });
    showToast('Đã cập nhật cấu hình đề thi & cộng đồng thành công!', 'success');
  };

  // Lock code check
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2512') {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Mật mã PIN chưa đúng! Vui lòng thử lại.');
    }
  };

  // Open modal for new question
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormType(QuestionType.MultipleChoice);
    setFormText('');
    setFormImageUrl('');
    setFormOptions(['', '', '', '']);
    setFormOptionsImages(['', '', '', '']);
    setFormCorrectAnswerMC('A');
    setFormWeightMC(1.0);
    setFormStatements(['', '', '', '']);
    setFormStatementsImages(['', '', '', '']);
    setFormCorrectAnswersTF([true, true, true, true]);
    setFormCorrectAnswerShort('');
    setFormWeightShort(1.0);
    setShowQuestionModal(true);
  };

  // Open modal to edit question
  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormType(q.type);
    setFormText(q.text);
    setFormImageUrl(q.imageUrl || '');

    if (q.type === QuestionType.MultipleChoice) {
      setFormOptions([...q.options]);
      setFormOptionsImages(q.optionsImages ? [...q.optionsImages] : ['', '', '', '']);
      setFormCorrectAnswerMC(q.correctAnswer);
      setFormWeightMC(q.weight);
    } else if (q.type === QuestionType.TrueFalseMatrix) {
      setFormStatements([...q.statements]);
      setFormStatementsImages(q.statementsImages ? [...q.statementsImages] : ['', '', '', '']);
      setFormCorrectAnswersTF([...q.correctAnswers]);
    } else if (q.type === QuestionType.ShortAnswer) {
      setFormCorrectAnswerShort(q.correctAnswer);
      setFormWeightShort(q.weight);
    }
    setShowQuestionModal(true);
  };

  // Save question handler
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formText.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    const questionCommon = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      text: formText,
      imageUrl: formImageUrl.trim() ? formImageUrl.trim() : undefined,
    };

    if (formType === QuestionType.MultipleChoice) {
      if (formOptions.some(opt => !opt.trim())) {
        alert('Vui lòng điền đầy đủ cả 4 lựa chọn A, B, C, D.');
        return;
      }
      if (formWeightMC <= 0) {
        alert('Điểm chuẩn câu hỏi trắc nghiệm phải lớn hơn 0.');
        return;
      }

      const mcQuestion: QuestionMultipleChoice = {
        ...questionCommon,
        type: QuestionType.MultipleChoice,
        options: [...formOptions],
        optionsImages: [...formOptionsImages],
        correctAnswer: formCorrectAnswerMC as 'A' | 'B' | 'C' | 'D',
        weight: Number(formWeightMC)
      };

      if (editingQuestion) {
        onEditQuestion(mcQuestion);
      } else {
        onAddQuestion(mcQuestion);
      }
    } else if (formType === QuestionType.TrueFalseMatrix) {
      if (formStatements.some(st => !st.trim())) {
        alert('Vui lòng điền đầy đủ nội dung cho cả 4 nhận định nhỏ.');
        return;
      }

      const tfQuestion: QuestionTrueFalseMatrix = {
        ...questionCommon,
        type: QuestionType.TrueFalseMatrix,
        statements: [...formStatements],
        statementsImages: [...formStatementsImages],
        correctAnswers: [...formCorrectAnswersTF]
      };

      if (editingQuestion) {
        onEditQuestion(tfQuestion);
      } else {
        onAddQuestion(tfQuestion);
      }
    } else if (formType === QuestionType.ShortAnswer) {
      if (!formCorrectAnswerShort.trim()) {
        alert('Vui lòng nhập đáp án chính xác cho câu trả lời ngắn.');
        return;
      }
      if (formWeightShort <= 0) {
        alert('Điểm chuẩn cho câu hỏi ngắn phải lớn hơn 0.');
        return;
      }

      const saQuestion: QuestionShortAnswer = {
        ...questionCommon,
        type: QuestionType.ShortAnswer,
        correctAnswer: formCorrectAnswerShort.trim(),
        weight: Number(formWeightShort)
      };

      if (editingQuestion) {
        onEditQuestion(saQuestion);
      } else {
        onAddQuestion(saQuestion);
      }
    }

    setShowQuestionModal(false);
  };

  // Calculate stats
  const totalCompleted = submissions.length;
  const submissionsSum = submissions.reduce((sum, s) => sum + s.score, 0);
  const averageScore = totalCompleted > 0 ? (submissionsSum / totalCompleted) : 0;
  const highestScore = totalCompleted > 0 ? Math.max(...submissions.map(s => s.score)) : 0;

  // Sorting submissions based on Leaderboard Rank Logic:
  // Sort candidate automatically by Total Score desc, tie-breaker: candidate who submitted earlier (asc submittedAt) ranks higher.
  const rankingLeaderboard = [...submissions].sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.0001) {
      return b.score - a.score;
    }
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        
        {/* SHIELD GATE: Enter "2512" */}
        {!isUnlocked ? (
          <motion.div 
            key="lock-gate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-3xl space-y-6 hover:border-white/[0.15] transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-500/[0.08] border-2 border-indigo-500/20 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Bảo mật Hệ thống Admin</h2>
              <p className="text-slate-400 text-xs mt-1.5 px-4 leading-relaxed">
                Vui lòng nhập mã bảo mật PIN để truy cập giao diện quản trị đề thi và bảng kiểm định điểm số.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input 
                  id="admin-pin-input"
                  type="password"
                  placeholder="Nhập 4 chữ số PIN..."
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    if (pinError) setPinError('');
                  }}
                  className="w-full text-center tracking-[1em] text-lg bg-[#030712]/50 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-indigo-200 font-mono py-3 rounded-xl focus:outline-none placeholder:text-slate-600 transition-all placeholder:tracking-normal"
                />
                {pinError && (
                  <p className="text-rose-400 text-xs text-center mt-2.5 flex items-center justify-center gap-1.5 font-mono">
                    <AlertTriangle className="w-4 h-4" />
                    {pinError}
                  </p>
                )}
              </div>

              <button 
                id="btn-admin-login"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold text-white py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm shadow-lg shadow-indigo-600/20"
              >
                Kích hoạt quyền Admin
              </button>
            </form>
          </motion.div>
        ) : (
          
          /* FULL ADMIN SUITE PANEL */
          <motion.div 
            key="admin-suite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Admin Controls Header */}
            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:border-white/[0.15]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                  <span className="text-xs uppercase tracking-wider font-mono font-bold text-indigo-400">Admin Mode Verified</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1.5">
                  Bảng Điều Hành Hệ Thống Luyện Thi
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Soạn thảo câu lý thuyết dạng đại học và quản lý chi tiết kết quả nộp bài của ứng viên.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Exam lock/unlock toggle */}
                <div className="flex items-center gap-3 bg-white/[0.02] px-4 py-2.5 rounded-xl border border-white/[0.08]">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Trạng thái Đề thi (Exam Lock)</span>
                    <span className={`text-xs font-bold font-mono ${systemSettings.isExamClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {systemSettings.isExamClosed ? 'Đã đóng (CLOSED)' : 'Đang mở (ACTIVE)'}
                    </span>
                  </div>
                  <button 
                    id="btn-toggle-exam-status-header"
                    onClick={() => {
                      const updatedValue = !systemSettings.isExamClosed;
                      onUpdateSystemSettings({
                        ...systemSettings,
                        isExamClosed: updatedValue
                      });
                      setIsClosedInput(updatedValue);
                      showToast(updatedValue ? 'Đã khóa/đóng đề thi hoàn toàn!' : 'Đã mở đề thi thành công!', 'success');
                    }}
                    className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${
                      systemSettings.isExamClosed 
                        ? 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/[0.08] hover:bg-rose-500/[0.15] text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {systemSettings.isExamClosed ? 'Mở đề thi' : 'Đóng đề thi'}
                  </button>
                </div>

                {/* Score release status indicator */}
                <div className="flex items-center gap-3 bg-white/[0.02] px-4 py-2.5 rounded-xl border border-white/[0.08]">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Công bố điểm thi (Public Scores)</span>
                    <span className={`text-xs font-bold font-mono ${isScoresPublic ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isScoresPublic ? 'Đang kích hoạt (ON)' : 'Tắt hiển thị (OFF)'}
                    </span>
                  </div>
                  <button 
                    id="btn-toggle-publish"
                    onClick={() => onToggleScoresPublic(!isScoresPublic)}
                    className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${
                      isScoresPublic 
                        ? 'bg-rose-500/[0.08] hover:bg-rose-500/[0.15] text-rose-400 border border-rose-500/20' 
                        : 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isScoresPublic ? 'Ẩn điểm số' : 'Mở điểm thi'}
                  </button>
                </div>

                <button 
                  id="btn-admin-logout"
                  onClick={() => setIsUnlocked(false)}
                  className="bg-white/[0.02] hover:bg-rose-950/20 hover:text-rose-400 border border-white/10 text-slate-400 p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dashboard Statistics Widget cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-2 hover:bg-white/[0.05] transition-all duration-300">
                <span className="text-[11px] text-slate-400 font-mono tracking-wide block uppercase">Tổng thí sinh (Candidates)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-white">{totalCompleted}</span>
                  <span className="text-xs text-slate-500">bài nộp</span>
                </div>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-2 hover:bg-white/[0.05] transition-all duration-300">
                <span className="text-[11px] text-slate-400 font-mono tracking-wide block uppercase">Điểm trung bình (Avg)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">{averageScore.toFixed(2)}</span>
                  <span className="text-xs text-slate-500">điểm</span>
                </div>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-2 hover:bg-white/[0.05] transition-all duration-300">
                <span className="text-[11px] text-slate-400 font-mono tracking-wide block uppercase">Điểm cao nhất (Max)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-indigo-400">{highestScore.toFixed(2)}</span>
                  <span className="text-xs text-slate-500">điểm</span>
                </div>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-2 hover:bg-white/[0.05] transition-all duration-300">
                <span className="text-[11px] text-slate-400 font-mono tracking-wide block uppercase">Số lượng câu (Questions)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-white">{questions.length}</span>
                  <span className="text-xs text-slate-500">câu lý thuyết</span>
                </div>
              </div>
            </div>

            {/* SYSTEM CONFIGURATION: EXAM TIME, STATUS & COMMUNITY */}
            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-3xl space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
                <Settings className="text-emerald-400 w-5 h-5" />
                <div>
                  <h3 className="font-bold text-white text-sm">Cài Đặt Đề Thi &amp; Liên Kết Cộng Đồng</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cấu hình thời gian làm bài, trạng thái đóng mở đề thi và thông tin nhóm giao lưu cộng đồng cho thí sinh.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Duration & Status Lock */}
                <div className="space-y-4">
                  <div className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl space-y-3.5">
                    <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">Trạng thái &amp; Thời gian thi</span>
                    
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Thời gian làm bài thi (Phút):
                      </label>
                      <input 
                        type="number"
                        step="any"
                        min="0.0001"
                        value={durationInput}
                        onChange={(e) => setDurationInput(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full max-w-xs bg-[#030712]/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 text-xs transition-all"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Lưu ý: Tùy chỉnh số phút tùy ý (không giới hạn, ví dụ: 0.25, 30, 120,...).</p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.05]">
                      <span className="block text-slate-300 text-xs font-medium mb-2">Trạng thái đề thi:</span>
                      <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                        <span className="relative">
                          <input 
                            type="checkbox"
                            checked={isClosedInput}
                            onChange={(e) => setIsClosedInput(e.target.checked)}
                            className="sr-only peer"
                          />
                          <span className="block w-11 h-6 bg-slate-800 rounded-full border border-white/10 peer-checked:bg-rose-600/50 transition-all"></span>
                          <span className="absolute left-1 top-1 bg-slate-400 peer-checked:bg-rose-400 peer-checked:translate-x-full block w-4 h-4 rounded-full transition-all"></span>
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {isClosedInput ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                              ĐÃ ĐÓNG ĐỀ THI (Locked)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                              ĐANG CHIÊU SINH &amp; MỞ THI (Active)
                            </span>
                          )}
                        </span>
                      </label>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                        * Khi đóng đề thi, thí sinh không thể truy cập làm đề mới, đồng thời dữ liệu bảng xếp hạng được đóng băng, giữ nguyên không thay đổi nữa.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Community pic and Link */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl space-y-3.5">
                  <span className="text-xs text-sky-400 font-bold block uppercase tracking-wider">Thông tin Nhóm Cộng đồng (Optional)</span>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1.5 flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        URL Hình ảnh trực tiếp / Banner:
                      </label>
                      <input 
                        type="url"
                        placeholder="https://i.postimg.cc/TPqZ0YDC/z7933678389046-9cdb76a7f3fb003d31e5f668d3e47332.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="w-full bg-[#030712]/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 text-xs transition-all"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        * Nhập link ảnh trực tiếp (Direct Link) từ nơi lưu trữ ngoài (như postimg, imgur, kết thúc bằng file .jpg, .png).
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1.5 flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                        Đường dẫn Group / Cộng đồng:
                      </label>
                      <input 
                        type="text"
                        placeholder="https://zalo.me/g/group_id_here"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        className="w-full bg-[#030712]/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 text-xs transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save settings action button */}
              <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  id="btn-save-system-settings"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-600 hover:to-teal-600 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25"
                >
                  <CheckCircle className="w-4 h-4 text-slate-950 font-bold" />
                  Lưu thiết lập Hệ thống
                </button>
              </div>
            </div>

            {/* DATABASE ADMINISTRATION ACTIONS PANEL */}
            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-3xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
                <Database className="text-indigo-400 w-5 h-5" />
                <div>
                  <h3 className="font-bold text-white text-sm">Quản trị Cơ sở dữ liệu Hệ thống</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Xóa sạch toàn bộ ngân hàng câu hỏi, dọn dẹp lịch sử bài làm của thí sinh hoặc khôi phục dữ liệu mẫu thử nghiệm.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 col-span-3">
                {/* 1. Clear submissions */}
                <button
                  type="button"
                  id="btn-clear-submissions-new"
                  onClick={() => {
                    triggerConfirm(
                      'Xác nhận xóa rỗng toàn bộ lịch sử bài làm?',
                      'Hành động này sẽ xóa sạch TOÀN BỘ lịch sử bài làm của thí sinh trên bảng xếp hạng và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?',
                      () => {
                        onClearSubmissions();
                        showToast('Đã xóa rỗng toàn bộ lịch sử bài làm đăng ký thi!', 'success');
                      },
                      'danger'
                    );
                  }}
                  className="px-4 py-3 bg-rose-500/[0.05] hover:bg-rose-500/[0.12] border border-rose-500/20 hover:border-rose-500/40 text-rose-300 rounded-2xl flex items-center gap-2.5 text-xs font-semibold select-none cursor-pointer transition-all duration-200 active:scale-95 text-left"
                >
                  <Trash2 className="w-4 h-4 text-rose-400 flex-shrink-0 font-bold" />
                  <div>
                    <span className="block font-bold">Xóa Lịch Sử Lượt Thi</span>
                    <span className="block text-[10px] text-rose-400/70 font-normal">Đang có {submissions.length} bài nộp</span>
                  </div>
                </button>

                {/* 2. Clear question bank */}
                <button
                  type="button"
                  id="btn-clear-questions"
                  onClick={() => {
                    triggerConfirm(
                      'CẢNH BÁO: Xóa sạch ngân hàng đề thi?',
                      'Hành động này sẽ xóa rỗng TOÀN BỘ câu hỏi thi trong hệ thống. Bạn sẽ phải tự soạn thảo danh sách câu hỏi mới. Bạn có chắc chắn muốn tiếp tục?',
                      () => {
                        onClearQuestions();
                        showToast('Đã xóa sạch toàn bộ ngân hàng đề thi hiện có!', 'success');
                      },
                      'danger'
                    );
                  }}
                  className="px-4 py-3 bg-amber-500/[0.05] hover:bg-amber-500/[0.12] border border-amber-500/20 hover:border-amber-500/40 text-amber-300 rounded-2xl flex items-center gap-2.5 text-xs font-semibold select-none cursor-pointer transition-all duration-200 active:scale-95 text-left"
                >
                  <Trash2 className="w-4 h-4 text-amber-400 flex-shrink-0 font-bold" />
                  <div>
                    <span className="block font-bold">Xóa Sạch Ngân Hàng Câu Hỏi</span>
                    <span className="block text-[10px] text-amber-400/70 font-normal">Đang có {questions.length} câu hỏi</span>
                  </div>
                </button>

                {/* 3. Load mock data */}
                <button
                  type="button"
                  id="btn-load-mock-data"
                  onClick={() => {
                    triggerConfirm(
                      'Nạp lại dữ liệu thiết lập mẫu?',
                      'Hành động này sẽ tải lại danh sách 5 câu hỏi lý thuyết tiêu chuẩn và dữ liệu kết quả thí sinh mẫu của hệ thống, ghi đè hoàn toàn dữ liệu hiện tại mục này. Bạn chắc chắn muốn khôi phục?',
                      () => {
                        onLoadMockData();
                        showToast('Đã tải và khôi phục dữ liệu mẫu thành công!', 'success');
                      },
                      'warning'
                    );
                  }}
                  className="px-4 py-3 bg-indigo-500/[0.05] hover:bg-indigo-500/[0.12] border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 rounded-2xl flex items-center gap-2.5 text-xs font-semibold select-none cursor-pointer transition-all duration-200 active:scale-95 text-left"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-400 flex-shrink-0 font-bold" />
                  <div>
                    <span className="block font-bold">Nạp Dữ Liệu Thiết Lập Mẫu</span>
                    <span className="block text-[10px] text-indigo-400/70 font-normal">Phục hồi lại 5 câu hỏi &amp; kết quả mẫu</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION: CANDIDATE ANALYTICS TABLE (LEADERBOARD) */}
            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-3xl overflow-hidden transition-all duration-300 hover:border-white/[0.15]">
              <div className="p-6 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Trophy className="text-amber-400 w-5 h-5" />
                  Bảng Xếp Hạng Kết Quả Thí Sinh (Leaderboard)
                </h2>

                {submissions.length > 0 && (
                  <button 
                    id="btn-clear-databases"
                    onClick={() => {
                      triggerConfirm(
                        'Xác nhận xóa rỗng lịch sử bài làm?',
                        'Toàn bộ kết quả điểm thi và xếp hạng của mọi thí sinh sẽ bị dọn dẹp sạch sẽ. Bạn có chắc chắn muốn xóa không?',
                        () => {
                          onClearSubmissions();
                          showToast('Đã dọn dẹp lịch sử nộp bài của mọi thí sinh!', 'success');
                        },
                        'danger'
                      );
                    }}
                    className="text-xs font-semibold bg-rose-500/[0.08] hover:bg-rose-500/[0.15] text-rose-400 border border-rose-500/25 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-1.5"
                  >
                    Xóa sạch dữ liệu thi
                  </button>
                )}
              </div>

              {rankingLeaderboard.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold">Chưa phát hiện thí sinh nộp bài thi nào.</p>
                  <p className="text-xs text-slate-600">Sử dụng candidate panel của học sinh để thử nộp bài thi.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300 divide-y divide-white/[0.05]">
                    <thead className="bg-white/[0.02] text-slate-400 text-xs font-mono uppercase">
                      <tr>
                        <th className="px-6 py-4 font-bold text-center w-16">Hạng</th>
                        <th className="px-6 py-4 font-bold">Thí sinh</th>
                        <th className="px-6 py-4 font-bold">Email đăng ký</th>
                        <th className="px-6 py-4 font-bold text-center">Tổng Điểm</th>
                        <th className="px-6 py-4 font-bold">Thời gian nộp</th>
                        <th className="px-6 py-4 font-bold text-center w-24">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] bg-transparent">
                      {rankingLeaderboard.map((sub, index) => {
                        const isExpanded = expandedSubmissionId === sub.id;
                        
                        // Badge coloring for first 3 positions
                        let rankBadge = 'text-slate-400';
                        if (index === 0) rankBadge = 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/20 font-bold';
                        else if (index === 1) rankBadge = 'bg-slate-100/[0.08] text-slate-100 border border-white/20 font-bold';
                        else if (index === 2) rankBadge = 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20 font-bold';

                        return (
                          <React.Fragment key={sub.id}>
                            <tr className={`hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-indigo-500/[0.03]' : ''}`}>
                              <td className="px-6 py-4 text-center">
                                {index < 3 ? (
                                  <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs border ${rankBadge}`}>
                                    {index + 1}
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-500 font-bold">{index + 1}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-bold text-white">
                                {sub.zaloName}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                {sub.email}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-mono font-bold text-[15px] text-emerald-400">
                                  {sub.score.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                {formatDate(sub.submittedAt)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  id={`btn-expand-${sub.id}`}
                                  onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                                  className="text-xs bg-white/[0.04] hover:bg-white/[0.08] transition-all border border-white/5 hover:border-white/10 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white"
                                >
                                  {isExpanded ? 'Ẩn' : 'Xem'}
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>

                            {/* Collapsible detailed answers row */}
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-white/[0.01] p-6 border-b border-white/[0.06]">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden space-y-4"
                                    >
                                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-slate-300">
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                          Chi tiết bài làm ứng viên: {sub.zaloName}
                                        </h4>
                                        <span className="text-[11px] text-slate-500 font-mono">ID: {sub.id}</span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sub.breakdown.map((item, bIdx) => {
                                          return (
                                            <div 
                                              key={item.questionId} 
                                              className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl space-y-2.5 text-xs"
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-200">
                                                  Câu {bIdx + 1}
                                                  <span className="ml-2 font-normal text-slate-500 font-mono">
                                                    ({item.type === QuestionType.MultipleChoice && 'Trắc nghiệm'}
                                                    {item.type === QuestionType.TrueFalseMatrix && 'Đúng/Sai Matrix'}
                                                    {item.type === QuestionType.ShortAnswer && 'Điền ngắn'})
                                                  </span>
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-lg border font-bold font-mono text-[10px] ${
                                                  item.pointsEarned > 0 
                                                    ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/25' 
                                                    : 'bg-rose-500/[0.08] text-rose-400 border-rose-500/25'
                                                }`}>
                                                  +{item.pointsEarned.toFixed(2)} / {item.maxPoints.toFixed(2)} đ
                                                </span>
                                              </div>

                                              <div className="bg-[#030712]/40 p-3 rounded-xl font-mono text-[11px] space-y-1.5 border border-white/[0.06]">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">Trả lời:</span>
                                                  <span className="text-slate-200 font-bold">{item.candidateAnswerDetail}</span>
                                                </div>
                                                <div className="flex justify-between border-t border-white/[0.06] pt-1.5">
                                                  <span className="text-slate-500">Đáp án:</span>
                                                  <span className="text-emerald-400 font-bold">{item.correctAnswerDetail}</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-3xl overflow-hidden transition-all duration-300 hover:border-white/[0.15]">
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <FileText className="text-indigo-400 w-5 h-5" />
                    Ngân Hàng Đề Thi Học Tập ({questions.length} câu)
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Thêm mới câu hỏi, chỉnh sửa trọng số và đáp án tức thì.</p>
                </div>

                <button
                  id="btn-add-question"
                  onClick={handleOpenAddModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Thêm câu hỏi
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-400">Hiện chưa có câu hỏi nào trong đề thi.</p>
                  <p className="text-xs text-slate-500">Bấm nút "Thêm câu hỏi" để thiết kế câu mới.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {questions.map((q, qK) => {
                    return (
                      <div key={q.id} className="p-6 hover:bg-white/[0.01] transition-all flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="bg-[#030712]/50 px-2.5 py-1 rounded-lg font-mono font-bold text-xs text-indigo-300 border border-white/[0.08]">
                              CÂU {qK + 1}
                            </span>
                            <span className="bg-white/[0.03] px-2.5 py-1 rounded-lg text-xs text-slate-300 font-semibold border border-white/10">
                              {q.type === QuestionType.MultipleChoice && 'Trắc nghiệm (MCQs)'}
                              {q.type === QuestionType.TrueFalseMatrix && 'Đúng/Sai Matrix'}
                              {q.type === QuestionType.ShortAnswer && 'Điền ngắn'}
                            </span>
                            <span className="text-xs font-mono text-slate-500 font-bold">
                              {q.type === QuestionType.TrueFalseMatrix ? 'Điểm chuẩn: 1.0 đ (lũy tiến)' : `Điểm chuẩn: ${(q as any).weight || 1.0} đ`}
                            </span>
                          </div>

                          <p className="text-slate-100 text-sm font-medium leading-relaxed font-sans whitespace-pre-wrap">{q.text}</p>
                          
                          {q.imageUrl && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Ảnh đi kèm: <a href={q.imageUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-block truncate max-w-xs">{q.imageUrl}</a></span>
                              </div>
                              <div className="max-w-md max-h-48 overflow-hidden rounded-xl bg-black/25 p-2 border border-white/5 flex justify-start">
                                <img
                                  src={q.imageUrl}
                                  alt="Ảnh minh họa câu hỏi"
                                  referrerPolicy="no-referrer"
                                  className="max-h-40 object-contain rounded"
                                />
                              </div>
                            </div>
                          )}

                          {/* Specific Question Data display */}
                          <div className="bg-[#030712]/40 p-4 rounded-2xl border border-white/[0.06] space-y-2 text-xs">
                            {q.type === QuestionType.MultipleChoice && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => {
                                  const letter = ['A', 'B', 'C', 'D'][oIdx];
                                  const isCorrect = letter === q.correctAnswer;
                                  const optImg = (q as any).optionsImages?.[oIdx];
                                  return (
                                    <div key={oIdx} className={`p-2 rounded-xl border flex flex-col gap-2 transition-all ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300 font-bold' : 'border-white/[0.04] text-slate-400 bg-white/[0.01]'}`}>
                                      <div className="flex justify-between gap-2 items-center w-full">
                                        <span className="font-mono font-semibold truncate">({letter}) {opt}</span>
                                        {isCorrect && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                      </div>
                                      {optImg && (
                                        <div className="mt-1 w-full max-h-32 overflow-hidden rounded-lg bg-black/20 flex justify-center p-1.5 border border-white/5">
                                          <img src={optImg} alt={`Option ${letter}`} referrerPolicy="no-referrer" className="max-h-24 object-contain rounded" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === QuestionType.TrueFalseMatrix && (
                              <div className="space-y-2">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Các đáp án Đúng / Sai tương ứng từng nhận định:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.statements.map((st, sIdx) => {
                                    const answer = q.correctAnswers[sIdx];
                                    const stImg = (q as any).statementsImages?.[sIdx];
                                    return (
                                      <div key={sIdx} className="p-2.5 rounded-xl border border-white/[0.04] text-slate-300 bg-white/[0.01] flex flex-col gap-2">
                                        <div className="flex justify-between gap-2 items-center w-full">
                                          <span className="truncate text-slate-400">({String.fromCharCode(97 + sIdx)}) {st}</span>
                                          <span className={`px-2 py-0.5 rounded-lg border font-mono font-bold text-[10px] ${answer ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-rose-500/[0.06] text-rose-400 border-rose-500/20'}`}>
                                            {answer ? 'ĐÚNG' : 'SAI'}
                                          </span>
                                        </div>
                                        {stImg && (
                                          <div className="mt-1 w-full max-h-32 overflow-hidden rounded-lg bg-black/20 flex justify-center p-1.5 border border-white/5">
                                            <img src={stImg} alt={`Statement ${String.fromCharCode(97 + sIdx)}`} referrerPolicy="no-referrer" className="max-h-24 object-contain rounded" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {q.type === QuestionType.ShortAnswer && (
                              <div className="flex items-center justify-between text-slate-300 p-2.5 border border-white/[0.06] rounded-xl bg-indigo-500/[0.03]">
                                <span>Đáp án chính xác:</span>
                                <span className="font-mono font-bold text-indigo-300 text-sm">{q.correctAnswer}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Modifying/Deleting row utility functions */}
                        <div className="flex items-center gap-2 self-end md:self-start">
                          <button
                            id={`btn-edit-q-${q.id}`}
                            onClick={() => handleOpenEditModal(q)}
                            className="bg-[#030712]/50 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 p-2.5 rounded-xl cursor-pointer transition-all inline-block shadow-md"
                            title="Sửa câu hỏi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-q-${q.id}`}
                            onClick={() => {
                              triggerConfirm(
                                'Xác nhận xóa câu hỏi?',
                                'Bạn có chắc chắn muốn xóa câu hỏi này khỏi danh sách ngân hàng đề thi không? Hành động này không thể hoàn tác.',
                                () => {
                                  onDeleteQuestion(q.id);
                                  showToast('Đã xóa câu hỏi thành công!', 'success');
                                },
                                'danger'
                              );
                            }}
                            className="bg-[#030712]/50 hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/20 text-rose-400 p-2.5 rounded-xl cursor-pointer transition-all inline-block shadow-md animate-hover"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* QUESTION MODAL FOR ADDING / EDITING */}
      <AnimatePresence>
        {showQuestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuestionModal(false)}
              className="absolute inset-0 bg-[#030712]/70 backdrop-blur-xl"
            />
            {/* Modal content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-[#0b0f19]/90 backdrop-blur-2xl border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-3xl z-10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="text-indigo-400 w-5 h-5" />
                  {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
                </h3>
                <button 
                  id="btn-close-modal"
                  onClick={() => setShowQuestionModal(false)}
                  className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-5">
                
                {/* Select Type (Locked if editing to prevent type collision bugs) */}
                <div>
                  <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-2">Định dạng câu hỏi (Question Type)</label>
                  {editingQuestion ? (
                    <div className="bg-[#030712]/50 p-3.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold">
                      Loại câu hỏi: {formType === QuestionType.MultipleChoice ? 'Trắc nghiệm trắc chọn' : formType === QuestionType.TrueFalseMatrix ? 'Đúng/Sai Matrix' : 'Trả lời viết ngắn'} 
                      <span className="text-slate-600 ml-1.5">(Không thể đổi định dạng khi chỉnh sửa)</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        id="btn-select-mc"
                        onClick={() => setFormType(QuestionType.MultipleChoice)}
                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer text-center ${
                          formType === QuestionType.MultipleChoice 
                            ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 font-bold active:scale-95 shadow-md shadow-indigo-600/10' 
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-slate-400 hover:text-indigo-200'
                        }`}
                      >
                        Trắc chọn (A,B,C,D)
                      </button>
                      <button
                        type="button"
                        id="btn-select-tf"
                        onClick={() => setFormType(QuestionType.TrueFalseMatrix)}
                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer text-center ${
                          formType === QuestionType.TrueFalseMatrix 
                            ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 font-bold active:scale-95 shadow-md shadow-indigo-600/10' 
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-slate-400 hover:text-indigo-200'
                        }`}
                      >
                        Đúng / Sai Matrix
                      </button>
                      <button
                        type="button"
                        id="btn-select-sa"
                        onClick={() => setFormType(QuestionType.ShortAnswer)}
                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer text-center ${
                          formType === QuestionType.ShortAnswer 
                            ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 font-bold active:scale-95 shadow-md shadow-indigo-600/10' 
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-slate-400 hover:text-indigo-200'
                        }`}
                      >
                        Trả lời ngắn
                      </button>
                    </div>
                  )}
                </div>
                {/* Common Fields: Question Content */}
                <div>
                  <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-2">Nội dung câu hỏi <span className="text-rose-500">*</span></label>
                  <textarea
                    id="input-q-text"
                    required
                    placeholder="Mô tả nội dung vấn đề đề bài cần hiển thị..."
                    rows={3}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                  />
                </div>

                {/* Common Fields: Image URL Optional */}
                <div>
                  <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Liên kết hình ảnh minh họa (Image URL)</span>
                    <span className="text-[10px] text-indigo-400 font-normal">Chỉ nhận link ảnh trực tiếp (vd: .jpg, .png)</span>
                  </label>
                  <input
                    id="input-q-image"
                    type="url"
                    placeholder="https://i.postimg.cc/TPqZ0YDC/z7933678389046-9cdb76a7f3fb003d31e5f668d3e47332.jpg"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                  />
                  {formImageUrl.trim() && (
                    <div className="mt-2 w-full max-h-48 overflow-hidden rounded-xl bg-black/25 p-2 border border-white/5 flex justify-center">
                      <img 
                        src={formImageUrl.trim()} 
                        alt="Xem trước ảnh minh họa" 
                        referrerPolicy="no-referrer" 
                        className="max-h-40 object-contain rounded"
                        onError={(e) => {
                          // Handle broken links gracefully or show placeholder/don't break
                        }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    * Lưu ý: Hãy lấy "Link trực tiếp" (Direct Link) từ dịch vụ lưu trữ ảnh (như PostImage, Imgur) để ảnh hiển thị chính xác.
                  </p>
                </div>

                {/* CONDITIONAL SUB-FORM: MULTIPLE CHOICE */}
                {formType === QuestionType.MultipleChoice && (
                  <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Đề xuất phương án &amp; trọng số điểm</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formOptions.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx];
                        const optImg = formOptionsImages?.[idx];
                        return (
                          <div key={idx} className="p-3 bg-white/[0.01] rounded-2xl border border-white/5 space-y-2">
                            <label className="block text-slate-400 text-[10px] font-mono tracking-wider uppercase">CÂU LỰA CHỌN {letter} <span className="text-slate-500">*</span></label>
                            <input
                              id={`input-opt-${letter}`}
                              type="text"
                              required
                              placeholder={`Nội dung lựa chọn ${letter}...`}
                              value={opt}
                              onChange={(e) => {
                                const nextOpt = [...formOptions];
                                nextOpt[idx] = e.target.value;
                                setFormOptions(nextOpt);
                              }}
                              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                            />
                            <input
                              id={`input-opt-img-${letter}`}
                              type="url"
                              placeholder={`Link ảnh phương án ${letter} (Tùy chọn)...`}
                              value={optImg || ''}
                              onChange={(e) => {
                                const nextOptImg = [...formOptionsImages];
                                nextOptImg[idx] = e.target.value;
                                setFormOptionsImages(nextOptImg);
                              }}
                              className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-3 py-1.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[10px] transition-all duration-200"
                            />
                            {optImg && optImg.trim() && (
                              <div className="mt-1.5 w-full max-h-32 overflow-hidden rounded-lg bg-black/20 flex justify-center p-1 border border-white/5">
                                <img 
                                  src={optImg.trim()} 
                                  alt={`Xem trước ảnh phương án ${letter}`} 
                                  referrerPolicy="no-referrer" 
                                  className="max-h-24 object-contain rounded"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-[10px] font-mono tracking-wider uppercase mb-2">Đáp án đúng chính xác</label>
                        <select
                          id="select-correct-mc"
                          value={formCorrectAnswerMC}
                          onChange={(e) => setFormCorrectAnswerMC(e.target.value)}
                          className="w-full bg-[#0d1220] border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200 cursor-pointer"
                        >
                          <option value="A">Lựa chọn A</option>
                          <option value="B">Lựa chọn B</option>
                          <option value="C">Lựa chọn C</option>
                          <option value="D">Lựa chọn D</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[10px] font-mono tracking-wider uppercase mb-2">Điểm chuẩn (Weight)</label>
                        <input
                          id="input-weight-mc"
                          type="number"
                          required
                          min={0.0001}
                          step="any"
                          value={formWeightMC}
                          onChange={(e) => setFormWeightMC(Number(e.target.value))}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CONDITIONAL SUB-FORM: TRUE/FALSE MATRIX */}
                {formType === QuestionType.TrueFalseMatrix && (
                  <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Thiết lập 4 nhận định Đúng/Sai</h4>
                      <span className="text-[10px] text-slate-300 bg-[#030712]/50 px-2.5 py-1 rounded-lg border border-white/10">Điểm tối đa: 1.0 (Phân phối lũy tiến)</span>
                    </div>

                    <div className="space-y-3">
                      {formStatements.map((st, idx) => {
                        const letter = String.fromCharCode(97 + idx);
                        const isTrue = formCorrectAnswersTF[idx];
                        const statementImg = formStatementsImages?.[idx];
                        
                        return (
                          <div key={idx} className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:bg-white/[0.04]">
                            <div className="flex-1 space-y-2">
                              <label className="block text-slate-400 text-[10px] font-mono tracking-wider uppercase">Nhận định ({letter}) <span className="text-rose-500">*</span></label>
                              <input
                                id={`input-tf-statement-${idx}`}
                                type="text"
                                required
                                placeholder={`Nội dung nhận định nhỏ ${letter}...`}
                                value={st}
                                onChange={(e) => {
                                  const nextSt = [...formStatements];
                                  nextSt[idx] = e.target.value;
                                  setFormStatements(nextSt);
                                }}
                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                              />
                              <input
                                id={`input-tf-statement-img-${idx}`}
                                type="url"
                                placeholder={`Link ảnh nhận định ${letter} (Tùy chọn)...`}
                                value={statementImg || ''}
                                onChange={(e) => {
                                  const nextStImg = [...formStatementsImages];
                                  nextStImg[idx] = e.target.value;
                                  setFormStatementsImages(nextStImg);
                                }}
                                className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-3 py-1.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[10px] transition-all duration-200"
                              />
                              {statementImg && statementImg.trim() && (
                                <div className="mt-1.5 w-full max-h-32 overflow-hidden rounded-lg bg-black/20 flex justify-start p-1 border border-white/5">
                                  <img 
                                    src={statementImg.trim()} 
                                    alt={`Xem trước ảnh nhận định ${letter}`} 
                                    referrerPolicy="no-referrer" 
                                    className="max-h-24 object-contain rounded"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-start sm:mt-5">
                              <button
                                type="button"
                                id={`btn-tf-correct-${idx}-true`}
                                onClick={() => {
                                  const nextTF = [...formCorrectAnswersTF];
                                  nextTF[idx] = true;
                                  setFormCorrectAnswersTF(nextTF);
                                }}
                                className={`px-3 py-2 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                                  isTrue === true 
                                    ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300 font-bold shadow-sm shadow-emerald-500/5' 
                                    : 'bg-white/[0.02] border-white/10 text-slate-500 hover:text-slate-400 hover:bg-white/[0.05]'
                                }`}
                              >
                                Đúng (T)
                              </button>
                              <button
                                type="button"
                                id={`btn-tf-correct-${idx}-false`}
                                onClick={() => {
                                  const nextTF = [...formCorrectAnswersTF];
                                  nextTF[idx] = false;
                                  setFormCorrectAnswersTF(nextTF);
                                }}
                                className={`px-3 py-2 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                                  isTrue === false 
                                    ? 'bg-rose-500/[0.08] border-rose-500/30 text-rose-300 font-bold shadow-sm shadow-rose-500/5' 
                                    : 'bg-white/[0.02] border-white/10 text-slate-500 hover:text-slate-400 hover:bg-white/[0.05]'
                                }`}
                              >
                                Sai (F)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CONDITIONAL SUB-FORM: SHORT ANSWER */}
                {formType === QuestionType.ShortAnswer && (
                  <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Đáp án trị số / văn bản &amp; trọng số điểm</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-[10px] font-mono tracking-wider uppercase mb-2">Đáp án trị số chính xác <span className="text-rose-500">*</span></label>
                        <input
                          id="input-correct-sa"
                          type="text"
                          required
                          placeholder="Ví dụ: 44 , ha noi, 1.25..."
                          value={formCorrectAnswerShort}
                          onChange={(e) => setFormCorrectAnswerShort(e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[10px] font-mono tracking-wider uppercase mb-2">Điểm chuẩn (Weight)</label>
                        <input
                          id="input-weight-sa"
                          type="number"
                          required
                          min={0.0001}
                          step="any"
                          value={formWeightShort}
                          onChange={(e) => setFormWeightShort(Number(e.target.value))}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form submit footer */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.08] mt-6 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(false)}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    id="btn-save-modal"
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-slate-100 shadow-lg shadow-indigo-600/10 transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Lưu cấu hình câu hỏi
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM NOTIFICATION TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl ${
              toast.type === 'success'
                ? 'bg-[#064e3b]/90 border-emerald-500/30 text-emerald-100'
                : 'bg-[#991b1b]/90 border-rose-500/30 text-rose-100'
            } backdrop-blur-xl`}
          >
            {toast.type === 'success' ? (
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold">✕</span>
            )}
            <p className="text-xs font-semibold leading-relaxed font-sans">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-[#030712]/75 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative bg-[#0c1120]/95 backdrop-blur-3xl border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-3xl z-10 space-y-4 text-left"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                confirmModal.variant === 'danger' 
                  ? 'bg-rose-500/[0.08] border border-rose-500/20 text-rose-400' 
                  : confirmModal.variant === 'warning' 
                  ? 'bg-amber-500/[0.08] border border-amber-500/20 text-amber-400' 
                  : 'bg-indigo-500/[0.08] border border-indigo-500/20 text-indigo-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-sans">{confirmModal.title}</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">
                  {confirmModal.description}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  id="btn-confirm-cancel"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center"
                >
                  Hủy thao tác
                </button>
                <button
                  type="button"
                  id="btn-confirm-execute"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center shadow-md ${
                    confirmModal.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/10'
                      : confirmModal.variant === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/10'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/10'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
