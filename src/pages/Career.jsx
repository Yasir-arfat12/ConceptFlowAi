import { useMemo, useState } from 'react';
import { TrendingUp, Award, Target, Star, Briefcase, ChevronDown, CheckCircle2, Circle, Lock, Clock, Play, ArrowLeft } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { CAREER_SKILLS, CERTIFICATIONS, MILESTONES, JOBS, TRACK, careerMetrics, jobMatch, subLevel } from '../lib/career';
import Drawer from '../components/Drawer';

/**
 * Career: every number is derived from skill levels (which quiz results raise),
 * so Track Progress, Verified Skills and Readiness always agree. Adds skill
 * drill-down, a "next best step" gap card, roadmap, certifications and job matches.
 */
export default function Career({ navigateTo, goBack }) {
  const { state } = useApp();
  const m = useMemo(() => careerMetrics(state.boost), [state.boost]);
  const [open, setOpen] = useState(null);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [saved, setSaved] = useState([]);
  const stats = [
    { icon: Target, color: 'text-[#06B6D4]', label: 'Track Progress', value: `${m.trackProgress}%` },
    { icon: Award, color: 'text-[#10B981]', label: 'Certifications', value: m.certs },
    { icon: Star, color: 'text-[#EAB308]', label: 'Skills Verified', value: `${m.verified}/${m.totalSubs}` },
    { icon: TrendingUp, color: 'text-[#F43F5E]', label: 'Readiness Score', value: `${m.readiness}/100` },
  ];
  const quizPath = (s) => `dashboard/quiz?skill=${s.id}&topic=${encodeURIComponent(s.topic)}`;
  const jobs = JOBS.map((j) => ({ ...j, ...jobMatch(j, m.levels) })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden font-sans">
      <header className="h-[60px] border-b border-[#37333b] flex items-center justify-between px-4 sm:px-8 bg-transparent z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack?.()} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="Go back" title="Go back"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-sm font-semibold text-white">Career Path</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="p-4 sm:p-8 pb-12 flex flex-col gap-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[28px] sm:text-[37px] leading-[0.95] tracking-tight font-bold text-white mb-3">{TRACK.title}</h2>
              <p className="text-base sm:text-lg text-white/50">Track your progress toward your career goals.</p>
            </div>
            <button onClick={() => setJobsOpen(true)} className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors flex items-center justify-center gap-2 self-start">
              <Briefcase className="w-4 h-4" /> View Jobs
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col">
                <s.icon className={`w-5 h-5 ${s.color} mb-4`} />
                <div className="text-[13px] text-white/50 font-medium mb-1">{s.label}</div>
                <div className="text-[24px] sm:text-[28px] leading-none font-bold text-white tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#09090b] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase mb-1">Next best step</div>
              <p className="text-[14px] text-white/80">Your biggest gap is <strong className="text-white">{m.weakest.name}</strong> at {m.levels[m.weakest.id]}%. A short quiz raises it and moves your readiness score.</p>
            </div>
            <button onClick={() => navigateTo(quizPath(m.weakest))} className="px-4 py-2 border border-white/10 text-white/80 hover:text-white hover:bg-white/5 text-[13px] rounded-md transition-colors flex items-center gap-2 shrink-0"><Play className="w-3.5 h-3.5" /> Practice now</button>
          </div>

          <div className="border border-white/10 rounded-xl bg-[#09090b] p-6">
            <h3 className="text-[15px] font-semibold text-white mb-6">Skill Matrix</h3>
            <div className="space-y-4">
              {CAREER_SKILLS.map((s) => {
                const level = m.levels[s.id];
                const expanded = open === s.id;
                return (
                  <div key={s.id} className="flex flex-col gap-2">
                    <button onClick={() => setOpen(expanded ? null : s.id)} aria-expanded={expanded} className="flex flex-col gap-2 text-left group">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-white/80 group-hover:text-white flex items-center gap-2"><ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />{s.name}</span>
                        <span className="text-white/40">{level}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={level} aria-valuemin={0} aria-valuemax={100} aria-label={s.name}>
                        <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${level}%` }} />
                      </div>
                    </button>
                    {expanded && (
                      <div className="mt-2 ml-5 p-4 rounded-lg border border-white/5 bg-[#121212] flex flex-col gap-3">
                        {s.subs.map(([name, base]) => {
                          const v = subLevel(base, state.boost[s.id] || 0);
                          return (
                            <div key={name} className="flex items-center justify-between text-[12px]">
                              <span className="text-white/70 flex items-center gap-2">{v >= 70 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Circle className="w-3.5 h-3.5 text-white/20" />}{name}</span>
                              <span className="text-white/40">{v}%</span>
                            </div>
                          );
                        })}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => navigateTo(quizPath(s))} className="px-3 py-1.5 bg-white text-black text-[12px] font-semibold rounded-md hover:bg-white/90 transition-colors">Practice quiz</button>
                          <button onClick={() => navigateTo(`dashboard/session?topic=${encodeURIComponent(s.topic)}`)} className="px-3 py-1.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-[12px] rounded-md transition-colors">Learn</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-xl bg-[#09090b] p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Roadmap</h3>
              <ol className="flex flex-col gap-3">
                {MILESTONES.map((ms) => {
                  const done = m.levels[ms.skill] >= ms.need;
                  return (
                    <li key={ms.name} className="flex items-center gap-3 text-[13px]">
                      {done ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> : <Circle className="w-4 h-4 text-white/20" />}
                      <span className={done ? 'text-white/50 line-through' : 'text-white/80'}>{ms.name}</span>
                      {!done && <span className="ml-auto text-[11px] text-white/40">needs {ms.need}%</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="border border-white/10 rounded-xl bg-[#09090b] p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Certifications</h3>
              <ul className="flex flex-col gap-3">
                {CERTIFICATIONS.map((c) => (
                  <li key={c.name} className="flex items-center gap-3 text-[13px]">
                    {c.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> : c.status === 'in-progress' ? <Clock className="w-4 h-4 text-[#EAB308]" /> : <Lock className="w-4 h-4 text-white/20" />}
                    <span className={c.status === 'locked' ? 'text-white/30' : 'text-white/80'}>{c.name}</span>
                    <span className="ml-auto text-[11px] text-white/40 capitalize">{c.status.replace('-', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={jobsOpen} onClose={() => setJobsOpen(false)} title="Matching roles" subtitle="Based on your current skill levels"
        icon={<div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-white/70" /></div>}>
        <ul className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {jobs.map((j) => (
            <li key={j.id} className="p-4 rounded-xl border border-white/10 bg-[#121212]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-[14px] font-medium text-white">{j.title}</h4>
                  <p className="text-[12px] text-white/40">{j.company}</p>
                </div>
                <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full border ${j.pct >= 70 ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : 'text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20'}`}>{j.pct}% match</span>
              </div>
              <p className="text-[12px] text-white/50 mt-2">{j.gaps.length ? `Skills to improve: ${j.gaps.map((g) => CAREER_SKILLS.find((s) => s.id === g).name).join(', ')}` : 'You meet the skill bar for this role.'}</p>
              <button onClick={() => setSaved((s) => (s.includes(j.id) ? s.filter((x) => x !== j.id) : [...s, j.id]))} aria-pressed={saved.includes(j.id)} className="mt-3 text-[12px] text-white/60 hover:text-white transition-colors">{saved.includes(j.id) ? 'Saved' : 'Save role'}</button>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}
