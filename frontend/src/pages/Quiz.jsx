import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Award,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { learningApi } from '../lib/api';
import { getQuiz as getLegacyQuiz, SKILLS } from '../lib/quizBank';
import { formatClock } from '../lib/format';
import { useApp } from '../store/AppStore';

const SECONDS_PER_QUESTION = 60;
const QUESTION_COUNT = 5;

const CHOICES = [
  { id: 'mixed', label: 'Mixed', params: {} },
  ...['python', 'ml', 'dl', 'data', 'dsa'].map((s) => ({ id: s, label: SKILLS[s], params: { skill: s } })),
];

/**
 * Session-based Personalized Quiz System
 * Connects: Learning Session → Quiz Generation → Real-time Evaluation → PostgreSQL Storage → Concept Mastery & Weak Concepts → Assignment Next Step
 */
export default function Quiz({ params, goBack, navigateTo }) {
  const { dispatch } = useApp();

  const targetSessionId = params?.get('sessionId') ? parseInt(params.get('sessionId'), 10) : null;
  const legacySkill = params?.get('skill') || undefined;
  const legacyTopic = params?.get('topic') || undefined;

  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState(() => (legacySkill || legacyTopic ? 'running' : 'setup'));
  const [config, setConfig] = useState({ skill: legacySkill, topic: legacyTopic });
  const [errorMsg, setErrorMsg] = useState(null);

  const [questions, setQuestions] = useState(() => {
    if (legacySkill || legacyTopic) {
      return getLegacyQuiz({ skill: legacySkill, topic: legacyTopic, count: QUESTION_COUNT });
    }
    return [];
  });
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [quizResults, setQuizResults] = useState(null);

  // Timer
  const [remaining, setRemaining] = useState(QUESTION_COUNT * SECONDS_PER_QUESTION);
  const endsAt = useRef(Date.now() + QUESTION_COUNT * SECONDS_PER_QUESTION * 1000);
  const startedAt = useRef(Date.now());
  const saved = useRef(false);

  // Start a quiz with specific configuration
  const startQuizWithConfig = useCallback((cfg) => {
    setConfig(cfg);
    const qs = getLegacyQuiz({ ...cfg, count: QUESTION_COUNT });
    setQuestions(qs);
    setIndex(0);
    setPicked(null);
    setSubmitted(false);
    setAnswers([]);
    saved.current = false;
    const total = qs.length * SECONDS_PER_QUESTION;
    setRemaining(total);
    startedAt.current = Date.now();
    endsAt.current = Date.now() + total * 1000;
    setPhase('running');
  }, []);

  // Try auto-loading active session
  useEffect(() => {
    let active = true;
    async function initSession() {
      if (legacySkill || legacyTopic) return;
      try {
        const sessionsRes = await learningApi.getSessions();
        const allSessions = sessionsRes?.data?.sessions || sessionsRes?.sessions || [];
        if (!allSessions || allSessions.length === 0) return;

        let selected = null;
        if (targetSessionId) {
          selected = allSessions.find((s) => s.id === targetSessionId);
        } else {
          selected = allSessions.find((s) => s.status === 'active') || allSessions[0];
        }

        if (active && selected) {
          setSession(selected);
          if (targetSessionId) {
            loadSessionQuiz(selected);
          }
        }
      } catch (err) {
        console.warn('[Quiz] Session init note:', err.message);
      }
    }
    initSession();
    return () => {
      active = false;
    };
  }, [targetSessionId, legacySkill, legacyTopic]);

  // Load session quiz from backend
  const loadSessionQuiz = async (sess) => {
    try {
      setPhase('generating');
      setErrorMsg(null);
      setSession(sess);

      let quizRes;
      try {
        quizRes = await learningApi.createQuiz(sess.id);
      } catch (postErr) {
        quizRes = await learningApi.getQuiz(sess.id);
      }

      const qList = quizRes?.data?.questions || quizRes?.data?.quiz?.questions || quizRes?.questions || [];
      if (!qList || qList.length === 0) {
        throw new Error('No quiz questions available');
      }

      const formatted = qList.map((q, i) => {
        let opts = q.options;
        if (Array.isArray(opts) && typeof opts[0] === 'object' && opts[0].label) {
          opts = opts.map((o) => o.label);
        }
        const correctIdx = typeof q.correctOptionIndex === 'number'
          ? q.correctOptionIndex
          : (typeof q.correctAnswer === 'number'
              ? q.correctAnswer
              : (q.correctAnswer === 'B' ? 1 : q.correctAnswer === 'C' ? 2 : q.correctAnswer === 'D' ? 3 : 0));

        return {
          id: q.id || `q_${i + 1}`,
          conceptId: q.conceptId,
          conceptTitle: q.conceptTitle || `Concept ${i + 1}`,
          q: q.question,
          options: opts || [],
          answer: correctIdx,
          explanation: q.explanation || 'Review the concept material for more details.',
          help: q.hint || '',
        };
      });

      setQuestions(formatted);
      setIndex(0);
      setPicked(null);
      setSubmitted(false);
      setAnswers([]);
      saved.current = false;
      const totalSec = formatted.length * SECONDS_PER_QUESTION;
      setRemaining(totalSec);
      endsAt.current = Date.now() + totalSec * 1000;
      startedAt.current = Date.now();
      setPhase('running');
    } catch (err) {
      console.error('[Quiz] Quiz load error:', err.message);
      setErrorMsg("We couldn't prepare your personalized quiz right now.");
      setPhase('error');
    }
  };

  // Complete and submit quiz
  const finishQuiz = useCallback(
    async (finalAnswers) => {
      setPhase('results');
      if (saved.current) return;
      saved.current = true;

      const correctCount = finalAnswers.filter((a) => a.correct).length;
      const pct = Math.round((correctCount / (questions.length || 1)) * 100);

      const label = session ? session.topic : config.skill ? SKILLS[config.skill] : config.topic || 'Mixed';

      dispatch({
        type: 'quiz/record',
        result: {
          id: `r_${Date.now()}`,
          at: new Date().toISOString(),
          skill: config.skill || null,
          label,
          score: correctCount,
          total: questions.length,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        },
      });

      if (session?.id) {
        try {
          const payload = finalAnswers.map((fa, i) => ({
            questionIndex: i,
            questionId: fa.id,
            conceptId: fa.conceptId,
            selectedOptionIndex: fa.picked,
          }));
          const res = await learningApi.submitQuiz(session.id, payload);
          if (res?.data) {
            setQuizResults(res.data);
          }
        } catch (err) {
          console.warn('[Quiz] Submission note:', err.message);
        }
      }
    },
    [config, dispatch, questions.length, session]
  );

  // Timer countdown
  const answersRef = useRef(answers);
  answersRef.current = answers;
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) finishQuiz(answersRef.current);
    };
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [phase, finishQuiz]);

  const currentQ = questions[index];

  const submit = useCallback(() => {
    if (picked !== null) setSubmitted(true);
  }, [picked]);

  const next = useCallback(() => {
    if (!currentQ) return;
    const updated = [
      ...answers,
      {
        id: currentQ.id,
        conceptId: currentQ.conceptId,
        conceptTitle: currentQ.conceptTitle,
        picked,
        correct: picked === currentQ.answer,
      },
    ];
    setAnswers(updated);
    if (index + 1 >= questions.length) {
      finishQuiz(updated);
      return;
    }
    setIndex(index + 1);
    setPicked(null);
    setSubmitted(false);
  }, [answers, currentQ, finishQuiz, index, picked, questions.length]);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'running' || !currentQ) return undefined;
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const n = 'abcd'.indexOf(e.key.toLowerCase());
      if (n >= 0 && n < currentQ.options.length && !submitted) setPicked(n);
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') (submitted ? next : submit)();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, currentQ, submitted, next, submit]);

  const shell = (children) => (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-sans text-white">
      <header className="h-[60px] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (goBack ? goBack() : navigateTo ? navigateTo('dashboard') : null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#22D3EE]" />
            <h1 className="text-sm font-semibold text-white">Quiz Engine</h1>
          </div>
        </div>

        {session && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/70">
            <BookOpen className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span className="font-medium text-white">{session.topic}</span>
          </div>
        )}
      </header>
      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-4 sm:p-8 pb-16 flex flex-col gap-6 max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>
    </div>
  );

  // ─── STATE: SETUP (Choose or resume personalized quiz) ────────────────────────
  if (phase === 'setup') {
    return shell(
      <>
        <div className="mt-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Personalized Quiz</h2>
          <p className="text-sm text-white/50">
            {session
              ? `Take your personalized quiz tailored to your "${session.topic}" learning session.`
              : 'Choose a skill assessment or start a learning session to generate a personalized quiz.'}
          </p>
        </div>

        {session && (
          <div className="p-6 rounded-2xl border border-[#22D3EE]/30 bg-[#22D3EE]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#22D3EE] uppercase tracking-wider">
                {session.status === 'completed' ? '🎉 Completed Track' : '⚡ Active Track Detected'}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{session.topic}</h3>
              <p className="text-xs text-white/60 mt-1">
                {session.status === 'completed' 
                  ? `You completed all ${session.topic} concepts! Test your mastery with this final assessment.`
                  : `Generated from your checkpoint responses in ${session.topic}.`}
              </p>
            </div>
            <button
              onClick={() => loadSessionQuiz(session)}
              className="px-5 py-2.5 bg-[#22D3EE] text-black font-semibold text-[13px] rounded-xl hover:bg-[#22D3EE]/90 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              Start {session.topic} Quiz
            </button>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Topic & Skill Assessments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHOICES.map((c) => (
              <button
                key={c.id}
                onClick={() => startQuizWithConfig(c.params)}
                className="p-4 border border-white/10 rounded-xl bg-[#121212] hover:bg-white/5 hover:border-white/20 transition-all text-left text-[14px] text-white/80 hover:text-white cursor-pointer"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ─── STATE: GENERATING / LOADING ─────────────────────────────────────────────
  if (phase === 'generating') {
    return shell(
      <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center mb-6 animate-pulse">
          <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Preparing your personalized quiz...</h2>
        <p className="text-xs text-white/40 mb-6">{session ? `Adapting to "${session.topic}"` : 'Analyzing session'}</p>
      </div>
    );
  }

  // ─── STATE: RESULTS (Completion Screen) ──────────────────────────────────────
  if (phase === 'results') {
    const score = answers.filter((a) => a.correct).length;
    const totalQ = questions.length || 1;
    const pct = Math.round((score / totalQ) * 100);
    const breakdown = quizResults?.conceptBreakdown || [];
    const weakList = quizResults?.weakConcepts || [];

    return shell(
      <>
        <div className="mt-4 flex flex-col gap-1" role="status">
          <span className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase">Quiz complete</span>
          <h2 className="text-[37px] leading-[0.95] tracking-tight font-bold text-white">
            {score}/{totalQ} <span className="text-xl text-white/40 font-normal">({pct}%)</span>
          </h2>
          <p className="text-white/50 text-sm mt-2">
            {answers.length < totalQ
              ? 'Time ran out - unanswered questions count as incorrect.'
              : pct >= 80
              ? 'Excellent work.'
              : pct >= 50
              ? 'Solid. Review the misses below.'
              : 'Keep practising - review the explanations below.'}
          </p>
        </div>

        {/* Concept breakdown if available */}
        {breakdown.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#22D3EE]" /> Concept Mastery Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {breakdown.map((cb, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-white/80 truncate mr-2">{cb.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      cb.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : cb.score >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {cb.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Review List */}
        <ul className="flex flex-col gap-3">
          {questions.map((qq, i) => {
            const a = answers[i];
            return (
              <li key={qq.id || i} className="p-4 border border-white/10 rounded-xl bg-[#121212]">
                <div className="flex items-start gap-3">
                  {a?.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-[14px] text-white/90 mb-1">{qq.q}</p>
                    <p className="text-[12px] text-white/50">Answer: {qq.options[qq.answer]}</p>
                    <p className="text-[12px] text-white/40 mt-1">{qq.explanation}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Next Step / Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => (session ? loadSessionQuiz(session) : startQuizWithConfig(config))}
            className="px-6 py-2.5 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Retake
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="px-6 py-2.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-[13px] rounded-md transition-colors cursor-pointer"
          >
            Choose another quiz
          </button>
          <button
            onClick={() => (navigateTo ? navigateTo('dashboard/assignments') : null)}
            className="px-5 py-2.5 bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 hover:bg-[#22D3EE]/20 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
          >
            Start Assignment <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </>
    );
  }

  // ─── STATE: RUNNING (Interactive 1-Question UI) ─────────────────────────────
  const last = index + 1 >= questions.length;
  const isCorrect = picked === currentQ?.answer;

  return shell(
    <>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase">
          Question {index + 1} of {questions.length}
        </span>
        <span
          className={`text-[13px] ${remaining <= 30 ? 'text-[#F43F5E]' : 'text-white/50'}`}
          role="timer"
          aria-label="Time remaining"
        >
          {formatClock(remaining)} remaining
        </span>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">{currentQ.q}</h2>
        {currentQ.help && <p className="text-sm text-white/50 mb-8">{currentQ.help}</p>}
      </div>

      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Answer options">
        {currentQ.options.map((option, i) => {
          const isPicked = picked === i;
          const state = !submitted
            ? isPicked
              ? 'border-white/40 bg-white/5 text-white'
              : 'border-white/10 bg-[#121212] hover:bg-white/5 hover:border-white/20 text-white/80'
            : i === currentQ.answer
            ? 'border-[#10B981]/50 bg-[#10B981]/10 text-white'
            : isPicked
            ? 'border-[#F43F5E]/50 bg-[#F43F5E]/10 text-white'
            : 'border-white/10 bg-[#121212] opacity-60 text-white/40';

          return (
            <button
              key={i}
              role="radio"
              aria-checked={isPicked}
              disabled={submitted}
              onClick={() => setPicked(i)}
              className={`p-4 border rounded-xl transition-all flex items-center gap-4 group text-left cursor-pointer ${state}`}
            >
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/50 font-medium shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-[14px] group-hover:text-white leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div
          className={`p-4 rounded-xl border text-[13px] leading-relaxed ${
            picked === currentQ.answer ? 'border-[#10B981]/30 bg-[#10B981]/10 text-white/80' : 'border-[#F43F5E]/30 bg-[#F43F5E]/10 text-white/80'
          }`}
          role="status"
        >
          <strong className="text-white">{picked === currentQ.answer ? 'Correct.' : 'Not quite.'}</strong>{' '}
          {currentQ.explanation}
        </div>
      )}

      <div className="flex justify-end mt-4">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={picked === null}
            className="px-6 py-2.5 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={next}
            className="px-6 py-2.5 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            {last ? 'Finish Quiz' : 'Next Question'} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
}
