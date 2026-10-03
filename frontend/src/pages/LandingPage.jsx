import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Command, Brain, MessageSquare, Zap, Target, Layout, Sparkles } from 'lucide-react';
const Wormhole = lazy(() => import('../Wormhole'));

// Only link to sections that exist on this page
const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
];

export default function LandingPage({ navigateTo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(e.target)
      ) {
        closeMobileMenu();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') closeMobileMenu();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <main className="relative min-h-screen overflow-x-hidden font-sans antialiased text-white bg-black">
      <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 left-1/2 z-[51] w-full max-w-[1400px] -translate-x-1/2">
        <span className="absolute inset-y-0 left-0 w-px bg-white/15 mix-blend-difference lg:left-5"></span>
        <span className="absolute inset-y-0 right-0 w-px bg-white/15 mix-blend-difference lg:right-5"></span>
        <span className="absolute inset-y-0 left-px w-px bg-white/15 mix-blend-difference lg:left-7"></span>
        <span className="absolute inset-y-0 right-px w-px bg-white/15 mix-blend-difference lg:right-7"></span>
      </div>

      <header className="fixed top-3 left-0 right-0 z-50 transition-all duration-500">
        <nav className="relative mx-auto w-full max-w-[1344px] before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-white/10 after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-px after:bg-white/10 lg:w-[calc(100%-3.5rem)] bg-transparent backdrop-blur-[4px]">
          <div className="flex h-12 items-center justify-between px-5 transition-all duration-500">
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('landing'); }} className="flex items-center gap-2.5 group pl-2">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shrink-0">
                <Command className="w-5 h-5 text-black" />
              </div>
              <span className="font-semibold text-[17px] tracking-wide text-white">ConceptFlow</span>
            </a>

            <div className="hidden items-center gap-[4.5rem] md:flex">
              {NAV_LINKS.map(link => (
                <a key={link.href} href={link.href} className="text-xs transition-colors duration-300 relative group text-white/50 hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full bg-white"></span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => navigateTo('auth')} className="relative rounded-full p-[1px] group transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer bg-transparent border-none">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/20 to-white/90 rounded-full"></div>
                <div className="relative bg-black rounded-full h-8 px-5 flex items-center justify-center text-xs sm:text-sm font-semibold text-white whitespace-nowrap tracking-wide">
                  GET STARTED &gt;&gt;
                </div>
              </button>
            </div>

            <button
              ref={toggleBtnRef}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} className="md:hidden p-2 transition-colors duration-500 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm bg-transparent border-none"
              onClick={() => setMobileMenuOpen(prev => !prev)}
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
              )}
            </button>
          </div>

          <div
            ref={menuRef}
            className={`md:hidden absolute top-full left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
          >
            <div className="flex flex-col px-6 py-6 gap-4">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-base text-white/70 hover:text-white transition-colors duration-200 py-2 border-b border-white/5 last:border-b-0"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => navigateTo('auth')}
                className="mt-2 inline-flex items-center justify-center h-10 rounded-full bg-white text-black font-semibold text-sm tracking-wide hover:bg-gray-100 transition-colors"
              >
                GET STARTED
              </button>
            </div>
          </div>

          <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-20 size-3 -translate-x-1/2 -translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]"></span>
          <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 z-20 size-3 translate-x-1/2 -translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]"></span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 z-20 size-3 -translate-x-1/2 translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]"></span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 z-20 size-3 translate-x-1/2 translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]"></span>
        </nav>
      </header>

      <section id="about" className="relative min-h-screen flex flex-col justify-center items-start overflow-hidden bg-black">
        <div className="absolute inset-y-0 left-1/2 z-0 w-full max-w-[1344px] -translate-x-1/2 overflow-hidden sm:w-[calc(100%-2rem)] lg:w-[calc(100%-3.5rem)]">
          <div className="relative w-full h-full bg-black overflow-hidden">
            <Suspense fallback={null}><Wormhole /></Suspense>
          </div>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 py-28 sm:px-8 sm:py-32 lg:px-14 lg:py-40">
          <div className="mx-auto flex max-w-full flex-col items-center text-center">
            <h1 className="relative z-10 max-w-[22rem] text-balance text-center text-[clamp(2rem,9vw,2.5rem)] font-display leading-[1.0] text-white transition-all duration-1000 sm:max-w-none sm:text-[clamp(2rem,4.6vw,4.5rem)]">
              <span className="block sm:whitespace-nowrap">AI tutoring that thinks</span>
              <span className="block mt-2 bg-gradient-to-b from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent sm:whitespace-nowrap">
                at the concept level
              </span>
            </h1>

            <p className="relative z-0 mt-5 mb-0 max-w-[22rem] text-center text-sm leading-[1.8] text-white/90 sm:max-w-none sm:text-base lg:text-lg transition-all duration-700 delay-150">
              <span className="block sm:whitespace-nowrap">Resolve doubts mid-conversation without losing your place.</span>
              <span className="block sm:whitespace-nowrap mt-1">Branch into prerequisites, then resume right where you left off.</span>
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <button
                onClick={() => navigateTo('auth')}
                aria-label="REQUEST A DEMO"
                style={{ "--duration": 3, "--light-width": "110px", "--light-color": "#fafafa", "--border-width": "1px", isolation: "isolate" }}
                className="relative z-[3] overflow-hidden h-10 px-8 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 group/star-button rounded-full border border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
              >
                <div className="absolute inset-0 z-[-1] animate-star-beam" style={{ background: "linear-gradient(to right, transparent, var(--light-color), transparent)", width: "var(--light-width)", transformOrigin: "left", transform: "translateX(-100%)" }}></div>
                <div className="absolute z-[-1]" style={{ inset: "var(--border-width)", backgroundColor: "#000000", borderRadius: "inherit" }}></div>
                <div className="absolute inset-0 z-[-2]" style={{ backgroundColor: "#000000" }}></div>
                <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap text-white">
                  GET STARTED
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block"><path d="M11 17l5-5-5-5M18 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 z-10 hidden sm:block">
          <div className="mx-auto flex justify-center items-center gap-6 md:gap-12 text-xs md:text-sm text-white/50 font-medium px-4">
            <div className="flex items-center gap-2"><span className="text-white">10K+</span> Students</div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <div className="flex items-center gap-2"><span className="text-white">50K+</span> Concepts Taught</div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <div className="flex items-center gap-2"><span className="text-white">98%</span> Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-[1344px] mx-auto px-6 py-32 bg-black border-t border-white/5 lg:w-[calc(100%-3.5rem)]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">A new way to learn</h2>
          <p className="text-white/60">Built from the ground up for concept-level mastery.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Brain className="w-6 h-6 text-indigo-400" />, title: "Concept-Level AI", desc: "Our AI breaks down complex subjects into atomic concepts, ensuring you build a solid foundation." },
            { icon: <MessageSquare className="w-6 h-6 text-purple-400" />, title: "Socratic Method", desc: "Instead of just giving answers, ConceptFlow guides you to the solution through thoughtful questioning." },
            { icon: <Zap className="w-6 h-6 text-blue-400" />, title: "Instant Validation", desc: "Test your knowledge immediately with dynamically generated quizzes based on your conversation." },
            { icon: <Target className="w-6 h-6 text-emerald-400" />, title: "Personalized Paths", desc: "The curriculum adapts in real-time based on your strengths, weaknesses, and learning pace." },
            { icon: <Layout className="w-6 h-6 text-rose-400" />, title: "Visual Learning", desc: "Automatically generated diagrams and mind maps help you visualize relationships between topics." },
            { icon: <Sparkles className="w-6 h-6 text-amber-400" />, title: "Memory Retention", desc: "Spaced repetition algorithms ensure you never forget what you've learned." }
          ].map((feature, i) => (
            <div key={i} className="p-8 border border-white/5 bg-black/40 hover:bg-white/[0.02] backdrop-blur-sm transition-colors rounded-2xl group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 max-w-[1344px] mx-auto px-6 py-32 bg-black border-t border-white/5 lg:w-[calc(100%-3.5rem)]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How it works</h2>
          <p className="text-white/60">From absolute beginner to mastery in three steps.</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-12">
          {[
            { step: "01", title: "Define your goal", desc: "Tell ConceptFlow what you want to learn. Whether it's Quantum Physics or JavaScript basics, the AI creates a structured learning map." },
            { step: "02", title: "Engage in dialogue", desc: "Learn through active conversation. The AI acts as your personal tutor, explaining concepts and answering questions in real-time." },
            { step: "03", title: "Test your knowledge", desc: "Solidify your understanding with targeted challenges that ensure you've truly grasped the material before moving on." }
          ].map((item, i) => (
            <div key={i} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border border-white/10 bg-black flex items-center justify-center font-mono text-sm text-white/40 group-hover:text-white group-hover:border-white/30 transition-colors">
                  {item.step}
                </div>
                {i !== 2 && <div className="w-[1px] h-20 bg-gradient-to-b from-white/10 to-transparent mt-4"></div>}
              </div>
              <div className="pt-2 pb-8">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 max-w-[1344px] mx-auto px-6 py-32 text-center border-t border-white/5 bg-black lg:w-[calc(100%-3.5rem)]">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Start learning at the concept level</h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">Join thousands of students and professionals who are learning faster and retaining more with ConceptFlow AI.</p>
        <button
          onClick={() => navigateTo('auth')}
          style={{ "--duration": 3, "--light-width": "110px", "--light-color": "#fafafa", "--border-width": "1px", isolation: "isolate" }}
          className="relative z-[3] overflow-hidden h-12 px-10 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors group/star-button rounded-full border border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
        >
          <div className="absolute inset-0 z-[-1] animate-star-beam" style={{ background: "linear-gradient(to right, transparent, var(--light-color), transparent)", width: "var(--light-width)", transformOrigin: "left", transform: "translateX(-100%)" }}></div>
          <div className="absolute z-[-1]" style={{ inset: "var(--border-width)", backgroundColor: "#000000", borderRadius: "inherit" }}></div>
          <div className="absolute inset-0 z-[-2]" style={{ backgroundColor: "#000000" }}></div>
          <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap text-white">
            GET STARTED
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l5-5-5-5M18 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 bg-black">
        <div className="max-w-[1344px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 lg:w-[calc(100%-3.5rem)]">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Command className="w-4 h-4" />
            <span>© 2024 ConceptFlow AI. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
