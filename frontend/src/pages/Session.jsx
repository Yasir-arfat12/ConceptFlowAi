import { useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, Lock, PlayCircle, ArrowLeft } from 'lucide-react';
import { getCurriculum, gradeAnswer } from '../lib/curriculum';
import { useApp } from '../store/AppStore';
import DoubtDrawer from '../components/DoubtDrawer';

/** Render **bold** and `code` inline without a markdown dependency (replaces the missing `prose` plugin classes). */
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i} className="text-white/90">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i} className="px-1 py-0.5 rounded bg-white/5 text-white/80 text-[0.9em] font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

/** Learning session driven by the requested topic. Progress persists, so learners resume where they stopped. */
export default function Session({ params, goBack, navigateTo }) {
  const topic = params?.get('topic') || 'Binary Search';
  const cur = useMemo(() => getCurriculum(topic), [topic]);
  const { state, dispatch } = useApp();
  const saved = state.progress[cur.key]?.done ?? 0;
  const total = cur.concepts.length;
  const [step, setStep] = useState(Math.min(saved, total - 1));
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [quickDoubt, setQuickDoubt] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);

  const concept = cur.concepts[step];
  const finished = saved >= total;
  const statusOf = (i) => (i < saved || (finished && i <= step) ? 'completed' : i === step ? 'active' : 'locked');

  const submit = () => setResult(gradeAnswer(answer, concept.checkpoint));
  const advance = () => {
    dispatch({ type: 'progress/set', key: cur.key, title: cur.title, total, done: step + 1 });
    if (step + 1 < total) { 
      setStep(step + 1); setAnswer(''); setResult(null); 
    } else {
      if (navigateTo) navigateTo('dashboard/tutor');
      else if (goBack) goBack();
    }
  };
  const open = (i) => { if (statusOf(i) !== 'locked') { setStep(i); setAnswer(''); setResult(null); setQuickDoubt(''); } };
  const lastDone = result?.passed && step + 1 >= total;

  const submitQuickDoubt = (e) => {
    e.preventDefault();
    if (!quickDoubt.trim()) return;
    dispatch({
      type: 'doubts/ask',
      doubt: {
        id: Math.random().toString(36).substring(2, 9),
        title: quickDoubt,
        author: state.user?.name || 'You',
        at: new Date().toISOString(),
        context: { title: concept.title, topic: cur.title },
        replies: [{
          id: Math.random().toString(36).substring(2, 9),
          author: 'ConceptFlow Tutor',
          tutor: true,
          body: `I'm analyzing your doubt about "${concept.title}". Here's what you need to know...`,
          at: new Date().toISOString()
        }],
        resolved: false
      }
    });
    setQuickDoubt('');
    setDoubtOpen(true);
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col md:flex-row relative overflow-hidden">
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
            <span className="text-[11px] font-semibold tracking-wide text-white/40 uppercase mb-0.5">Learning Session</span>
            <h2 className="text-sm font-medium text-white truncate">{cur.title}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cur.concepts.map((c, i) => {
            const status = statusOf(i);
            return (
              <button key={c.title} onClick={() => open(i)} disabled={status === 'locked'} aria-current={status === 'active' ? 'step' : undefined}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border ${status === 'active' ? 'bg-[#141414] border-white/10 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/[0.03] disabled:hover:bg-transparent'}`}>
                <span className="mt-0.5 shrink-0">
                  {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />}
                  {status === 'active' && <PlayCircle className="w-4 h-4 text-white fill-white/20" aria-hidden="true" />}
                  {status === 'locked' && <Lock className="w-4 h-4 text-white/20" aria-hidden="true" />}
                </span>
                <span className="flex flex-col">
                  <span className={`text-[13px] font-medium ${status === 'active' ? 'text-white' : status === 'completed' ? 'text-white/70' : 'text-white/30'}`}>Concept {i + 1}</span>
                  <span className={`text-[12px] ${status === 'active' ? 'text-white/70' : status === 'completed' ? 'text-white/50' : 'text-white/30'}`}>{c.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-[#050505] overflow-y-auto min-w-0">
        <header className="h-[60px] md:h-[72px] px-4 sm:px-10 flex items-center gap-3 border-b border-white/5 shrink-0 sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10">
          <h1 className="text-base sm:text-lg font-medium text-white truncate">{concept.title}</h1>
        </header>

        <div className="max-w-3xl mx-auto w-full p-4 sm:p-10 pb-32">
          <div className="mb-12">
            <h3 className="text-xl font-medium text-white mb-4">Explanation</h3>
            <div className="space-y-4 text-white/70 leading-relaxed">{concept.body.map((p, i) => <p key={i}><Inline text={p} /></p>)}</div>
            {concept.example && (
              <>
                <h3 className="text-xl font-medium text-white mt-10 mb-4">Example</h3>
                <div className="bg-[#121212] border border-white/5 p-5 rounded-xl font-mono text-sm text-white/60 overflow-x-auto">
                  {concept.example.map((l, i) => <p key={i} className={`${i === 0 ? 'mb-2' : ''} ${i === 1 ? 'text-white/90 mb-3' : ''}`}>{l}</p>)}
                </div>
              </>
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
              <form onSubmit={submitQuickDoubt} className="flex items-center gap-3 bg-[#121212] border border-white/10 rounded-xl p-2 focus-within:border-white/20 focus-within:bg-[#161616] transition-colors">
                <div className="pl-3">
                  <BrainCircuit className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                </div>
                <input 
                  type="text" 
                  value={quickDoubt}
                  onChange={(e) => setQuickDoubt(e.target.value)}
                  placeholder={`Ask a doubt about ${concept.title}...`}
                  className="flex-1 bg-transparent border-none text-[14px] text-white placeholder-white/30 focus:outline-none py-2"
                />
                <button type="submit" disabled={!quickDoubt.trim()} className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors">
                  Ask
                </button>
              </form>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-white via-zinc-300 to-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">Checkpoint Question</h3>
            <p className="text-white text-lg mb-6">{concept.checkpoint.question}</p>

            {!result?.passed ? (
              <div className="flex flex-col gap-4">
                <label htmlFor="checkpoint" className="sr-only">Your answer</label>
                <textarea id="checkpoint" value={answer} onChange={(e) => { setAnswer(e.target.value); setResult(null); }} placeholder="Type your explanation here..."
                  className="w-full bg-[#121212] border border-white/10 rounded-xl p-4 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all min-h-[120px] resize-none" />
                {result && <p className="text-sm text-[#F43F5E]/90" role="alert">{result.feedback}</p>}
                <div className="flex justify-end">
                  <button onClick={submit} disabled={!answer.trim()} className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50">Submit Answer</button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex gap-4 items-start" role="status">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-emerald-500">Correct!</h4>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Score: {result.score}/100</span>
                  </div>
                  <p className="text-sm text-emerald-100/70 leading-relaxed mb-4">{result.feedback}</p>
                  {lastDone && <p className="text-sm text-emerald-100/70 mb-4">You finished every concept in {cur.title}.</p>}
                  <button onClick={advance} className="px-5 py-2 bg-emerald-500 text-black font-medium text-sm rounded-md hover:bg-emerald-400 transition-colors">{lastDone ? 'Finish Session' : 'Continue to Next Concept'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DoubtDrawer open={doubtOpen} onClose={() => setDoubtOpen(false)} subtitle={`Doubt Resolution · paused at Concept ${step + 1}`} context={{ title: concept.title, topic: cur.title }} />
    </div>
  );
}
