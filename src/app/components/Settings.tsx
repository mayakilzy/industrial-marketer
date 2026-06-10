import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { C, FONTS, applyThemeToDOM } from './colors';

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const API_BASE  = 'https://api.agentcraft.info';
const USER_ID   = 'default'; // في الـ SaaS: يأتي من auth token

type Tab = 'profile' | 'server' | 'appearance' | 'notifications' | 'plan';

const tabLabels: { id: Tab; label: string }[] = [
  { id: 'profile',       label: 'الملف الشخصي' },
  { id: 'server',        label: 'إعدادات الخادم' },
  { id: 'appearance',    label: 'المظهر' },
  { id: 'notifications', label: 'التنبيهات' },
  { id: 'plan',          label: 'خطتي' },
];

// ─────────────────────────────────────────────
// Profile Context — shared across tabs
// ─────────────────────────────────────────────
interface Profile {
  user_id: string;
  name:    string;
  email:   string;
  company: string;
  theme:   'dark' | 'light';
}

async function loadProfile(): Promise<Profile> {
  try {
    const r = await fetch(`${API_BASE}/user/profile/${USER_ID}`);
    if (r.ok) return await r.json();
  } catch {}
  // fallback to localStorage
  const stored = localStorage.getItem('im_profile');
  if (stored) return JSON.parse(stored);
  return { user_id: USER_ID, name: '', email: '', company: '', theme: 'dark' };
}

