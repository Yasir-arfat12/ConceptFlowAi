import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, Lock, PlayCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { learningApi } from '../lib/api';
import DoubtDrawer from '../components/DoubtDrawer';

/** Render **bold** and `code` inline without markdown dependencies. */
function Inline({ text }) {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i} className="text-white/90">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i} className="px-1 py-0.5 rounded bg-white/5 text-white/80 text-[0.9em] font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

<<<<<<< HEAD
/**
 * Learning session driven fully by PostgreSQL and Express backend APIs.
 * No localStorage persistence of learning data.
 * Concept progression and checkpoint scoring are evaluated and saved by the backend.
 */
export default function Session({ params, goBack }) {
  const sessionIdParam = params?.get('sessionId');
  const topicParam = params?.get('topic');

=======
/** Learning session driven by the requested topic. Progress persists, so learners resume where they stopped. */
export default function Session({ params, goBack, navigateTo }) {
  const topic = params?.get('topic') || 'Binary Search';
  const cur = useMemo(() => getCurriculum(topic), [topic]);
>>>>>>> 3b1961434419264a02cc7ee59af00f1510921fc9
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [currentConceptId, setCurrentConceptId] = useState(null);

  const [doubtOpen, setDoubtOpen] = useState(false);
  const [quickDoubt, setQuickDoubt] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Load or start session from backend
  useEffect(() => {
    let active = true;

<<<<<<< HEAD
    async function initSession() {
      try {
        setLoading(true);
        setError(null);

        let sessionData = null;

        if (sessionIdParam) {
          // 1. Load by sessionId
          const res = await learningApi.getSession(sessionIdParam);
          sessionData = res?.data || res;
        } else if (topicParam) {
          // 2. Check if user already has an active session for this topic
          try {
            const listRes = await learningApi.getSessions();
            const sessionsList = listRes?.data?.sessions || listRes?.sessions || [];
            const existing = sessionsList.find(
              (s) => s.topic?.toLowerCase().trim() === topicParam.toLowerCase().trim() && s.status === 'active'
            );

            if (existing) {
              const res = await learningApi.getSession(existing.id);
              sessionData = res?.data || res;
            } else {
              // 3. Create a new session in PostgreSQL
              const startRes = await learningApi.startSession(topicParam);
              const newSession = startRes?.data?.session || startRes?.session;
              const newConcepts = startRes?.data?.concepts || startRes?.concepts;
              if (newConcepts && newConcepts.length > 0) {
                sessionData = { session: newSession, concepts: newConcepts };
              } else if (newSession?.id) {
                const res = await learningApi.getSession(newSession.id);
                sessionData = res?.data || res;
              } else {
                sessionData = startRes?.data || startRes;
              }
            }
          } catch (createErr) {
            console.error('[Session] Error starting session:', createErr);
            throw createErr;
          }
        } else {
          // No sessionId or topic provided
          setError('No learning session specified. Please select a topic from the dashboard.');
          setLoading(false);
          return;
        }

        if (active && sessionData) {
          const loadedSession = sessionData.session || sessionData;
          const loadedConcepts = sessionData.concepts || [];
          setSession(loadedSession);
          setConcepts(loadedConcepts);

          // Find initial active concept
          const activeC =
            loadedConcepts.find((c) => c.status === 'active') ||
            loadedConcepts.find((c) => c.id === loadedSession.current_concept_id) ||
            loadedConcepts[0];

          if (activeC) {
            setCurrentConceptId(activeC.id);
          }
        }
      } catch (err) {
        if (active) {
          console.error('[Session] Load error:', err);
          setError(err.message || 'Failed to load learning session.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();
    return () => {
      active = false;
    };
  }, [sessionIdParam, topicParam]);

  // Current concept object
  const currentConcept = useMemo(() => {
    return concepts.find((c) => c.id === currentConceptId) || concepts[0] || null;
  }, [concepts, currentConceptId]);

  // Active checkpoint
  const currentCheckpoint = useMemo(() => {
    if (!currentConcept) return null;
    return currentConcept.checkpoints?.[0] || null;
  }, [currentConcept]);

  // Concept paragraphs
  const contentParagraphs = useMemo(() => {
    if (!currentConcept?.content) return [];
    if (Array.isArray(currentConcept.content)) return currentConcept.content;
    return currentConcept.content.split('\n\n').filter((p) => p.trim());
  }, [currentConcept]);

  // Concept examples
  const exampleLines = useMemo(() => {
    if (!currentConcept?.examples) return [];
    if (Array.isArray(currentConcept.examples)) return currentConcept.examples;
    return currentConcept.examples.split('\n').filter((l) => l.trim());
  }, [currentConcept]);

  // Submit checkpoint answer to backend
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentCheckpoint?.id || submitting) return;
    try {
      setSubmitting(true);
      setResult(null);

      const res = await learningApi.submitAnswer(currentCheckpoint.id, answer.trim());
      const data = res?.data || res;

      setResult({
        passed: data.passed || data.score >= (data.passScore || 60),
        score: data.score || 0,
        feedback: data.feedback || '',
        isCorrect: data.isCorrect || false,
        conceptCompleted: data.conceptCompleted,
        sessionCompleted: data.sessionCompleted,
        nextConceptId: data.nextConceptId,
      });

      // Reload fresh session from PostgreSQL to update unlocked/completed concept states
      if (session?.id) {
        const fresh = await learningApi.getSession(session.id);
        const freshData = fresh?.data || fresh;
        if (freshData?.concepts) {
          setConcepts(freshData.concepts);
          if (freshData.session) setSession(freshData.session);
        }
      }
    } catch (err) {
      console.error('[Session] Answer submission error:', err);
      setResult({
        passed: false,
        score: 0,
        feedback: err.message || 'Failed to submit answer. Please try again.',
        isCorrect: false,
      });
    } finally {
      setSubmitting(false);
=======
  const submit = () => setResult(gradeAnswer(answer, concept.checkpoint));
  const advance = () => {
    dispatch({ type: 'progress/set', key: cur.key, title: cur.title, total, done: step + 1 });
    if (step + 1 < total) { 
      setStep(step + 1); setAnswer(''); setResult(null); 
    } else {
      if (navigateTo) navigateTo('dashboard/tutor');
      else if (goBack) goBack();
>>>>>>> 3b1961434419264a02cc7ee59af00f1510921fc9
    }
  };

  // Advance to next concept
  const handleAdvance = () => {
    if (result?.nextConceptId) {
      setCurrentConceptId(result.nextConceptId);
      setAnswer('');
      setResult(null);
    } else {
      // Find next concept by order_index
      const currentIndex = concepts.findIndex((c) => c.id === currentConceptId);
      if (currentIndex >= 0 && currentIndex + 1 < concepts.length) {
        setCurrentConceptId(concepts[currentIndex + 1].id);
        setAnswer('');
        setResult(null);
      } else {
        // Last concept completed
        goBack?.();
      }
    }
  };

  // Switch active concept (only unlocked or completed)
  const handleSelectConcept = (c) => {
    if (c.status === 'locked') return;
    setCurrentConceptId(c.id);
    setAnswer('');
    setResult(null);
    setQuickDoubt('');
  };

  // Ask a doubt
  const submitQuickDoubt = async (e) => {
    e.preventDefault();
    if (!quickDoubt.trim()) return;
    const doubtText = quickDoubt.trim();
    setQuickDoubt('');
    setDoubtOpen(true);

    if (session?.id && currentConcept?.id) {
      try {
        await learningApi.askDoubt(session.id, currentConcept.id, doubtText);
      } catch {
        // Handled in DoubtDrawer fallback
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-white/70" />
        <span className="text-sm font-medium">Loading your learning session from database...</span>
      </div>
    );
  }

  if (error || !session || concepts.length === 0) {
    return (
      <div className="w-full h-full min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#121212] border border-white/10 flex items-center justify-center mb-4 text-[#F43F5E]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Learning Session Unavailable</h2>
        <p className="text-white/50 max-w-md text-sm mb-6">{error || 'Session could not be found in the database.'}</p>
        <button
          onClick={() => goBack?.()}
          className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isLastConcept = currentConcept && concepts[concepts.length - 1]?.id === currentConcept.id;
  const isFinished = result?.passed && isLastConcept;

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col md:flex-row relative overflow-hidden">
      {/* Sidebar: Concepts List */}
      <div className="md:w-[280px] border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0A0A] flex flex-col shrink-0 max-h-[40%] md:max-h-none">
        <div className="h-[60px] md:h-[72px] px-4 border-b border-white/5 flex items-center shrink-0 gap-3">
          <button
            onClick={() => goBack?.()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[11px] font-semibold tracking-wide text-white/40 uppercase mb-0.5">
              Learning Session
            </span>
            <h2 className="text-sm font-medium text-white truncate">{session.topic}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {concepts.map((c, i) => {
            const isCurrent = c.id === currentConceptId;
            const isCompleted = c.status === 'completed';
            const isLocked = c.status === 'locked';

            return (
              <button
                key={c.id || i}
                onClick={() => handleSelectConcept(c)}
                disabled={isLocked}
                aria-current={isCurrent ? 'step' : undefined}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-[#141414] border-white/10 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03] disabled:hover:bg-transparent'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />}
                  {isCurrent && !isCompleted && <PlayCircle className="w-4 h-4 text-white fill-white/20" aria-hidden="true" />}
                  {isLocked && <Lock className="w-4 h-4 text-white/20" aria-hidden="true" />}
                </span>
                <span className="flex flex-col min-w-0">
                  <span
                    className={`text-[13px] font-medium ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-white/70' : 'text-white/30'
                    }`}
                  >
                    Concept {c.order_index || i + 1}
                  </span>
                  <span
                    className={`text-[12px] truncate ${
                      isCurrent ? 'text-white/70' : isCompleted ? 'text-white/50' : 'text-white/30'
                    }`}
                  >
                    {c.title}
                  </span>
                  {c.score !== null && c.score !== undefined && (
                    <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">Score: {c.score}%</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Concept Learning Area */}
      <div className="flex-1 flex flex-col relative bg-[#050505] overflow-y-auto min-w-0">
        <header className="h-[60px] md:h-[72px] px-4 sm:px-10 flex items-center justify-between gap-3 border-b border-white/5 shrink-0 sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10">
          <h1 className="text-base sm:text-lg font-medium text-white truncate">
            {currentConcept?.title || 'Concept'}
          </h1>
          {session.progress_percentage !== undefined && (
            <span className="text-xs text-white/50 font-medium shrink-0">
              {session.progress_percentage}% completed
            </span>
          )}
        </header>

        <div className="max-w-3xl mx-auto w-full p-4 sm:p-10 pb-32">
          {/* Explanation */}
          <div className="mb-12">
            <h3 className="text-xl font-medium text-white mb-4">Explanation</h3>
            <div className="space-y-4 text-white/70 leading-relaxed">
              {contentParagraphs.map((p, i) => (
                <p key={i}>
                  <Inline text={p} />
                </p>
              ))}
            </div>

            {/* Example */}
            {exampleLines.length > 0 && (
              <>
                <h3 className="text-xl font-medium text-white mt-10 mb-4">Example</h3>
                <div className="bg-[#121212] border border-white/5 p-5 rounded-xl font-mono text-sm text-white/60 overflow-x-auto leading-relaxed">
                  {exampleLines.map((l, i) => (
                    <p key={i} className={i === 0 ? 'text-white/90 mb-2 font-semibold' : ''}>
                      {l}
                    </p>
                  ))}
                </div>
              </>
            )}

            {/* Key Takeaways */}
            {currentConcept?.key_takeaways && (
              <div className="mt-8 p-4 rounded-xl border border-white/5 bg-[#121212]/50">
                <h4 className="text-[12px] font-semibold text-white/50 uppercase tracking-widest mb-2">Key Takeaways</h4>
                <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                  {currentConcept.key_takeaways}
                </div>
              </div>
            )}

            {/* Quick Doubt Bar */}
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-medium text-white/40 uppercase tracking-widest">Still confused?</h4>
                <button
                  type="button"
                  onClick={() => setDoubtOpen(true)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Ask a Doubt
                </button>
              </div>
              <form
                onSubmit={submitQuickDoubt}
                className="flex items-center gap-3 bg-[#121212] border border-white/10 rounded-xl p-2 focus-within:border-white/20 focus-within:bg-[#161616] transition-colors"
              >
                <div className="pl-3">
                  <BrainCircuit className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={quickDoubt}
                  onChange={(e) => setQuickDoubt(e.target.value)}
                  placeholder={`Ask a doubt about ${currentConcept?.title || 'this concept'}...`}
                  className="flex-1 bg-transparent border-none text-[14px] text-white placeholder-white/30 focus:outline-none py-2"
                />
                <button
                  type="submit"
                  disabled={!quickDoubt.trim()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Ask
                </button>
              </form>
            </div>
          </div>

          {/* Checkpoint Question Section */}
          {currentCheckpoint && (
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-white via-zinc-300 to-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">Checkpoint Question</h3>
              <p className="text-white text-lg mb-6">{currentCheckpoint.question}</p>

              {!result?.passed ? (
                <div className="flex flex-col gap-4">
                  <label htmlFor="checkpoint-answer" className="sr-only">
                    Your answer
                  </label>
                  <textarea
                    id="checkpoint-answer"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setResult(null);
                    }}
                    placeholder="Type your explanation here..."
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-4 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all min-h-[120px] resize-none"
                  />
                  {result && !result.passed && (
                    <div
                      role="alert"
                      className="p-3 bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-lg text-sm text-[#F43F5E]"
                    >
                      {result.feedback}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!answer.trim() || submitting}
                      className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                        </>
                      ) : (
                        'Submit Answer'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex gap-4 items-start" role="status">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-emerald-500">Correct!</h4>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        Score: {result.score}/100
                      </span>
                    </div>
                    <p className="text-sm text-emerald-100/70 leading-relaxed mb-4">{result.feedback}</p>
                    {isFinished && (
                      <p className="text-sm text-emerald-200 font-medium mb-4">
                        Congratulations! You have completed every concept in {session.topic}.
                      </p>
                    )}
                    <button
                      onClick={handleAdvance}
                      className="px-5 py-2 bg-emerald-500 text-black font-medium text-sm rounded-md hover:bg-emerald-400 transition-colors cursor-pointer"
                    >
                      {isFinished ? 'Finish Session' : 'Continue to Next Concept'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Doubt Drawer */}
      <DoubtDrawer
        open={doubtOpen}
        onClose={() => setDoubtOpen(false)}
        subtitle={`Doubt Resolution · paused at Concept ${currentConcept?.order_index || currentIndex + 1}`}
        context={{ title: currentConcept?.title, topic: session.topic }}
      />
    </div>
  );
}
