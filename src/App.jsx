import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './store/AppStore';
import { useRoute } from './hooks/useRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Route-level code splitting: three.js (landing) and every page load on demand.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const PAGES = {
  dashboard: lazy(() => import('./pages/Dashboard')),
  'dashboard/chat': lazy(() => import('./pages/NewChat')),
  'dashboard/session': lazy(() => import('./pages/Session')),
  'dashboard/inbox': lazy(() => import('./pages/Inbox')),
  'dashboard/insights': lazy(() => import('./pages/Insights')),
  'dashboard/history': lazy(() => import('./pages/SessionHistory')),
  'dashboard/tutor': lazy(() => import('./pages/Tutor')),
  'dashboard/assignments': lazy(() => import('./pages/Assignments')),
  'dashboard/quiz': lazy(() => import('./pages/Quiz')),
  'dashboard/planner': lazy(() => import('./pages/Planner')),
  'dashboard/doubts': lazy(() => import('./pages/Doubts')),
  'dashboard/career': lazy(() => import('./pages/Career')),
};

const Loading = () => (
  <div className="w-full h-full min-h-screen flex items-center justify-center bg-black text-white/40 text-sm" role="status">Loading...</div>
);

function NotFound({ navigateTo }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-lg font-semibold text-white">Page not found</h2>
      <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90">Back to overview</button>
    </div>
  );
}

function Routes() {
  const { route, params, navigateTo, goBack } = useRoute();
  const { state } = useApp();

  if (route === 'auth') return <AuthPage navigateTo={navigateTo} />;
  if (route.startsWith('dashboard')) {
    if (!state.user) {
      return <AuthPage navigateTo={navigateTo} />;
    }
    const Page = PAGES[route];
    return (
      <DashboardLayout navigateTo={navigateTo} currentRoute={route}>
        <ErrorBoundary resetKey={route} onHome={() => navigateTo('dashboard')}>
          <Suspense fallback={<Loading />}>
            {Page ? <Page navigateTo={navigateTo} goBack={goBack} params={params} /> : <NotFound navigateTo={navigateTo} />}
          </Suspense>
        </ErrorBoundary>
      </DashboardLayout>
    );
  }
  return <LandingPage navigateTo={navigateTo} />;
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes />
        </Suspense>
      </ErrorBoundary>
    </AppProvider>
  );
}
