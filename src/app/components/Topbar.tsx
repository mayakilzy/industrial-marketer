import React, { useState, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import { C, FONTS } from './colors';
type Page = 'dashboard'|'new-search'|'leads'|'messages'|'competitors'|'golden'|'pdf'|'api-keys'|'settings';
const pageNames: Record<Page, string> = {
  'dashboard':'لوحة التحكم','new-search':'بحث جديد','leads':'المستوردون',
  'messages':'الرسائل','competitors':'تحليل المنافسين','golden':'الجملة الذهبية',
  'pdf':'تحليل PDF','api-keys':'مفاتيح API','settings':'الإعدادات',
};
interface TopbarProps { currentPage: Page; isMobile?: boolean; onMenuToggle?: () => void; }
interface Profile { name: string; email: string; company: string; theme: string; }
function getInitial(name: string, email: string): string {
  if (name?.trim()) return name.trim()[0].toUpperCase();
  if (email?.trim()) return email.trim()[0].toUpperCase();
  return 'U';
}
export function Topbar({ currentPage, isMobile, onMenuToggle }: TopbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [profile, setProfile] = useState<Profile>({ name:'', email:'', company:'', theme:'dark' });
  useEffect(() => {
    const stored = localStorage.getItem('im_profile');
    if (stored) { try { setProfile(JSON.parse(stored)); } catch {} }
    const handler = (e: Event) => { const d = (e as CustomEvent).detail as Profile; if (d) setProfile(d); };
    window.addEventListener('profileUpdated', handler);
    return () => window.removeEventListener('profileUpdated', handler);
  }, []);
  const displayName = profile.company || profile.name || 'Industrial Marketer';
  const initial = getInitial(profile.name, profile.email);
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0,
      left: isMobile ? 0 : 0, right: isMobile ? 0 : 260,
      height: 56, background: 'rgba(10,13,18,0.95)', backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 12px' : '0 24px', gap: isMobile ? 8 : 16, zIndex: 90,
      fontFamily: FONTS.arabic,
    }}>
      {isMobile && (
        <button onClick={onMenuToggle} style={{
          background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.textSec, flexShrink: 0,
        }}><Menu size={18} /></button>
      )}
      <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500, color: C.textPrimary, whiteSpace: 'nowrap', minWidth: isMobile ? 'auto' : 120 }}>
        {pageNames[currentPage]}
      </div>
      {!isMobile && (
        <div style={{ flex: 1, maxWidth: 380, margin: '0 auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
          <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
            placeholder="بحث عن مستورد أو عملية سابقة..."
            style={{ width: '100%', background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 36px 7px 12px', fontSize: 13, color: C.textPrimary, fontFamily: FONTS.arabic, outline: 'none', boxSizing: 'border-box' as const }}
            onFocus={e => e.target.style.borderColor = C.gold}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, marginRight: 'auto' }}>
        {!isMobile && displayName && (
          <div style={{ fontSize: 12, color: C.textSec, whiteSpace: 'nowrap' }}>{displayName}</div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: isMobile ? '4px 8px' : '5px 12px',
          background: 'rgba(200,168,75,0.08)', border: `1px solid rgba(200,168,75,0.3)`,
          borderRadius: 20, fontSize: isMobile ? 10 : 11, color: C.gold,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, animation: 'pulse 2s infinite' }} />
          {isMobile ? 'AI' : 'وكيل AI نشط'}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8a84b22, #0f1318)',
          border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, color: C.gold, fontWeight: 600, flexShrink: 0,
        }}>{initial}</div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