async function saveProfile(profile: Profile): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/user/profile`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(profile),
    });
    if (r.ok) {
      localStorage.setItem('im_profile', JSON.stringify(profile));
      return true;
    }
  } catch {}
  // fallback: save to localStorage only
  localStorage.setItem('im_profile', JSON.stringify(profile));
  return true;
}

// ─────────────────────────────────────────────
// Profile Tab
// ─────────────────────────────────────────────
function ProfileTab({ profile, setProfile }: {
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState('');

  const fieldStyle = (id: string) => ({
    width:      '100%',
    background: C.bgInput,
    border:     `1px solid ${focused === id ? C.gold : C.border}`,
    borderRadius: 8,
    padding:    '11px 16px',
    fontSize:   14,
    color:      C.textPrimary,
    fontFamily: FONTS.arabic,
    outline:    'none',
    boxSizing:  'border-box' as const,
    boxShadow:  focused === id ? `0 0 0 3px rgba(200,168,75,0.1)` : 'none',
    transition: 'all 0.15s',
  });

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveProfile(profile);
    setSaving(false);
    if (ok) {
      toast.success('✓ تم حفظ الملف الشخصي');
      // update topbar immediately
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
    } else {
      toast.error('فشل الحفظ — تحقق من الاتصال');
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      {[
        { id: 'name',    label: 'الاسم الكامل',        value: profile.name,    key: 'name' as const },
        { id: 'email',   label: 'البريد الإلكتروني',   value: profile.email,   key: 'email' as const },
        { id: 'company', label: 'اسم الشركة / المنصة', value: profile.company, key: 'company' as const },
      ].map(({ id, label, value, key }) => (
        <div key={id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            {label}
          </div>
          <input
            value={value}
            onChange={e => setProfile({ ...profile, [key]: e.target.value })}
            onFocus={() => setFocused(id)}
            onBlur={() => setFocused('')}
            style={fieldStyle(id)}
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop:  8,
          padding:    '10px 28px',
          background: saving ? '#3a2e18' : C.gold,
          border:     'none',
          borderRadius: 8,
          color:      saving ? '#6b5a2a' : '#0a0d12',
          fontSize:   13,
          fontWeight: 600,
          cursor:     saving ? 'not-allowed' : 'pointer',
          fontFamily: FONTS.arabic,
          transition: 'all 0.2s',
        }}
      >
        {saving ? '⏳ جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Server Tab
// ─────────────────────────────────────────────
function ServerStatus({ label, port, active }: { label: string; port: string; active: boolean }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '10px 0',
      borderBottom:   `1px solid rgba(255,255,255,0.05)`,
    }}>
      <span style={{ fontSize: 13, color: C.textSec }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: active ? C.success : C.danger,
          display: 'inline-block',
          animation: active ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: 12, color: active ? C.success : C.danger, fontFamily: FONTS.mono }}>
          {active ? `نشط على ${port}` : 'متوقف'}
        </span>
      </div>
    </div>
  );
}

function ServerTab() {
  const [agentOk, setAgentOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('https://api.agentcraft.info/industrial/health')
      .then(r => setAgentOk(r.ok))
      .catch(() => setAgentOk(false));
  }, []);

  return (
    <div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>عنوان IP</div>
          <div style={{ fontSize: 14, color: C.textPrimary, fontFamily: FONTS.mono }}>167.86.76.18</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>نظام التشغيل</div>
          <div style={{ fontSize: 13, color: C.textPrimary }}>Ubuntu 24.04 LTS</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>حالة الاتصال</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.success, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: C.success }}>متصل</span>
          </div>
        </div>
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>حالة الخدمات</div>
        <ServerStatus label="Industrial Agent" port="8900" active={agentOk === true} />
        <ServerStatus label="NocoDB"           port="8970" active={true} />
        <ServerStatus label="FastAPI Gateway"  port="8900" active={agentOk === true} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Appearance Tab
// ─────────────────────────────────────────────
function AppearanceTab({ profile, setProfile }: {
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const applyTheme = async (theme: 'dark' | 'light') => {
    const updated = { ...profile, theme };
    setProfile(updated);
    await saveProfile(updated);

    // Apply theme to DOM — full visual change
    applyThemeToDOM(theme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
    // Force re-render of all components
    window.dispatchEvent(new Event('storage'));
    toast.success(theme === 'dark' ? '🌙 تم تفعيل المظهر الداكن' : '☀️ تم تفعيل المظهر الفاتح');
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>المظهر</div>
      <div style={{
        display:      'inline-flex',
        background:   '#0a0d12',
        border:       `1px solid ${C.border}`,
        borderRadius: 8,
        padding:      3,
        gap:          3,
      }}>
        {([
          { id: 'dark'  as const, label: '🌙 مظلم'  },
          { id: 'light' as const, label: '☀️ مضيء'  },
        ]).map(opt => (
          <button
            key={opt.id}
            onClick={() => applyTheme(opt.id)}
            style={{
              padding:      '8px 20px',
              background:   profile.theme === opt.id ? C.bgHover : 'transparent',
              border:       `1px solid ${profile.theme === opt.id ? C.gold : 'transparent'}`,
              borderRadius: 6,
              color:        profile.theme === opt.id ? C.textPrimary : C.textSec,
              fontSize:     13,
              cursor:       'pointer',
              fontFamily:   FONTS.arabic,
              transition:   'all 0.15s',
            }}
          >{opt.label}</button>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: C.textMuted }}>
        {profile.theme === 'dark' ? 'المظهر الداكن مفعّل' : 'المظهر الفاتح مفعّل'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notifications Tab (local state — no backend needed yet)
// ─────────────────────────────────────────────
function NotificationsTab() {
  const [settings, setSettings] = useState({
    newImporters: true, searchComplete: true,
    errors: true, weekly: false, tips: true,
  });

  const items = [
    { id: 'newImporters'   as const, label: 'مستوردون جدد',   desc: 'عند اكتشاف مستوردين جدد' },
    { id: 'searchComplete' as const, label: 'انتهاء البحث',   desc: 'عند اكتمال عملية البحث' },
    { id: 'errors'         as const, label: 'أخطاء الاتصال', desc: 'عند وجود خطأ في الاتصال بـ API' },
    { id: 'weekly'         as const, label: 'ملخص أسبوعي',   desc: 'تقرير أسبوعي بالأداء العام' },
    { id: 'tips'           as const, label: 'نصائح وتحديثات', desc: 'نصائح لتحسين أداء البحث' },
  ];

  return (
    <div style={{ maxWidth: 500 }}>
      {items.map(item => (
        <div key={item.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0', borderBottom: `1px solid rgba(255,255,255,0.05)`,
        }}>
          <div>
            <div style={{ fontSize: 14, color: C.textPrimary, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{item.desc}</div>
          </div>
          <div
            onClick={() => setSettings(s => ({ ...s, [item.id]: !s[item.id] }))}
            style={{
              width: 40, height: 22,
              background:   settings[item.id] ? C.gold : '#1c2330',
              border:       `1px solid ${settings[item.id] ? C.gold : C.border}`,
              borderRadius: 11,
              cursor:       'pointer',
              position:     'relative',
              transition:   'all 0.2s',
            }}
          >
            <span style={{
              position:   'absolute',
              top:        2,
              right:      settings[item.id] ? 2 : 'auto',
              left:       settings[item.id] ? 'auto' : 2,
              width:      16, height: 16,
              background: settings[item.id] ? '#0a0d12' : '#555',
              borderRadius: '50%',
              transition: 'all 0.2s',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Plan Tab
// ─────────────────────────────────────────────
function PlanTab() {
  const plans = [
    {
      id: 'starter', name: 'Starter', price: '$29', period: '/شهر',
      border: 'rgba(255,255,255,0.12)', badge: null, current: false,
      features: ['10 عمليات بحث/شهر', '100 مستورد', 'رسائل بلغتين', 'تحليل 3 منافسين'],
      locked:   ['تحليل PDF', 'بحث غير محدود'],
    },
    {
      id: 'pro', name: 'Pro', price: '$79', period: '/شهر',
      border: C.gold, badge: 'الأكثر شيوعاً', current: true,
      features: ['50 عملية بحث/شهر', '1000 مستورد', 'رسائل بـ 6 لغات', 'تحليل PDF', 'وكيل AI مباشر'],
      locked:   ['بحث غير محدود', 'فريق متعدد'],
    },
    {
      id: 'enterprise', name: 'Enterprise', price: 'مخصص', period: '',
      border: 'rgba(192,192,192,0.3)', badge: null, current: false,
      features: ['بحث غير محدود', 'مستوردون غير محدودون', 'جميع اللغات', 'دعم مخصص', 'فريق متعدد'],
      locked:   [],
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {plans.map(plan => (
        <div key={plan.id} style={{
          background: C.bgCard, border: `1px solid ${plan.border}`,
          borderRadius: 16, padding: 20, position: 'relative',
        }}>
          {plan.badge && (
            <div style={{
              position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
              background: C.gold, color: '#0a0d12', fontSize: 10,
              padding: '2px 10px', borderRadius: 10, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{plan.badge}</div>
          )}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: '1.5rem', color: plan.current ? C.gold : C.textPrimary }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>{plan.period}</span>
            </div>
          </div>
          {plan.features.map(f => (
            <div key={f} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 12, color: C.textSec }}>
              <span style={{ color: C.success, flexShrink: 0 }}>✓</span><span>{f}</span>
            </div>
          ))}
          {plan.locked.map(f => (
            <div key={f} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 12, color: C.textMuted }}>
              <span style={{ flexShrink: 0 }}>🔒</span><span>{f}</span>
            </div>
          ))}
          <button
            onClick={() => plan.current
              ? toast.info('أنت مشترك بهذه الخطة حالياً')
              : toast.success(`جارٍ الانتقال إلى ${plan.name}`)
            }
            style={{
              width: '100%', marginTop: 16, padding: '9px 0',
              background: plan.current ? 'rgba(200,168,75,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${plan.current ? C.gold : C.border}`,
              borderRadius: 8, color: plan.current ? C.gold : C.textSec,
              fontSize: 12, cursor: 'pointer', fontFamily: FONTS.arabic,
            }}
          >{plan.current ? '✓ خطتك الحالية' : 'الترقية'}</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Settings Component
