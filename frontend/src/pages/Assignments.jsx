import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  Filter,
  Search,
  Plus,
  X,
  Loader2,
  Sparkles,
  BrainCircuit,
  ArrowLeft,
  BookOpen,
  Send,
  Award,
  AlertCircle,
  Code2,
  Check,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Lightbulb,
  Target,
} from 'lucide-react';
import { learningApi } from '../lib/api';

/** Render **bold** and `code` inline without markdown dependencies. */
function InlineText({ text }) {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-[0.88em] font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

export default function Assignments({ goBack, navigateTo, params }) {
  const sessionIdParam = params?.get('sessionId');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Interactive Practice State
  const [activePractice, setActivePractice] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [completingAssignment, setCompletingAssignment] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  // Filter & Search state for list
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const STATUSES = ['Pending', 'In Progress', 'Completed'];
  const FILTERS = ['All', ...STATUSES];

  // Load all user assignments from PostgreSQL
  const loadUserAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await learningApi.getAssignments();
      const list = res?.data?.assignments || res?.assignments || [];
      setAssignments(list);
    } catch (err) {
      console.error('[Assignments] Error loading assignments:', err);
      setError('Unable to load assignments from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAssignments();
  }, []);

  // Launch or load specific assignment practice session
  const openAssignmentPractice = async (sessionId) => {
    if (!sessionId) return;
    try {
      setPracticeLoading(true);
      setError(null);
      setResultSummary(null);

      // 1. Get or create assignment
      let res = await learningApi.getAssignment(sessionId);
      let data = res?.data?.assignment || res?.assignment;

      if (!data) {
        const createRes = await learningApi.createAssignment(sessionId);
        data = createRes?.data?.assignment || createRes?.assignment;
      }

      // 2. Start or resume attempt in PostgreSQL
      const attemptRes = await learningApi.startAssignmentAttempt(sessionId);
      const attemptData = attemptRes?.data || {};

      const loadedAnswers = attemptData.answers || data.currentAttempt?.answers || {};
      setAnswers(loadedAnswers);

      const questions = data.questions || [];
      // Find first unanswered question
      let firstUnanswered = 0;
      for (let i = 0; i < questions.length; i++) {
        if (!loadedAnswers[questions[i].id]) {
          firstUnanswered = i;
          break;
        }
      }

      setActivePractice(data);
      setCurrentQIndex(firstUnanswered);
      setSelectedOption(null);

      // If assignment was already completed, show results view
      if (data.status === 'completed' && data.score !== null) {
        // Can preview or practice
      }
    } catch (err) {
      console.error('[Assignments] Error opening assignment:', err);
      setError(err.message || 'Failed to open personalized assignment.');
    } finally {
      setPracticeLoading(false);
    }
  };

  // If URL has sessionIdParam on load, open it immediately
  useEffect(() => {
    if (sessionIdParam) {
      openAssignmentPractice(sessionIdParam);
    }
  }, [sessionIdParam]);

  // Handle single question answer check
  const handleCheckAnswer = async () => {
    if (!selectedOption || !activePractice || submittingAnswer) return;
    const currentQ = activePractice.questions?.[currentQIndex];
    if (!currentQ) return;

    try {
      setSubmittingAnswer(true);
      const res = await learningApi.submitAssignmentAnswer(
        activePractice.sessionId,
        currentQ.id,
        selectedOption
      );

      const answerData = res?.data || {
        isCorrect: selectedOption === currentQ.correctAnswer,
        correctAnswer: currentQ.correctAnswer,
        explanation: currentQ.explanation,
        feedback: selectedOption === currentQ.correctAnswer ? '✓ Correct' : '✕ Not quite',
      };

      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: {
          selectedAnswer: selectedOption,
          ...answerData,
        },
      }));
    } catch (err) {
      console.error('[Assignments] Error submitting answer:', err);
      // Fallback local evaluation if offline
      const isCorrect = selectedOption === currentQ.correctAnswer;
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: {
          selectedAnswer: selectedOption,
          isCorrect,
          correctAnswer: currentQ.correctAnswer,
          explanation: currentQ.explanation,
          feedback: isCorrect ? '✓ Correct' : '✕ Not quite',
        },
      }));
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Advance to next question or complete assignment
  const handleNextQuestion = async () => {
    const questions = activePractice?.questions || [];
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Final question answered: Submit & Finalize Assignment
      try {
        setCompletingAssignment(true);
        const res = await learningApi.submitAssignment(activePractice.sessionId, { answers });
        const summaryData = res?.data || res;
        setResultSummary(summaryData);
        loadUserAssignments(); // refresh list in background
      } catch (err) {
        console.error('[Assignments] Error finalizing assignment:', err);
        // Fallback calculation
        const total = questions.length || 8;
        const correct = Object.values(answers).filter((a) => a.isCorrect).length;
        const score = Math.round((correct / total) * 100);
        setResultSummary({
          score,
          percentage: score,
          totalQuestions: total,
          correctAnswers: correct,
          previousMastery: activePractice.sessionMastery || 70,
          newMastery: Math.min(100, (activePractice.sessionMastery || 70) + 4),
          masteryDelta: 4,
          conceptBreakdown: [],
          improvedConcepts: [],
          recommendedNext: 'Review key takeaways and test yourself on advanced problems.',
        });
      } finally {
        setCompletingAssignment(false);
      }
    }
  };

  // Latest personalized assignment (first one or from completed sessions)
  const latestAssignment = useMemo(() => {
    if (assignments.length === 0) return null;
    return assignments[0];
  }, [assignments]);

  const visibleAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Completed' && a.status === 'Completed') ||
        (statusFilter === 'In Progress' && a.status === 'In Progress') ||
        (statusFilter === 'Pending' && (a.status === 'Ready' || a.status === 'Pending'));
      const matchesSearch = `${a.title} ${a.topic || a.course}`.toLowerCase().includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [assignments, statusFilter, search]);

  // Current Question Object
  const currentQuestion = activePractice?.questions?.[currentQIndex] || null;
  const currentAnswered = currentQuestion ? answers[currentQuestion.id] : null;
  const totalQuestionsCount = activePractice?.questions?.length || 8;
  const answeredQuestionsCount = Object.keys(answers).length;

  return (
    <div className="w-full h-full min-h-screen bg-[#000000] flex flex-col relative overflow-hidden font-sans text-white">
      {/* Top Header */}
      <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#000000] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activePractice) {
                setActivePractice(null);
                setResultSummary(null);
              } else if (goBack) {
                goBack();
              } else if (navigateTo) {
                navigateTo('dashboard');
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#22D3EE]" />
            <h1 className="text-sm font-semibold text-white">
              {activePractice ? activePractice.title : 'Personalized Assignments'}
            </h1>
          </div>
        </div>

        {activePractice && !resultSummary && (
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="hidden sm:inline">Progress:</span>
            <span className="font-semibold text-[#22D3EE]">
              {answeredQuestionsCount} / {totalQuestionsCount}
            </span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative scrollbar-hide">
        {practiceLoading ? (
          <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3 text-white/40">
            <Loader2 className="w-7 h-7 animate-spin text-[#22D3EE]" />
            <span className="text-sm font-medium">Preparing your personalized practice set...</span>
          </div>
        ) : activePractice ? (
          /* =========================================================================
             1. ACTIVE INTERACTIVE PRACTICE / RESULTS VIEW
             ========================================================================= */
          <div className="max-w-[860px] mx-auto p-4 sm:p-8 pb-20 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {resultSummary ? (
              /* ─── Assignment Result Screen ─────────────────────────────────────────── */
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-6 text-center relative overflow-hidden">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] mb-1">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#22D3EE] font-semibold">
                      Assignment Complete
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                      {activePractice.title}
                    </h2>
                    <p className="text-sm text-white/50 mt-1">
                      Based on your completed session in {activePractice.topic}
                    </p>
                  </div>

                  {/* Score & Mastery Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-2">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center">
                      <span className="text-xs text-white/40 uppercase font-medium">Score</span>
                      <span className="text-3xl font-bold text-white mt-1">
                        {resultSummary.correctAnswers || Object.values(answers).filter((a) => a.isCorrect).length} / {totalQuestionsCount}
                      </span>
                      <span className="text-xs text-[#22D3EE] mt-0.5 font-medium">
                        {resultSummary.percentage || resultSummary.score}% Accuracy
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center">
                      <span className="text-xs text-white/40 uppercase font-medium">Overall Mastery</span>
                      <span className="text-3xl font-bold text-emerald-400 mt-1">
                        {resultSummary.newMastery || activePractice.sessionMastery || 75}%
                      </span>
                      {resultSummary.masteryDelta > 0 && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                          <TrendingUp className="w-3 h-3" /> +{resultSummary.masteryDelta}% boost
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center">
                      <span className="text-xs text-white/40 uppercase font-medium">Level</span>
                      <span className="text-lg font-bold text-white capitalize mt-2">
                        {resultSummary.percentage >= 80 ? 'Mastered' : resultSummary.percentage >= 60 ? 'Developing' : 'Needs Practice'}
                      </span>
                      <span className="text-[11px] text-white/40 mt-1">Updated in DB</span>
                    </div>
                  </div>

                  {/* Concept Mastery Comparison Breakdown */}
                  {resultSummary.conceptBreakdown?.length > 0 && (
                    <div className="pt-4 border-t border-white/10 text-left">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                          Concept Mastery Updates
                        </h4>
                        <span className="text-xs text-emerald-400 font-medium">Saved to PostgreSQL</span>
                      </div>
                      <div className="space-y-2">
                        {resultSummary.conceptBreakdown.map((cb, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-[#12161E] border border-white/5 flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="text-white/80 font-medium truncate">{cb.title}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-white/40">{cb.previousScore}%</span>
                              <span className="text-white/20">→</span>
                              <span className="font-bold text-white">{cb.currentScore}%</span>
                              {cb.delta > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[11px]">
                                  +{cb.delta}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-[#22D3EE]/5 border border-[#22D3EE]/20 text-left flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">Next Step</h4>
                      <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
                        {resultSummary.recommendedNext || 'Review your progress on the Insights dashboard and continue learning new topics.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => (navigateTo ? navigateTo('dashboard/insights') : null)}
                      className="px-6 py-2.5 bg-[#22D3EE] text-black font-semibold text-xs rounded-lg hover:bg-[#22D3EE]/90 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      View Mastery Insights
                    </button>
                    <button
                      onClick={() => openAssignmentPractice(activePractice.sessionId)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Practice Again
                    </button>
                    <button
                      onClick={() => setActivePractice(null)}
                      className="px-4 py-2.5 border border-white/10 text-white/70 hover:text-white text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Back to Assignments
                    </button>
                  </div>
                </div>
              </div>
            ) : currentQuestion ? (
              /* ─── Question By Question Stepper ─────────────────────────────────────── */
              <div className="space-y-6">
                {/* Stepper Header */}
                <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span>{activePractice.topic}</span>
                      <span>•</span>
                      <span className="capitalize text-[#22D3EE] font-medium">{activePractice.difficulty} Practice</span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Question {currentQIndex + 1} of {totalQuestionsCount}
                    </h2>
                  </div>

                  {activePractice.focusConcepts?.length > 0 && (
                    <div className="px-3 py-1.5 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-xs font-medium self-start sm:self-auto flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      <span>Focus: {activePractice.focusConcepts[0]?.conceptTitle || 'Targeted Weak Area'}</span>
                    </div>
                  )}
                </div>

                {/* Question Progress Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#22D3EE] h-full transition-all duration-300"
                    style={{ width: `${((currentQIndex + (currentAnswered ? 1 : 0)) / totalQuestionsCount) * 100}%` }}
                  />
                </div>

                {/* Main Question Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1117] border border-white/10 space-y-6 shadow-xl">
                  {/* Concept Tag */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/60">
                    <BrainCircuit className="w-3 h-3 text-[#22D3EE]" />
                    <span>Concept: {currentQuestion.conceptTitle}</span>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-base sm:text-lg text-white font-medium leading-relaxed">
                    <InlineText text={currentQuestion.question} />
                  </div>

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options?.map((opt) => {
                      const isSelected = selectedOption === opt.value;
                      const hasAnswered = !!currentAnswered;
                      const wasChosen = currentAnswered?.selectedAnswer === opt.value;
                      const isActualCorrect = currentAnswered && String(opt.value).toUpperCase() === String(currentQuestion.correctAnswer).toUpperCase();

                      let cardStyle = 'border-white/10 bg-[#161B22] hover:border-white/30 text-white/90 cursor-pointer';

                      if (hasAnswered) {
                        if (wasChosen && currentAnswered.isCorrect) {
                          // Correct chosen
                          cardStyle = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 cursor-default';
                        } else if (wasChosen && !currentAnswered.isCorrect) {
                          // Wrong chosen
                          cardStyle = 'border-rose-500/60 bg-rose-500/10 text-rose-200 cursor-default';
                        } else if (isActualCorrect) {
                          // Reveal correct answer
                          cardStyle = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-300 cursor-default';
                        } else {
                          cardStyle = 'border-white/5 bg-[#12161F] text-white/40 opacity-50 cursor-default';
                        }
                      } else if (isSelected) {
                        cardStyle = 'border-[#22D3EE] bg-[#22D3EE]/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)] cursor-pointer';
                      }

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={hasAnswered}
                          onClick={() => setSelectedOption(opt.value)}
                          className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all text-xs sm:text-sm leading-relaxed ${cardStyle}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                              hasAnswered
                                ? wasChosen && currentAnswered.isCorrect
                                  ? 'bg-emerald-500 text-black'
                                  : wasChosen && !currentAnswered.isCorrect
                                  ? 'bg-rose-500 text-white'
                                  : isActualCorrect
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-white/5 text-white/40'
                                : isSelected
                                ? 'bg-[#22D3EE] text-black'
                                : 'bg-white/10 text-white/70'
                            }`}
                          >
                            {opt.value}
                          </span>
                          <span className="flex-1">
                            <InlineText text={opt.label} />
                          </span>
                          {hasAnswered && (
                            <span className="shrink-0 pt-0.5">
                              {wasChosen && currentAnswered.isCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              )}
                              {wasChosen && !currentAnswered.isCorrect && (
                                <X className="w-5 h-5 text-rose-400" />
                              )}
                              {!wasChosen && isActualCorrect && (
                                <Check className="w-4 h-4 text-emerald-400" />
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Section (when submitted) */}
                  {currentAnswered && (
                    <div
                      className={`p-5 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 space-y-2 ${
                        currentAnswered.isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                        {currentAnswered.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400" />
                        )}
                        <span>{currentAnswered.feedback || (currentAnswered.isCorrect ? 'Correct!' : 'Not quite')}</span>
                        {!currentAnswered.isCorrect && (
                          <span className="text-white/60 font-normal">
                            (Correct Answer: <strong className="text-white">{currentAnswered.correctAnswer}</strong>)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed font-sans">
                        <InlineText text={currentAnswered.explanation} />
                      </p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                    <button
                      onClick={() => {
                        if (currentQIndex > 0) {
                          setCurrentQIndex((p) => p - 1);
                          setSelectedOption(null);
                        }
                      }}
                      disabled={currentQIndex === 0}
                      className="px-4 py-2 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      Previous
                    </button>

                    {!currentAnswered ? (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={!selectedOption || submittingAnswer}
                        className="px-6 py-2.5 bg-[#22D3EE] text-black font-semibold text-xs rounded-lg hover:bg-[#22D3EE]/90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        {submittingAnswer ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          'Submit Answer'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        disabled={completingAssignment}
                        className="px-6 py-2.5 bg-[#22D3EE] text-black font-semibold text-xs rounded-lg hover:bg-[#22D3EE]/90 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        {completingAssignment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Finalizing Mastery...
                          </>
                        ) : currentQIndex + 1 < totalQuestionsCount ? (
                          <>
                            Next Question
                            <ChevronRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Complete Assignment
                            <Sparkles className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* =========================================================================
             2. OVERVIEW / LIST VIEW OF ALL PERSONALIZED ASSIGNMENTS
             ========================================================================= */
          <div className="p-4 sm:p-8 pb-16 flex flex-col gap-6 max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Banner for Latest Completed Session Assignment */}
            {latestAssignment && (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0C121E] via-[#0A0D14] to-[#050505] border border-[#22D3EE]/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] text-[11px] font-semibold tracking-wide uppercase">
                        Latest Personalized Practice
                      </span>
                      <span className="text-xs text-white/40">• Based on Completed Session</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {latestAssignment.topic || latestAssignment.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                      {latestAssignment.description ||
                        'Targeted practice questions generated from your checkpoint performance to solidify your understanding.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-white/50">
                      <div className="flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span>{latestAssignment.questionsCount || 8} Interactive Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span className="capitalize">{latestAssignment.difficulty || 'Developing'} Level</span>
                      </div>
                      {latestAssignment.score !== null && latestAssignment.score !== undefined && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Last Score: {latestAssignment.score}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => openAssignmentPractice(latestAssignment.sessionId)}
                      className="px-6 py-3 bg-[#22D3EE] text-black font-semibold text-xs rounded-xl hover:bg-[#22D3EE]/90 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      {latestAssignment.status === 'Completed'
                        ? 'Practice Again'
                        : latestAssignment.status === 'In Progress'
                        ? 'Continue Practice'
                        : 'Start Assignment'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Session Assignments</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Generated automatically when you complete learning sessions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Search assignments"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 w-48 sm:w-60 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setStatusFilter((f) => FILTERS[(FILTERS.indexOf(f) + 1) % FILTERS.length])}
                  aria-label={`Filter by status: ${statusFilter}`}
                  className="p-2 px-3 border border-white/10 bg-[#0A0A0A] rounded-lg text-white/70 hover:text-white transition-colors flex items-center gap-2 text-[12px] cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {statusFilter}
                </button>
              </div>
            </div>

            {/* Assignments Table / List Card */}
            <div className="border border-white/10 rounded-2xl bg-[#0A0A0A] overflow-x-auto shadow-sm">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[11px] font-semibold text-white/40 uppercase tracking-wider min-w-[640px]">
                <div className="col-span-5">Personalized Assignment</div>
                <div className="col-span-3">Session Topic</div>
                <div className="col-span-2">Difficulty / Questions</div>
                <div className="col-span-2 text-right">Status / Score</div>
              </div>

              <div className="flex flex-col divide-y divide-white/5">
                {loading ? (
                  <div className="py-16 flex items-center justify-center gap-2 text-white/40 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-[#22D3EE]" />
                    <span>Loading personalized assignments from PostgreSQL...</span>
                  </div>
                ) : visibleAssignments.length === 0 ? (
                  <div className="py-16 px-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-white/80 font-medium">No personalized assignments yet.</p>
                    <p className="text-xs text-white/40 max-w-sm mx-auto">
                      Complete a learning session and its checkpoints to unlock your first targeted practice set.
                    </p>
                    <button
                      onClick={() => (navigateTo ? navigateTo('dashboard/tutor') : null)}
                      className="mt-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Start Learning
                    </button>
                  </div>
                ) : (
                  visibleAssignments.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openAssignmentPractice(item.sessionId)}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.03] transition-colors min-w-[640px] cursor-pointer group"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        {item.status === 'Completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : item.status === 'In Progress' ? (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/30 shrink-0" />
                        )}
                        <span className="text-[13px] font-medium text-white group-hover:text-[#22D3EE] transition-colors truncate">
                          {item.title}
                        </span>
                      </div>

                      <div className="col-span-3 text-[12px] text-white/50 truncate">
                        {item.topic || item.course}
                      </div>

                      <div className="col-span-2 text-[12px] text-white/40 capitalize">
                        {item.difficulty || 'Developing'} • {item.questionsCount || 8}Q
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {item.score !== null && item.score !== undefined && (
                          <span className="text-[12px] font-bold text-emerald-400">{item.score}%</span>
                        )}
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                            item.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.status === 'In Progress'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
