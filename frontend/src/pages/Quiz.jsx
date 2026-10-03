import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, CheckCircle2, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { getQuiz, SKILLS } from '../lib/quizBank';
import { formatClock } from '../lib/format';
import { useApp } from '../store/AppStore';

const SECONDS_PER_QUESTION = 60;
const QUESTION_COUNT = 5;
const CHOICES = [
  { id: 'mixed', label: 'Mixed', params: {} },
  ...['python', 'ml', 'dl', 'data', 'dsa'].map((s) => ({ id: s, label: SKILLS[s], params: { skill: s } })),
];

/**
 * Quiz engine: setup -> running (timer, select, submit, feedback) -> results.
 * Results are saved to the store (Insights, Inbox notification, Career boost).
 */
export default function Quiz({ params, goBack }) {
  const { dispatch } = useApp();
  const initial = useMemo(() => ({ skill: params?.get('skill') || undefined, topic: params?.get('topic') || undefined }), [params]);
  const [phase, setPhase] = useState(initial.skill || initial.topic ? 'running' : 'setup');
  const [config, setConfig] = useState(initial);
  const [questions, setQuestions] = useState(() => (initial.skill || initial.topic ? getQuiz({ ...initial, count: QUESTION_COUNT }) : []));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [remaining, setRemaining] = useState(QUESTION_COUNT * SECONDS_PER_QUESTION);
  const endsAt = useRef(Date.now() + QUESTION_COUNT * SECONDS_PER_QUESTION * 1000);
  const startedAt = useRef(Date.now());
  const saved = useRef(false);

  const start = useCallback((cfg) => {
    const qs = getQuiz({ ...cfg, count: QUESTION_COUNT });
    setConfig(cfg); setQuestions(qs); setIndex(0); setPicked(null); setSubmitted(false); setAnswers([]); saved.current = false;
    const total = qs.length * SECONDS_PER_QUESTION;
    setRemaining(total); startedAt.current = Date.now(); endsAt.current = Date.now() + total * 1000;
    setPhase('running');
  }, []);

  const finish = useCallback((finalAnswers) => {
    setPhase('results');
    if (saved.current) return;
    saved.current = true;
    const score = finalAnswers.filter((a) => a.correct).length;
    const label = config.skill ? SKILLS[config.skill] : config.topic || 'Mixed';
    dispatch({ type: 'quiz/record', result: { id: `r_${Date.now()}`, at: new Date().toISOString(), skill: config.skill || null, label, score, total: questions.length, durationSec: Math.round((Date.now() - startedAt.current) / 1000) } });
  }, [config, dispatch, questions.length]);

  // Countdown based on a deadline so throttled tabs stay accurate.
  const answersRef = useRef(answers); answersRef.current = answers;
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) finish(answersRef.current);
    };
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [phase, finish]);

  const q = questions[index];
  const submit = useCallback(() => { if (picked !== null) setSubmitted(true); }, [picked]);
  const next = useCallback(() => {
    const updated = [...answers, { id: q.id, picked, correct: picked === q.answer }];
    setAnswers(updated);
    if (index + 1 >= questions.length) { finish(updated); return; }
    setIndex(index + 1); setPicked(null); setSubmitted(false);
  }, [answers, finish, index, picked, q, questions.length]);

  // Keyboard: A-D picks an option, Enter submits / continues.
  useEffect(() => {
    if (phase !== 'running' || !q) return undefined;
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const n = 'abcd'.indexOf(e.key.toLowerCase());
      if (n >= 0 && n < q.options.length && !submitted) setPicked(n);
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') (submitted ? next : submit)();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, submitted, next, submit]);

  const shell = (children) => (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-sans">
      <header className="h-[60px] border-b border-[#37333b] flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goBack?.()} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">Quiz Engine</h1>
        </div>
      </header>
      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-4 sm:p-8 pb-12 flex flex-col gap-6 max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>
      </div>
    </div>
  );

  if (phase === 'setup') {
    return shell(
      <>
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose a quiz</h2>
          <p className="text-sm text-white/50">{QUESTION_COUNT} questions, {SECONDS_PER_QUESTION}s each. Your score raises the matching skill in Career.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHOICES.map((c) => (
            <button key={c.id} onClick={() => start(c.params)} className="p-4 border border-white/10 rounded-xl bg-[#121212] hover:bg-white/5 hover:border-white/20 transition-all text-left text-[14px] text-white/80 hover:text-white">{c.label}</button>
          ))}
        </div>
      </>,
    );
  }

  if (phase === 'results') {
    const score = answers.filter((a) => a.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    return shell(
      <>
        <div className="mt-8 flex flex-col gap-1" role="status">
          <span className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase">Quiz complete</span>
          <h2 className="text-[37px] leading-[0.95] tracking-tight font-bold text-white">{score}/{questions.length} <span className="text-xl text-white/40 font-normal">({pct}%)</span></h2>
          <p className="text-white/50 text-sm mt-2">{answers.length < questions.length ? 'Time ran out - unanswered questions count as incorrect.' : pct >= 80 ? 'Excellent work.' : pct >= 50 ? 'Solid. Review the misses below.' : 'Keep practising - review the explanations below.'}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {questions.map((qq, i) => {
            const a = answers[i];
            return (
              <li key={qq.id} className="p-4 border border-white/10 rounded-xl bg-[#121212]">
                <div className="flex items-start gap-3">
                  {a?.correct ? <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" /> : <XCircle className="w-5 h-5 text-[#F43F5E] shrink-0" />}
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
        <div className="flex flex-wrap gap-3">
          <button onClick={() => start(config)} className="px-6 py-2.5 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Retake</button>
          <button onClick={() => setPhase('setup')} className="px-6 py-2.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-[13px] rounded-md transition-colors">Choose another quiz</button>
        </div>
      </>,
    );
  }

  const last = index + 1 >= questions.length;
  return shell(
    <>
      <div className="flex items-center justify-between mt-8">
        <span className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase">Question {index + 1} of {questions.length}</span>
        <span className={`text-[13px] ${remaining <= 30 ? 'text-[#F43F5E]' : 'text-white/50'}`} role="timer" aria-label="Time remaining">{formatClock(remaining)} remaining</span>
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">{q.q}</h2>
        <p className="text-sm text-white/50 mb-8">{q.help}</p>
      </div>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Answer options">
        {q.options.map((option, i) => {
          const isPicked = picked === i;
          const state = !submitted ? (isPicked ? 'border-white/40 bg-white/5' : 'border-white/10 bg-[#121212] hover:bg-white/5 hover:border-white/20')
            : i === q.answer ? 'border-[#10B981]/50 bg-[#10B981]/10' : isPicked ? 'border-[#F43F5E]/50 bg-[#F43F5E]/10' : 'border-white/10 bg-[#121212] opacity-60';
          return (
            <button key={i} role="radio" aria-checked={isPicked} disabled={submitted} onClick={() => setPicked(i)}
              className={`p-4 border rounded-xl transition-all flex items-center gap-4 group text-left ${state}`}>
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/50 font-medium shrink-0">{String.fromCharCode(65 + i)}</span>
              <span className="text-[14px] text-white/80 group-hover:text-white">{option}</span>
            </button>
          );
        })}
      </div>
      {submitted && (
        <div className={`p-4 rounded-xl border text-[13px] leading-relaxed ${picked === q.answer ? 'border-[#10B981]/30 bg-[#10B981]/10 text-white/80' : 'border-[#F43F5E]/30 bg-[#F43F5E]/10 text-white/80'}`} role="status">
          <strong className="text-white">{picked === q.answer ? 'Correct.' : 'Not quite.'}</strong> {q.explanation}
        </div>
      )}
      <div className="flex justify-end mt-4">
        {!submitted ? (
          <button onClick={submit} disabled={picked === null} className="px-6 py-2.5 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Submit Answer</button>
        ) : (
          <button onClick={next} className="px-6 py-2.5 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center gap-2">{last ? 'Finish Quiz' : 'Next Question'} <ChevronRight className="w-4 h-4" /></button>
        )}
      </div>
    </>,
  );
}