// ─────────────────────────────────────────────
export function Settings() {
  const [tab, setTab]       = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile>({
    user_id: USER_ID, name: '', email: '', company: '', theme: 'dark',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile().then(p => {
      setProfile(p as Profile);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <span style={{ color: C.textMuted, fontSize: 13 }}>⏳ جارٍ التحميل...</span>
      </div>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case 'profile':       return <ProfileTab       profile={profile} setProfile={setProfile} />;
      case 'server':        return <ServerTab />;
      case 'appearance':    return <AppearanceTab    profile={profile} setProfile={setProfile} />;
      case 'notifications': return <NotificationsTab />;
      case 'plan':          return <PlanTab />;
    }
  };

  return (
    <div style={{ fontFamily: FONTS.arabic, direction: 'rtl' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.textPrimary, margin: '0 0 6px' }}>الإعدادات</h1>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Vertical tabs */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {tabLabels.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                width:        '100%',
                display:      'block',
                padding:      '10px 14px',
                background:   tab === t.id ? 'rgba(200,168,75,0.08)' : 'none',
                border:       'none',
                borderRight:  `3px solid ${tab === t.id ? C.gold : 'transparent'}`,
                borderRadius: '0 8px 8px 0',
                color:        tab === t.id ? C.textPrimary : C.textSec,
                fontSize:     13,
                cursor:       'pointer',
                fontFamily:   FONTS.arabic,
                textAlign:    'right',
                marginBottom: 2,
                transition:   'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            background:   C.bgCard,
            border:       `1px solid ${C.border}`,
            borderRadius: 16,
            padding:      28,
          }}>
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
