/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  ChevronRight, 
  HelpCircle, 
  BookOpen, 
  Inbox, 
  Check, 
  X,
  RefreshCw,
  LogOut,
  Trophy,
  Award,
  Phone
} from 'lucide-react';
import { Question, QuestionType, CandidateResponse, CandidateSubmission, SystemSettings } from '../types';
import { calculateQuestionScore } from '../utils';

interface CandidateSectionProps {
  questions: Question[];
  isScoresPublic: boolean;
  onSubmitExam: (zaloName: string, email: string, phoneNumber: string, responses: CandidateResponse[]) => void;
  submissions: CandidateSubmission[];
  systemSettings: SystemSettings;
}

export default function CandidateSection({
  questions,
  isScoresPublic,
  onSubmitExam,
  submissions,
  systemSettings
}: CandidateSectionProps) {
  // Candidate info
  const [email, setEmail] = useState('');
  const [zaloName, setZaloName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [zaloError, setZaloError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // App phase state
  const [gameState, setGameState] = useState<'welcome' | 'exam' | 'submitted'>('welcome');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  
  // Responses state
  const [responses, setResponses] = useState<CandidateResponse[]>([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Score lookup states
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState<CandidateSubmission | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  // Initialize empty responses when questions load
  useEffect(() => {
    const initialResponses = questions.map(q => {
      if (q.type === QuestionType.MultipleChoice) {
        return { questionId: q.id, type: q.type, multipleChoiceAnswer: '' };
      } else if (q.type === QuestionType.TrueFalseMatrix) {
        return { 
          questionId: q.id, 
          type: q.type, 
          trueFalseAnswers: [null, null, null, null] // null means unanswered
        };
      } else {
        return { questionId: q.id, type: q.type, shortAnswerValue: '' };
      }
    });
    setResponses(initialResponses);
  }, [questions]);

  // Reset candidate's session/email and return to welcome phase when submissions are deleted/cleared by Admin
  useEffect(() => {
    if (submissions.length === 0) {
      setEmail('');
      setZaloName('');
      setPhoneNumber('');
      setEmailError('');
      setZaloError('');
      setPhoneError('');
      setLookupEmail('');
      setLookupResult(null);
      setLookupSearched(false);
      setGameState('welcome');
    }
  }, [submissions]);

  // Handle timer countdown
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            // Auto submit when time runs out
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeLeft]);

  // Convert seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validation
  const validateWelcomeForm = () => {
    let isValid = true;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Vui lòng nhập Email.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Định dạng Email không hợp lệ (Ví dụ: abc@gmail.com).');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Zalo Name validation
    if (!zaloName.trim()) {
      setZaloError('Vui lòng nhập Tên Zalo.');
      isValid = false;
    } else {
      setZaloError('');
    }

    // Phone Number validation
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    const cleanPhone = phoneNumber.replace(/[\s\.\-\(\)]/g, '');
    if (!phoneNumber.trim()) {
      setPhoneError('Vui lòng nhập Số điện thoại.');
      isValid = false;
    } else if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ (Ví dụ: 0912345678, gồm 10 chữ số).');
      isValid = false;
    } else {
      setPhoneError('');
    }

    return isValid;
  };

  const handleStartExam = () => {
    if (!validateWelcomeForm()) return;

    if (systemSettings.isExamClosed) {
      alert('Đề thi đã đóng. Thí sinh không thể tham gia dự thi lúc này!');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (submissions.some(sub => sub.email === cleanEmail)) {
      setEmailError('Lỗi: Email này đã tham gia thi rồi. Mỗi thí sinh chỉ được thi 1 lần duy nhất!');
      return;
    }

    if (questions.length === 0) {
      alert('Hiện chưa có câu hỏi nào trong hệ thống. Vui lòng liên hệ Admin!');
      return;
    }
    
    // Reset responses just in case
    const initialResponses = questions.map(q => {
      if (q.type === QuestionType.MultipleChoice) {
        return { questionId: q.id, type: q.type, multipleChoiceAnswer: '' };
      } else if (q.type === QuestionType.TrueFalseMatrix) {
        return { 
          questionId: q.id, 
          type: q.type, 
          trueFalseAnswers: [null, null, null, null] 
        };
      } else {
        return { questionId: q.id, type: q.type, shortAnswerValue: '' };
      }
    });

    setResponses(initialResponses);
    const durationMin = systemSettings.examDurationMinutes || 30;
    setTimeLeft(durationMin * 60); // setup duration from system settings
    setGameState('exam');
    setTimerActive(true);
    setActiveQuestionIndex(0);
  };

  // Check if a question is answered
  const isQuestionAnswered = (index: number) => {
    const resp = responses[index];
    if (!resp) return false;

    if (resp.type === QuestionType.MultipleChoice) {
      return !!resp.multipleChoiceAnswer;
    } else if (resp.type === QuestionType.TrueFalseMatrix) {
      // Considered answered if all sub-statements are filled (or at least one has been touched)
      // Let's count it as fully answered only if all 4 are selected
      return resp.trueFalseAnswers?.every(val => val !== null) ?? false;
    } else if (resp.type === QuestionType.ShortAnswer) {
      return !!resp.shortAnswerValue?.trim();
    }
    return false;
  };

  // Is at least partially answered
  const isQuestionPartiallyAnswered = (index: number) => {
    const resp = responses[index];
    if (!resp) return false;

    if (resp.type === QuestionType.MultipleChoice) {
      return !!resp.multipleChoiceAnswer;
    } else if (resp.type === QuestionType.TrueFalseMatrix) {
      return resp.trueFalseAnswers?.some(val => val !== null) ?? false;
    } else if (resp.type === QuestionType.ShortAnswer) {
      return !!resp.shortAnswerValue?.trim();
    }
    return false;
  };

  // Update responses
  const handleMultipleChoiceSelect = (questionId: string, answer: string) => {
    setResponses(prev => prev.map(r => 
      r.questionId === questionId 
        ? { ...r, multipleChoiceAnswer: answer } 
        : r
    ));
  };

  const handleTrueFalseSelect = (questionId: string, statementIndex: number, answer: boolean) => {
    setResponses(prev => prev.map(r => {
      if (r.questionId === questionId) {
        const currentAnswers = [...(r.trueFalseAnswers || [null, null, null, null])];
        currentAnswers[statementIndex] = answer;
        return { ...r, trueFalseAnswers: currentAnswers };
      }
      return r;
    }));
  };

  const handleShortAnswerChange = (questionId: string, value: string) => {
    setResponses(prev => prev.map(r => 
      r.questionId === questionId 
        ? { ...r, shortAnswerValue: value } 
        : r
    ));
  };

  // Submission handles
  const handleAutoSubmit = () => {
    setTimerActive(false);
    onSubmitExam(zaloName, email, phoneNumber, responses);
    setGameState('submitted');
  };

  const verifyAndSubmit = () => {
    setTimerActive(false);
    onSubmitExam(zaloName, email, phoneNumber, responses);
    setShowSubmitModal(false);
    setGameState('submitted');
  };

  // Score Lookup
  const handleLookupScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    const cleanEmail = lookupEmail.trim().toLowerCase();
    const found = submissions.find(s => s.email.toLowerCase() === cleanEmail);
    
    setLookupResult(found || null);
    setLookupSearched(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: WELCOME / LOGIN */}
        {gameState === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:items-stretch"
          >
            {/* Info and features panel */}
            <div className="lg:col-span-8 flex flex-col justify-between bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl text-slate-100 ReadyContainer transition-all duration-300 hover:border-white/[0.15]">
              <div>
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 font-medium text-xs tracking-wider uppercase inline-block mb-6">
                  Hệ thống Luyện thi Chất lượng cao
                </span>
                <h1 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-300 tracking-tight leading-tight mb-6">
                  Khảo Sát Năng Lực &amp; Ôn Luyện Đề Thi
                </h1>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 font-sans">
                  Chào mừng bạn đến với chuyên trang luyện thi trực tuyến được thiết kế theo tiêu chuẩn quốc gia. Hệ thống hỗ trợ đa dạng định dạng câu hỏi và cập nhật bảng điểm tự động thời gian thực.
                </p>

                {/* Question format explanation cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/[0.02] backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300 shadow-lg">
                    <span className="text-emerald-400 text-xs font-mono font-bold block mb-1">DẠNG 1</span>
                    <span className="text-slate-200 text-sm font-semibold block mb-1">Trắc Nghiệm MCQs</span>
                    <span className="text-slate-400 text-xs">Lựa chọn 1 đáp án đúng duy nhất từ 4 phương án đề xuất.</span>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-teal-500/20 hover:bg-white/[0.04] transition-all duration-300 shadow-lg">
                    <span className="text-teal-400 text-xs font-mono font-bold block mb-1">DẠNG 2</span>
                    <span className="text-slate-200 text-sm font-semibold block mb-1">Đúng / Sai Matrix</span>
                    <span className="text-slate-400 text-xs">Đánh giá 4 nhận định độc lập. Cách tính điểm chi tiết lũy tiến.</span>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-300 shadow-lg">
                    <span className="text-indigo-400 text-xs font-mono font-bold block mb-1">DẠNG 3</span>
                    <span className="text-slate-200 text-sm font-semibold block mb-1">Trả Lời Ngắn</span>
                    <span className="text-slate-400 text-xs">Tự viết đáp án chuẩn xác theo format kỳ thi đại học.</span>
                  </div>
                </div>

                {/* Score Lookup Section, moved to fill the empty space here */}
                {isScoresPublic ? (
                  <div className="bg-indigo-500/[0.04] border border-indigo-500/15 rounded-2xl p-5 shadow-lg space-y-3 mt-6 mb-6 text-left">
                    <h3 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" />
                      CỔNG TRA CỨU KẾT QUẢ THI CÔNG KHAI
                    </h3>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Ban tổ chức đã công bố điểm thi chính thức. Nhập email đăng ký của bạn để xem điểm chi tiết &amp; đáp án.
                    </p>

                    <form onSubmit={handleLookupScore} className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                          <input 
                            id="lookup-email-input"
                            type="email"
                            placeholder="Nhập email đã đăng ký thi..."
                            value={lookupEmail}
                            onChange={(e) => setLookupEmail(e.target.value)}
                            className="w-full bg-[#030712]/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-xs transition-all"
                          />
                        </div>
                        <button 
                          id="btn-lookup-search"
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 hover:border-indigo-500/50 border border-indigo-600 transition-all duration-300 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                        >
                          Tra cứu
                        </button>
                      </div>
                    </form>

                    <AnimatePresence>
                      {lookupSearched && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-white/[0.06] overflow-hidden"
                        >
                          {lookupResult ? (
                            (() => {
                              const sortedSubmissions = [...submissions].sort((a, b) => {
                                if (Math.abs(a.score - b.score) > 0.0001) {
                                  return b.score - a.score;
                                }
                                return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
                              });
                              const rankIndex = sortedSubmissions.findIndex(s => s.email.toLowerCase() === lookupResult.email.toLowerCase());
                              const rank = rankIndex !== -1 ? rankIndex + 1 : null;
                              const totalCount = sortedSubmissions.length;
                              const isTop5 = rank !== null && rank >= 1 && rank <= 5;

                              return (
                                <div className="space-y-3">
                                  {isTop5 && (
                                    <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-3 flex items-center gap-2.5 text-amber-300 text-left animate-pulse">
                                      <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                                      <div>
                                        <p className="text-[11px] font-bold">Chúc mừng! Bạn đạt Top {rank} xuất sắc 🌟</p>
                                        <p className="text-[9.5px] text-amber-200/70 leading-relaxed font-sans mt-0.5">
                                          Thành tích lọt vào top dẫn đầu kỳ thi của bạn vô cùng tuyệt vời! 🎉
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#030712]/40 border border-white/5 items-center">
                                    <div className="text-left overflow-hidden">
                                      <p className="text-slate-500 text-[9px] mb-0.5 uppercase tracking-wide">Thí sinh</p>
                                      <p className="text-white font-bold text-xs truncate leading-tight" title={lookupResult.zaloName}>
                                        {lookupResult.zaloName}
                                      </p>
                                    </div>
                                    <div className="border-x border-white/5 px-2 text-center">
                                      <p className="text-pink-400 text-[9px] mb-0.5 uppercase tracking-wide">Xếp hạng</p>
                                      <p className="text-xs font-bold text-white font-mono">
                                        #{rank} <span className="text-slate-500 font-sans font-normal text-[10px]">/ {totalCount}</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-indigo-400 text-[9px] mb-0.5 uppercase tracking-wide">Điểm tổng</p>
                                      <p className="text-xs font-bold text-indigo-300 font-mono">{lookupResult.score.toFixed(2)}</p>
                                    </div>
                                  </div>

                                  {/* Question Details inside scorecard lookup */}
                                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {lookupResult.breakdown.map((item, idx) => (
                                      <div key={idx} className="p-2.5 bg-[#030712]/10 rounded-lg border border-white/[0.04] text-[11px] space-y-1 text-left">
                                        <div className="flex items-center justify-between mb-0.5">
                                          <span className="font-bold text-slate-300">Câu số {idx + 1}</span>
                                          <span className={`px-1.5 py-0.5 rounded font-bold font-mono text-[9px] border ${item.pointsEarned > 0 ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/10' : 'bg-rose-500/[0.08] text-rose-400 border-rose-500/10'}`}>
                                            +{item.pointsEarned.toFixed(2)} / {item.maxPoints.toFixed(2)} đ
                                          </span>
                                        </div>
                                        <p className="text-slate-400 font-mono text-[10px] leading-relaxed">
                                          Trả lời: <span className="text-slate-200">{item.candidateAnswerDetail}</span>
                                        </p>
                                        <p className="text-slate-400 font-mono text-[10px] leading-relaxed">
                                          Đáp án: <span className="text-emerald-400">{item.correctAnswerDetail}</span>
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-center py-3 text-slate-500 text-xs bg-[#030712]/20 rounded-xl border border-white/[0.06]">
                              Không tìm thấy kết quả thi với email này. Vui lòng kiểm tra lại!
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="bg-slate-500/[0.03] border border-slate-500/10 rounded-2xl p-5 mt-6 mb-6 text-left flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/[0.08] flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Cổng tra cứu kết quả thi</h4>
                      <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1">
                        Cổng tra cứu công khai đang tạm đóng. Ban tổ chức sẽ mở cổng tra cứu điểm và đáp án chi tiết ngay sau khi đợt thi kết thúc!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 border-t border-white/[0.06] pt-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">
                    Sản xuất: <strong className="text-slate-100">{questions.length} câu hỏi</strong> lưu trữ
                  </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div className="flex items-center gap-3">
                  <Clock className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">
                    Thời gian: <strong className="text-slate-100">{systemSettings.examDurationMinutes || 30} phút</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Account Entry & Public Score Lookup Container */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Exam start form */}
              <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl flex-1 hover:border-white/[0.15] transition-all duration-300">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                  <User className="text-emerald-400 w-5 h-5" />
                  Thông tin thí sinh dự thi
                </h2>

                {systemSettings.isExamClosed ? (
                  <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/[0.08] flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-rose-400 font-bold text-sm uppercase font-mono tracking-wider">Đề thi đã đóng</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        Hệ thống đã chính thức đóng đợt thực hành và khảo sát đề thi này. Chào mừng bạn tham khảo kết quả trên bảng xếp hạng bên dưới!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Email của bạn <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          id="candidate-email"
                          type="email"
                          placeholder="example@gmail.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError('');
                          }}
                          className="w-full bg-[#030712]/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all"
                        />
                      </div>
                      {emailError && (
                        <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1.5 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Họ và tên Zalo <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          id="candidate-zalo"
                          type="text"
                          placeholder="Tên hiển thị Zalo..."
                          value={zaloName}
                          onChange={(e) => {
                            setZaloName(e.target.value);
                            if (zaloError) setZaloError('');
                          }}
                          className="w-full bg-[#030712]/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all"
                        />
                      </div>
                      {zaloError && (
                        <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1.5 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {zaloError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          id="candidate-phone"
                          type="tel"
                          placeholder="Ví dụ: 0912345678"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            if (phoneError) setPhoneError('');
                          }}
                          className="w-full bg-[#030712]/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all"
                        />
                      </div>
                      {phoneError && (
                        <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1.5 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {phoneError}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed pt-2">
                      * Thông tin Email, Tên Zalo và Số điện thoại sẽ được dùng cho việc liên hệ và thống kê điểm số trên bảng xếp hạng (Leaderboard) của hệ thống.
                    </p>

                    <button 
                      id="btn-start-exam"
                      onClick={handleStartExam}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-semibold text-slate-950 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-500/20 group text-sm mt-4"
                    >
                      Bắt đầu hành trình dự thi 
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>

              {/* Zalo community details conditionally visible on homepage */}
              {(systemSettings.communityImageUrl || systemSettings.communityLink) && (
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-3xl border border-indigo-500/20 text-center shadow-2xl space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-base">✨</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Tham gia cộng đồng học tập</h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Kết nối, trao đổi kinh nghiệm &amp; ôn luyện giải đề.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-w-sm mx-auto">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Hãy cùng tham gia nhóm cộng đồng học tập để nhận thông tin kì thi, thảo luận trực tiếp cùng đồng đội và nhận đáp án / bài giải chi tiết.
                    </p>

                    <div className="flex justify-center gap-1.5 font-mono text-[9px] text-indigo-300">
                      <span className="bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">🟢 Hoạt động 24/7</span>
                      <span className="bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">📚 Luyện thi hiệu quả</span>
                    </div>

                    {systemSettings.communityImageUrl && (
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#030712]/40 flex justify-center items-center p-2 mx-auto/ max-w-[280px] sm:max-w-[320px] shadow-inner mx-auto">
                        <img 
                          src={systemSettings.communityImageUrl} 
                          alt="Cộng đồng" 
                          className="w-full h-auto object-contain max-h-[300px] rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {systemSettings.communityLink && (
                      <a
                        href={systemSettings.communityLink.startsWith('http') ? systemSettings.communityLink : `https://${systemSettings.communityLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-slate-100 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs text-center shadow-md cursor-pointer hover:shadow-indigo-500/10 duration-200"
                      >
                        Tham gia nhóm ngay
                        <ChevronRight className="w-4 h-4 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE 2: ACTIVE EXAM IN PROGRESS */}
        {gameState === 'exam' && (
          <motion.div 
            key="exam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Column: Question list navigation & Timer sidebar */}
            <div className="lg:col-span-3 space-y-6">
              {/* Timer module */}
              <div className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-between md:flex-col md:items-start gap-4 transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <span className="text-xs text-slate-400 block mb-1 font-mono uppercase tracking-wider">Thời gian còn lại</span>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span id="quiz-timer" className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-xs text-slate-400 mb-1.5 flex justify-between">
                    <span>Độ hoàn thành:</span>
                    <span className="font-semibold text-slate-200">
                      {responses.filter((_, idx) => isQuestionAnswered(idx)).length} / {questions.length} câu
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full transition-all duration-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                      style={{ width: `${(responses.filter((_, idx) => isQuestionAnswered(idx)).length / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Grid */}
              <div className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/[0.15]">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">Danh bản đề thi</h3>
                <div className="grid grid-cols-5 gap-2.5">
                  {questions.map((q, idx) => {
                    const active = idx === activeQuestionIndex;
                    const answered = isQuestionAnswered(idx);
                    const partial = isQuestionPartiallyAnswered(idx) && !answered;

                    let bgClass = 'bg-white/[0.02] hover:bg-white/[0.08] text-slate-400 border border-white/5';
                    if (active) {
                      bgClass = 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 border border-emerald-300 ring-4 ring-emerald-400/25 font-bold';
                    } else if (answered) {
                      bgClass = 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/25';
                    } else if (partial) {
                      bgClass = 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/25';
                    }

                    return (
                      <button
                        key={q.id}
                        id={`q-nav-${idx}`}
                        onClick={() => setActiveQuestionIndex(idx)}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all cursor-pointer ${bgClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 rounded bg-white/[0.02] border border-white/5"></div>
                    <span>Chưa làm</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 rounded bg-amber-500/[0.08] text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono text-[9px] font-bold">!</div>
                    <span>Đang làm dở (với Đúng/Sai)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono text-[9px] font-bold">✓</div>
                    <span>Đã hoàn thành</span>
                  </div>
                </div>

                <button 
                  id="btn-trigger-submit"
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full mt-6 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 font-bold text-white py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm shadow-md shadow-rose-950/20"
                >
                  Nộp bài thi học tập
                </button>
              </div>
            </div>

            {/* Right Column: Question Content Pane */}
            <div className="lg:col-span-9 space-y-6">
              {(() => {
                const q = questions[activeQuestionIndex];
                const resp = responses[activeQuestionIndex];
                if (!q) return null;

                return (
                  <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-6 transition-all duration-300 hover:border-white/[0.15]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                      <div>
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-emerald-400 font-mono text-xs font-bold border border-white/[0.06] uppercase">
                          Câu {activeQuestionIndex + 1}
                        </span>
                        <span className="ml-3 text-xs text-slate-400 font-mono">
                          {q.type === QuestionType.MultipleChoice && 'Trắc nghiệm nhiều lựa chọn'}
                          {q.type === QuestionType.TrueFalseMatrix && 'Đúng/Sai Matrix (4 nhận định)'}
                          {q.type === QuestionType.ShortAnswer && 'Điền đáp án ngắn'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {q.type === QuestionType.TrueFalseMatrix ? 'Điểm chuẩn: 1.0 đ' : `Trọng số: ${(q as any).weight || 1.0} đ`}
                      </span>
                    </div>

                    {/* Image space (if exists) */}
                    {q.imageUrl && (
                      <div className="w-full max-h-80 rounded-2xl overflow-hidden border border-white/10 bg-[#030712]/30 relative group">
                        <img 
                          src={q.imageUrl} 
                          alt={`Câu hỏi ${activeQuestionIndex + 1}`}
                          className="w-full h-full object-contain max-h-80 mx-auto"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Question text */}
                    <div className="text-slate-100 text-base md:text-lg font-medium leading-relaxed font-sans whitespace-pre-wrap">
                      {q.text}
                    </div>

                    {/* Response Area */}
                    <div className="pt-4">
                      
                      {/* TYPE 1: MULTIPLE CHOICE */}
                      {q.type === QuestionType.MultipleChoice && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {q.options.map((option, oIdx) => {
                            const optionChar = ['A', 'B', 'C', 'D'][oIdx];
                            const selected = resp?.multipleChoiceAnswer === optionChar;
                            const optionImg = q.optionsImages?.[oIdx];
                            return (
                              <button
                                key={oIdx}
                                id={`q-${activeQuestionIndex}-opt-${optionChar}`}
                                onClick={() => handleMultipleChoiceSelect(q.id, optionChar)}
                                className={`flex flex-col items-stretch gap-3 p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                                  selected 
                                    ? 'bg-emerald-500/[0.08] border-emerald-500/40 text-slate-100 shadow-lg shadow-emerald-500/10' 
                                    : 'bg-white/[0.01] hover:bg-white/[0.05] border-white/5 hover:border-white/15 text-slate-300'
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                    selected 
                                      ? 'bg-emerald-400 text-slate-950' 
                                      : 'bg-white/[0.06] text-slate-400 border border-white/5'
                                  }`}>
                                    {optionChar}
                                  </span>
                                  <span className="text-sm pt-0.5 leading-tight flex-1">{option}</span>
                                </div>
                                {optionImg && (
                                  <div className="mt-2 w-full max-h-48 overflow-hidden rounded-lg bg-black/20 flex justify-center p-2 border border-white/5 shadow-inner">
                                    <img 
                                      src={optionImg} 
                                      alt={`Lựa chọn ${optionChar}`} 
                                      referrerPolicy="no-referrer" 
                                      className="max-h-40 object-contain rounded"
                                    />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* TYPE 2: TRUE / FALSE MATRIX */}
                      {q.type === QuestionType.TrueFalseMatrix && (
                        <div className="space-y-4">
                          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.05] inline-block">
                            Chọn Đúng (Đ) hoặc Sai (S) cho từng ý dưới đây:
                          </p>
                          <div className="bg-white/[0.01] rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.05]">
                            {q.statements.map((statement, sIdx) => {
                              const currTF = resp?.trueFalseAnswers || [null, null, null, null];
                              const userChoice = currTF[sIdx]; // true, false or null
                              const statementImg = q.statementsImages?.[sIdx];
                              
                              return (
                                <div key={sIdx} className="p-4 flex flex-col gap-4 hover:bg-white/[0.01] transition-colors">
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                                    <div className="flex items-start gap-3 flex-1">
                                      <span className="flex-shrink-0 text-xs font-mono text-emerald-400 pt-0.5 font-bold">
                                        {String.fromCharCode(97 + sIdx)}.
                                      </span>
                                      <div className="flex flex-col gap-2 flex-1">
                                        <span className="text-slate-200 text-sm leading-relaxed">{statement}</span>
                                        {statementImg && (
                                          <div className="mt-1.5 max-w-md max-h-48 overflow-hidden rounded-lg bg-black/20 flex justify-start p-2 border border-white/5 shadow-inner">
                                            <img 
                                              src={statementImg} 
                                              alt={`Nhận định ${String.fromCharCode(97 + sIdx)}`} 
                                              referrerPolicy="no-referrer" 
                                              className="max-h-40 object-contain rounded"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-start md:mt-1 shrink-0">
                                      <button
                                        id={`q-${activeQuestionIndex}-${sIdx}-true`}
                                        onClick={() => handleTrueFalseSelect(q.id, sIdx, true)}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all duration-200 border ${
                                          userChoice === true 
                                            ? 'bg-emerald-500/[0.08] border-emerald-500/40 text-emerald-300' 
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.07] text-slate-400'
                                        }`}
                                      >
                                        Đúng (True)
                                      </button>
                                      <button
                                        id={`q-${activeQuestionIndex}-${sIdx}-false`}
                                        onClick={() => handleTrueFalseSelect(q.id, sIdx, false)}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all duration-200 border ${
                                          userChoice === false 
                                            ? 'bg-rose-500/[0.08] border-rose-500/40 text-rose-300' 
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.07] text-slate-400'
                                        }`}
                                      >
                                        Sai (False)
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* TYPE 3: SHORT ANSWER */}
                      {q.type === QuestionType.ShortAnswer && (
                        <div className="space-y-3 max-w-lg">
                          <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                            Điền đáp án của bạn:
                          </label>
                          <input 
                            id={`q-${activeQuestionIndex}-short-answer`}
                            type="text"
                            placeholder="Nhập giá trị số hoặc chuỗi văn bản..."
                            value={resp?.shortAnswerValue || ''}
                            onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                            className="w-full bg-[#030712]/50 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-100 px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-600 transition-all text-sm"
                          />
                          <p className="text-xs text-slate-500 font-sans">
                            📝 Phân biệt chữ hoa / thường hay dấu cách dư thừa sẽ được hệ thống chuẩn hóa thu nhỏ khi so sánh đáp án.
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Pre-Next Navigation buttons */}
                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-6 mt-4">
                      <button 
                        id="btn-prev-question"
                        onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeQuestionIndex === 0}
                        className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        Câu trước đó
                      </button>

                      <div className="text-xs text-slate-400 font-mono">
                        {activeQuestionIndex + 1} / {questions.length}
                      </div>

                      <button 
                        id="btn-next-question"
                        onClick={() => setActiveQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={activeQuestionIndex === questions.length - 1}
                        className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        Câu tiếp theo
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* PHASE 3: SUBMITTED SUCCESS AND WAIT */}
        {gameState === 'submitted' && (
          <motion.div 
            key="submitted"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl mx-auto bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl text-center space-y-6 hover:border-white/[0.15] transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/[0.08] border-2 border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              Nộp Bài Thành Công!
            </h1>

            {/* Vietnam and English bilingual requested wording */}
            <div className="space-y-4 py-3 border-y border-white/[0.06]">
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "Your exam has been submitted successfully. Please wait for the admin to release the scores."
              </p>
              <div className="h-px bg-white/[0.06] w-1/3 mx-auto"></div>
              <p className="text-sm text-emerald-400 leading-relaxed">
                Bài thi của thí sinh <strong className="text-slate-100">{zaloName}</strong> ({email} - {phoneNumber}) đã được hệ thống tiếp nhận và lưu cơ sở dữ liệu.
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có thể theo dõi bảng xếp hạng (Leaderboard) được hiển thị công khai ở bảng điều khiển của Admin, hoặc quay lại trang chủ tra cứu khi Admin bật phát hành điểm số.
            </p>

            {/* COMMUNITY LINK & PIC SECTION */}
            {(systemSettings.communityImageUrl || systemSettings.communityLink) && (
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/20 text-center shadow-lg space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-base">✨</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">Tham gia cộng đồng học tập</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Kết nối, trao đổi kinh nghiệm &amp; ôn luyện giải đề.</p>
                  </div>
                </div>

                <div className="space-y-3.5 max-w-sm mx-auto">
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Hãy cùng tham gia nhóm cộng đồng học tập để nhận thông tin kì thi mới nhất, thảo luận trực tiếp cùng các thí sinh khác và nhận trợ giúp giải đề chi tiết!
                  </p>

                  <div className="flex justify-center gap-1.5 font-mono text-[9px] text-indigo-300">
                    <span className="bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">🟢 Hoạt động 24/7</span>
                    <span className="bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">📚 Học tập tích cực</span>
                  </div>

                  {systemSettings.communityImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#030712]/40 flex justify-center items-center p-2 mx-auto max-w-[280px] sm:max-w-[320px] shadow-inner">
                      <img 
                        src={systemSettings.communityImageUrl} 
                        alt="Cộng đồng" 
                        className="w-full h-auto object-contain max-h-[300px] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {systemSettings.communityLink && (
                    <a
                      href={systemSettings.communityLink.startsWith('http') ? systemSettings.communityLink : `https://${systemSettings.communityLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-slate-100 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs text-center shadow-md cursor-pointer hover:shadow-indigo-500/10 duration-200"
                    >
                      Tham gia nhóm ngay
                      <ChevronRight className="w-4 h-4 text-white" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                id="btn-return-home"
                onClick={() => {
                  setGameState('welcome');
                  setEmail('');
                  setZaloName('');
                  setLookupEmail('');
                  setLookupSearched(false);
                }}
                className="flex-1 bg-white/[0.02] border border-white/5 text-slate-300 hover:bg-white/[0.08] hover:text-white font-semibold py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Dự thi bài mới / Quay lại
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* CONFIRMATION MODAL BEFORE SUBMIT */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-[#030712]/75 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative bg-[#0c1120]/90 backdrop-blur-3xl border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-3xl relative z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/[0.08] border border-amber-500/20 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Xác nhận nộp bài thi?</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Bạn đã làm được <strong className="text-slate-200">{responses.filter((_, idx) => isQuestionAnswered(idx)).length} / {questions.length} câu hỏi</strong>. Hành động này không thể hoàn tác sau khi gửi. Bạn có chắc chắn muốn nộp bài?
                </p>
              </div>

              {/* Warning list if there are unanswered questions */}
              {responses.filter((_, idx) => !isQuestionAnswered(idx)).length > 0 && (
                <div className="p-3 bg-rose-500/[0.08] rounded-xl border border-rose-500/20 text-xs text-rose-400 font-mono">
                  Bạn vẫn còn {responses.filter((_, idx) => !isQuestionAnswered(idx)).length} câu hỏi chưa hoàn thành xong!
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  id="btn-cancel-submit"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center"
                >
                  Kiểm tra lại
                </button>
                <button
                  id="btn-confirm-submit"
                  onClick={verifyAndSubmit}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold text-slate-950 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-500/20"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
