import { useMemo, useState } from 'react';
import { Clock, TrendingUp, Minus, Search, Calendar, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { formatDate, formatMinutes } from '../lib/format';

const RANGES = [['7', 'Last 7 Days'], ['30', 'Last 30 Days'], ['all', 'All time']];

/** Session history from the shared log with working search + date range. */
export default function SessionHistory({ goBack }) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('30');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * 86_400_000;
    return [...state.sessions]
      .filter((s) => new Date(s.at).getTime() >= cutoff && (!q || `${s.topic} ${s.subject}`.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [state.sessions, query, range]);

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col">
      <header className="min-h-[72px] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goBack?.()} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-medium text-white tracking-tight">Session History</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <label htmlFor="hist-search" className="sr-only">Search sessions</label>
            <input id="hist-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sessions..." className="w-full sm:w-64 bg-[#121212] border border-white/5 rounded-md pl-9 pr-4 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all" />
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="relative flex items-center gap-2 px-3 py-2 bg-[#121212] border border-white/5 rounded-md text-[13px] text-white/70 hover:bg-[#1A1A1A] transition-all">
            <Calendar className="w-4 h-4" />
            <label htmlFor="hist-range" className="sr-only">Date range</label>
            <select id="hist-range" value={range} onChange={(e) => setRange(e.target.value)} className="bg-transparent text-white/70 focus:outline-none cursor-pointer">
              {RANGES.map(([v, l]) => <option key={v} value={v} className="bg-[#121212]">{l}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto bg-[#0A0A0A] border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#050505]">
                {['Date', 'Topic', 'Duration', 'Mastery Gain', 'Status'].map((h) => <th key={h} scope="col" className="px-6 py-4 text-[12px] font-medium text-white/40 uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] text-white/70">{formatDate(s.at)}</td>
                  <td className="px-6 py-4"><div className="flex flex-col"><span className="text-[14px] font-medium text-white/90">{s.topic}</span><span className="text-[12px] text-white/40">{s.subject}</span></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2 text-[13px] text-white/70"><Clock className="w-3.5 h-3.5 text-white/40" />{formatMinutes(s.minutes)}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.gain > 0 ? <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-500"><TrendingUp className="w-3.5 h-3.5" />+{s.gain}%</div> : <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/40"><Minus className="w-3.5 h-3.5" />0%</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.status === 'completed'
                      ? <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" />Completed</div>
                      : <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-full w-fit border border-white/10"><XCircle className="w-3.5 h-3.5" />Abandoned</div>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-white/40">No sessions match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
