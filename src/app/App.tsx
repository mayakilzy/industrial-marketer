import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { NewSearch } from './components/NewSearch';
import { Leads } from './components/Leads';
import { Messages } from './components/Messages';
import { Competitors } from './components/Competitors';
import { GoldenSentence } from './components/GoldenSentence';
import { PDFAnalysis } from './components/PDFAnalysis';
import { APIKeys } from './components/APIKeys';
import { Settings } from './components/Settings';
import { C, FONTS } from './components/colors';
export type Page = 'dashboard'|'new-search'|'leads'|'messages'|'competitors'|'golden'|'pdf'|'api-keys'|'settings';
function renderPage(page: Page) {
  switch (page) {
    case 'dashboard':   return <Dashboard />;
    case 'new-search':  return <NewSearch />;
    case 'leads':       return <Leads />;
    case 'messages':    return <Messages />;
    case 'competitors': return <Competitors />;
    case 'golden':      return <GoldenSentence />;
    case 'pdf':         return <PDFAnalysis />;
    case 'api-keys':    return <APIKeys />;
    case 'settings':    return <Settings />;
  }
}
export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (isMobile) setSidebarOpen(false);
  };
  return (
    <div style={{ background: C.bgMain, minHeight: '100vh', fontFamily: FONTS.arabic, direction: 'rtl', color: C.textPrimary }}>
      <Toaster position="bottom-left" toastOptions={{ style: { background: '#0f1318', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e4dc', fontFamily: FONTS.arabic, fontSize: 13, direction: 'rtl' } }} />
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }} />
      )}
      {(!isMobile || sidebarOpen) && (
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      <Topbar currentPage={currentPage} isMobile={isMobile} onMenuToggle={() => setSidebarOpen(o => !o)} />
      <main style={{ marginRight: isMobile ? 0 : 260, marginTop: 56, minHeight: 'calc(100vh - 56px)', padding: isMobile ? 14 : 28, overflowX: 'hidden' }}>
        <div key={currentPage} style={{ animation: 'pageFadeIn 0.25s ease' }}>
          {renderPage(currentPage)}
        </div>
      </main>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: ${C.bgMain}; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bgMain}; }
        ::-webkit-scrollbar-thumb { background: rgba(200,168,75,0.25); border-radius: 3px; }
        @keyframes pageFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #555; }
        select option { background: #0f1318; color: #e8e4dc; }
      `}</style>
    </div>
  );
}
