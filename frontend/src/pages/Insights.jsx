import { useMemo } from 'react';
import { Flame, Clock, Target, MessageSquare, ArrowLeft } from 'lucide-react';
import { useApp, deriveStats } from '../store/AppStore';
import { CAREER_SKILLS, careerMetrics } from '../lib/career';
import { formatShortDate, toDayKey } from '../lib/format';

/** New: progress tracking dashboard built from the real activity log. */
export default function Insights({ goBack }) {
  const { state } = useApp();
  const stats = deriveStats(state);
  const m = careerMetrics(state.boost);
  const week = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString();
      const minutes = state.sessions.filter((s) => toDayKey(s.at) === toDayKey(d)).reduce((a, s) => a + s.minutes, 0);
      out.push({ key: toDayKey(d), label: new Date(d).toLocaleDateString('en-US', { weekday: 'short' }), minutes });
    }
    return out;
  }, [state.sessions]);
  const max = Math.max(60, ...week.map((d) => d.minutes));
  const avg = state.quizResults.length ? Math.round(state.quizResults.reduce((a, r) => a + (r.score / r.total) * 100, 0) / state.quizResults.length) : null;
  const resolved = state.doubts.filter((d) => d.resolved).length;
  const cards = [
    { icon: Flame, color: 'text-[#EAB308]', label: 'Current streak', value: `${stats.streak} days` },
    { icon: Clock, color: 'text-[#06B6D4]', label: 'Time learned', value: `${stats.hours} hrs` },
    { icon: Target, color: 'text-[#10B981]', label: 'Avg quiz score', value: avg === null ? '--' : `${avg}%` },
    { icon: MessageSquare, color: 'text-zinc-100', label: 'Doubts resolved', value: resolved },
  ];
  return (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-sans">
      <header className="h-[60px] border-b border-[#37333b] flex items-center px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack?.()} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="Go back" title="Go back"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-sm font-semibold text-white">Insights</h1>
        </div>
      </header>
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="p-4 sm:p-8 pb-12 flex flex-col gap-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h2 className="text-[28px] sm:text-[37px] leading-[0.95] tracking-tight font-bold text-white mb-3">Your progress</h2>
            <p className="text-base sm:text-lg text-white/50">Live numbers from your sessions, quizzes and doubts.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-white/10 bg-[#09090b] p-5">
                <c.icon className={`w-5 h-5 ${c.color} mb-4`} />
                <div className="text-[13px] text-white/50 font-medium mb-1">{c.label}</div>
                <div className="text-[24px] sm:text-[28px] leading-none font-bold text-white tracking-tight">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="border border-white/10 rounded-xl bg-[#09090b] p-6">
            <h3 className="text-[15px] font-semibold text-white mb-6">Minutes studied, last 7 days</h3>
            <div className="flex items-end gap-3 h-40" role="img" aria-label={`Study minutes per day: ${week.map((d) => `${d.label} ${d.minutes}`).join(', ')}`}>
              {week.map((d) => (
                <div key={d.key} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                  <span className="text-[11px] text-white/50">{d.minutes || ''}</span>
                  <div className="w-full bg-[#06B6D4]/60 rounded-t-sm transition-all duration-500" style={{ height: `${(d.minutes / max) * 100}%`, minHeight: d.minutes ? 4 : 0 }} />
                  <span className="text-[11px] text-white/40">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-xl bg-[#09090b] p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Skill mastery</h3>
              <div className="space-y-4">
                {CAREER_SKILLS.map((s) => (
                  <div key={s.id}>
                    <div className="flex justify-between text-[13px] mb-1.5"><span className="text-white/80">{s.name}</span><span className="text-white/40">{m.levels[s.id]}%</span></div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${s.color} rounded-full`} style={{ width: `${m.levels[s.id]}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-white/10 rounded-xl bg-[#09090b] p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Recent quizzes</h3>
              {state.quizResults.length === 0 ? <p className="text-[13px] text-white/40">No quizzes yet. Take one from the Quiz page.</p> : (
                <ul className="flex flex-col gap-3">
                  {state.quizResults.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-[13px]"><span className="text-white/80">{r.label}</span><span className="text-white/40">{r.score}/{r.total} · {formatShortDate(r.at)}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
