import { useMemo, useState } from 'react';
import { MessageSquare, ThumbsUp, Search, CheckCircle2, BrainCircuit, ChevronDown, Send, ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { askTutor } from '../lib/tutorClient';
import { makeId, pluralize, timeAgo } from '../lib/format';
import Drawer from '../components/Drawer';

const FILTERS = [['all', 'All'], ['open', 'Open'], ['resolved', 'Resolved']];

/** Community Q&A wired to the shared store: search, filter, ask, reply, like, resolve. */
export default function Doubts({ goBack }) {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [replyText, setReplyText] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.doubts.filter((d) => (filter === 'all' || (filter === 'resolved') === d.resolved) && (!q || d.title.toLowerCase().includes(q) || d.author.toLowerCase().includes(q)));
  }, [state.doubts, query, filter]);

  const ask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const id = makeId('d');
    const t = title.trim();
    dispatch({ type: 'doubt/add', doubt: { id, title: t, details: details.trim(), author: state?.user?.name || 'Learner', at: new Date().toISOString(), resolved: false, likes: 0, liked: false, replies: [] } });
    setTitle(''); setDetails(''); setAskOpen(false); setExpanded(id);
    try {
      const body = await askTutor({ question: t, context: { title: t } });
      dispatch({ type: 'doubt/reply', id, reply: { id: makeId('r'), author: 'ConceptFlow Tutor', tutor: true, at: new Date().toISOString(), body } });
    } catch { /* tutor unavailable: thread stays open for peers */ }
  };

  const reply = (e, id) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    dispatch({ type: 'doubt/reply', id, reply: { id: makeId('r'), author: state?.user?.name || 'Learner', at: new Date().toISOString(), body: replyText.trim() } });
    setReplyText('');
  };

  return (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-sans">
      <header className="h-[60px] border-b border-[#37333b] flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack?.()} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="Go back" title="Go back"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-sm font-semibold text-white">Doubts & Discussions</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-4 sm:p-8 pb-12 flex flex-col gap-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-[28px] sm:text-[37px] leading-[0.95] tracking-tight font-bold text-white mb-3">Community QA</h2>
              <p className="text-base sm:text-lg text-white/50">Ask questions and learn from peers.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <label htmlFor="doubt-search" className="sr-only">Search discussions</label>
                <input id="doubt-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search discussions..." className="bg-[#121212] border border-white/10 rounded-md pl-9 pr-4 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 w-full sm:w-64 transition-colors" />
              </div>
              <button onClick={() => setAskOpen(true)} className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center justify-center gap-2">Ask Question</button>
            </div>
          </div>

          <div className="flex items-center gap-2" role="tablist" aria-label="Filter discussions">
            {FILTERS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${filter === id ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/50 hover:text-white'}`}>{label}</button>
            ))}
            <span className="ml-auto text-[12px] text-white/40" role="status">{pluralize(list.length, 'discussion')}</span>
          </div>

          <div className="flex flex-col gap-3">
            {list.length === 0 && <p className="text-center text-sm text-white/40 py-12">No discussions match. Try a different search or ask the first question.</p>}
            {list.map((d) => {
              const isOpen = expanded === d.id;
              return (
                <div key={d.id} className="border border-white/10 rounded-xl bg-[#09090b] hover:border-white/20 transition-all group">
                  <div className="flex items-start gap-2 p-5">
                    <button onClick={() => { setExpanded(isOpen ? null : d.id); setReplyText(''); }} aria-expanded={isOpen} className="flex-1 flex items-start gap-4 text-left min-w-0">
                      <span className="mt-1">{d.resolved ? <CheckCircle2 className="w-5 h-5 text-[#10B981]" aria-label="Resolved" /> : <MessageSquare className="w-5 h-5 text-white" aria-label="Open" />}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-medium text-white mb-2 group-hover:text-zinc-300 transition-colors">{d.title}</span>
                        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/40">
                          <span>Asked by <span className="text-white/70">{d.author}</span></span>
                          <span>{timeAgo(d.at)}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {pluralize(d.replies.length, 'reply', 'replies')}</span>
                        </span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-white/30 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={() => dispatch({ type: 'doubt/like', id: d.id })} aria-pressed={d.liked} aria-label={`Upvote (${d.likes})`} className={`p-2 flex items-center gap-1 text-[12px] transition-colors ${d.liked ? 'text-[#10B981]' : 'text-white/30 hover:text-[#10B981]'}`}>
                      <ThumbsUp className="w-4 h-4" /> {d.likes}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-white/5 p-5 flex flex-col gap-4">
                      {d.details && <p className="text-[13px] text-white/60">{d.details}</p>}
                      {d.replies.length === 0 && <p className="text-[13px] text-white/40">No replies yet. The tutor is on it, or add your own below.</p>}
                      {d.replies.map((r) => (
                        <div key={r.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-md bg-[#121212] border border-white/5 flex items-center justify-center shrink-0">{r.tutor ? <BrainCircuit className="w-3.5 h-3.5 text-zinc-300" /> : <span className="text-[11px] text-white/60">{r.author[0]}</span>}</div>
                          <div className="bg-[#121212] border border-white/5 rounded-lg p-3 text-[13px] text-white/70 leading-relaxed">
                            <div className="text-[11px] text-white/40 mb-1">{r.author} · {timeAgo(r.at)}</div>{r.body}
                          </div>
                        </div>
                      ))}
                      <form onSubmit={(e) => reply(e, d.id)} className="relative">
                        <label htmlFor={`reply-${d.id}`} className="sr-only">Write a reply</label>
                        <input id={`reply-${d.id}`} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="w-full bg-[#121212] border border-white/5 rounded-md pl-4 pr-12 py-2.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
                        <button type="submit" disabled={!replyText.trim()} aria-label="Send reply" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white disabled:opacity-40"><Send className="w-4 h-4" /></button>
                      </form>
                      <button onClick={() => dispatch({ type: 'doubt/resolve', id: d.id })} className="self-start px-3 py-1.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-[12px] rounded-md transition-colors">{d.resolved ? 'Reopen' : 'Mark as resolved'}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Drawer open={askOpen} onClose={() => setAskOpen(false)} title="Ask a Question" subtitle="The tutor replies first, peers can follow"
        icon={<div className="w-8 h-8 rounded-md bg-gradient-to-br from-white via-zinc-300 to-zinc-500 flex items-center justify-center shrink-0"><BrainCircuit className="w-4 h-4 text-black" /></div>}>
        <form onSubmit={ask} className="flex-1 flex flex-col p-6 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="q-title" className="text-[13px] font-medium text-white/70">Your question</label>
            <input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Why does gradient descent use a learning rate?" className="bg-[#121212] border border-white/10 rounded-lg p-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="q-details" className="text-[13px] font-medium text-white/70">Details (optional)</label>
            <textarea id="q-details" value={details} onChange={(e) => setDetails(e.target.value)} className="bg-[#121212] border border-white/10 rounded-lg p-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 min-h-[120px] resize-none" placeholder="What have you tried so far?" />
          </div>
          <button type="submit" disabled={!title.trim()} className="mt-auto px-6 py-3 bg-white text-black font-semibold rounded-lg text-[14px] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Post question</button>
        </form>
      </Drawer>
    </div>
  );
}
