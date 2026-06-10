import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Search, Users, Mail, BarChart2,
  Star, FileText, Key, Settings
} from 'lucide-react';
import { C, FONTS } from './colors';

type Page = 'dashboard' | 'new-search' | 'leads' | 'messages' | 'competitors' | 'golden' | 'pdf' | 'api-keys' | 'settings';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  pulse?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard',   label: 'لوحة التحكم',      icon: <LayoutDashboard size={18} /> },
  { id: 'new-search',  label: 'بحث جديد',          icon: <Search size={18} />, pulse: true },
  { id: 'leads',       label: 'المستوردون',         icon: <Users size={18} />,    badge: '127', badgeColor: C.gold },
  { id: 'messages',    label: 'الرسائل',            icon: <Mail size={18} />,     badge: '98',  badgeColor: C.success },
  { id: 'competitors', label: 'تحليل المنافسين',    icon: <BarChart2 size={18} /> },
  { id: 'golden',      label: 'الجملة الذهبية',     icon: <Star size={18} /> },
  { id: 'pdf',         label: 'تحليل PDF',          icon: <FileText size={18} />, badge: 'Pro', badgeColor: '#a855f7' },
  { id: 'api-keys',    label: 'مفاتيح API',         icon: <Key size={18} /> },
  { id: 'settings',    label: 'الإعدادات',          icon: <Settings size={18} /> },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface Profile {
  name:    string;
  email:   string;
  company: string;
}

function getInitial(name: string, email: string): string {
  if (name?.trim())  return name.trim()[0].toUpperCase();
  if (email?.trim()) return email.trim()[0].toUpperCase();
  return 'U';
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [hovered, setHovered] = useState<Page | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', company: '' });

  // Load profile on mount + listen for updates
  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('im_profile');
        if (stored) setProfile(JSON.parse(stored));
      } catch {}
    };
    load();
    window.addEventListener('profileUpdated', load);
    return () => window.removeEventListener('profileUpdated', load);
  }, []);

  const displayName  = profile.name    || profile.company || 'المستخدم';
  const displayEmail = profile.email   || '';
  const initial      = getInitial(profile.name, profile.email);

  return (
    <div style={{
      position:      'fixed',
      top:           0,
      right:         0,
      width:         260,
      height:        '100vh',
      background:    C.bgMain,
      borderLeft:    `1px solid ${C.border}`,
      display:       'flex',
      flexDirection: 'column',
      zIndex:        100,
      fontFamily:    FONTS.arabic,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 28 }}>🏭</span>
          <span style={{
            position: 'absolute', bottom: 2, right: -2,
            width: 8, height: 8,
            background: C.success, borderRadius: '50%',
            animation: 'pulse 2s infinite',
            border: `1px solid ${C.bgMain}`,
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: FONTS.display, fontSize: 12,
            color: C.gold, letterSpacing: '0.1em', lineHeight: 1.2,
          }}>INDUSTRIAL<br />MARKETER</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>خطة Pro</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive  = currentPage === item.id;
          const isHovered = hovered === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         10,
                height:      44,
                padding:     '0 12px',
                borderRadius: 8,
                cursor:      'pointer',
                marginBottom: 2,
                position:    'relative',
                background:  isActive ? 'rgba(200,168,75,0.08)' : isHovered ? 'rgba(255,255,255,0.02)' : 'transparent',
                color:       isActive ? C.textPrimary : isHovered ? '#aaa' : '#8a8a8a',
                transition:  'all 0.15s ease',
                borderRight: isActive ? `3px solid ${C.gold}` : '3px solid transparent',
              }}
            >
              <span style={{ color: isActive ? C.gold : 'inherit', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 14, flex: 1 }}>{item.label}</span>
              {item.pulse && !isActive && (
                <span style={{ width: 6, height: 6, background: C.gold, borderRadius: '50%', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              )}
              {item.badge && (
                <span style={{
                  background: item.badgeColor === '#a855f7'
                    ? 'rgba(168,85,247,0.15)'
                    : item.badgeColor === C.success
                      ? 'rgba(45,212,160,0.15)'
                      : 'rgba(200,168,75,0.15)',
                  color:      item.badgeColor,
                  fontSize:   10,
                  padding:    '1px 6px',
                  borderRadius: 4,
                  fontFamily: item.badgeColor !== '#a855f7' ? FONTS.mono : FONTS.arabic,
                  flexShrink: 0,
                }}>{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

      {/* Bottom user area — reads from localStorage */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 7, height: 7, background: C.success, borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: C.textMuted }}>متصل</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar — shows initial */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8a84b, #0f1318)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: C.gold,
            border: `1px solid ${C.border}`,
            flexShrink: 0, fontWeight: 600,
          }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayEmail}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
