import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { C, FONTS } from './colors';

const STORAGE_KEY = 'im_api_keys';

interface ApiKeyField {
  id:          string;
  title:       string;
  description: string;
  link:        string;
  placeholder: string;
  badge?:      string;
  required?:   boolean;
}

const apiFields: ApiKeyField[] = [
  {
    id: 'apify_token', required: true,
    title: 'Apify API Key',
    description: 'لجلب بيانات المستوردين من Google Maps — مطلوب لتشغيل البحث',
    link: 'https://console.apify.com/account/integrations',
    placeholder: 'apify_api_...',
    badge: 'مطلوب',
  },
  {
    id: 'anthropic_key', required: true,
    title: 'Anthropic (Claude) API Key',
    description: 'لكتابة رسائل التواصل الاحترافية بالذكاء الاصطناعي',
    link: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
    badge: 'مطلوب',
  },
  {
    id: 'openai_key',
    title: 'OpenAI API Key',
    description: 'بديل لـ Claude — يستخدم GPT-4 لكتابة الرسائل',
    link: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...',
  },
  {
    id: 'gemini_key',
    title: 'Google Gemini API Key',
    description: 'بديل آخر — يستخدم Gemini Pro لكتابة الرسائل',
    link: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
  },
  {
    id: 'deepseek_key',
    title: 'DeepSeek API Key',
    description: 'نموذج اقتصادي عالي الجودة لكتابة الرسائل',
    link: 'https://platform.deepseek.com/api_keys',
    placeholder: 'sk-...',
  },
  {
    id: 'xai_key',
    title: 'xAI (Grok) API Key',
    description: 'نموذج Grok من xAI لكتابة الرسائل',
    link: 'https://console.x.ai',
    placeholder: 'xai-...',
  },
  {
    id: 'smtp_url',
    title: 'SMTP للإرسال المباشر',
    description: 'لإرسال الرسائل مباشرة للمستوردين من المنصة (Gmail أو Outlook أو غيره)',
    link: 'https://support.google.com/mail/answer/7126229',
    placeholder: 'smtp://user:password@smtp.gmail.com:587',
    badge: 'قريباً',
  },
];

interface KeyState {
  value:  string;
  show:   boolean;
  status: 'empty' | 'valid' | 'invalid';
}

export function APIKeys() {
  const [keys, setKeys]           = useState<Record<string, KeyState>>(
    Object.fromEntries(apiFields.map(f => [f.id, { value: '', show: false, status: 'empty' as const }]))
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved keys on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setKeys(prev => {
          const updated = { ...prev };
          for (const [id, val] of Object.entries(parsed)) {
            if (updated[id] && val) {
              const v = val as string;
              updated[id] = { value: v, show: false, status: v.length > 8 ? 'valid' : 'invalid' };
            }
          }
          return updated;
        });
      }
    } catch {}
  }, []);

  const update = (id: string, val: string) => {
    setHasChanges(true);
    setKeys(prev => ({
      ...prev,
      [id]: { ...prev[id], value: val, status: val.length === 0 ? 'empty' : val.length > 8 ? 'valid' : 'invalid' },
    }));
  };

  const toggleShow = (id: string) =>
    setKeys(prev => ({ ...prev, [id]: { ...prev[id], show: !prev[id].show } }));

  const handleSave = () => {
    const toSave: Record<string, string> = {};
    for (const [id, k] of Object.entries(keys)) {
      if (k.value) toSave[id] = k.value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setHasChanges(false);
    toast.success('✓ تم حفظ المفاتيح محلياً');
  };

  const validCount = Object.values(keys).filter(k => k.status === 'valid').length;

  return (
    <div style={{ fontFamily: FONTS.arabic, direction: 'rtl', maxWidth: 740, margin: '0 auto' }}>
      {/* Security banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: 'rgba(91,156,246,0.08)', border: '1px solid rgba(91,156,246,0.2)', borderRadius: 8, marginBottom: 24, fontSize: 12, color: C.info }}>
        <Lock size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>🔒 المفاتيح محفوظة محلياً فقط</div>
          <div style={{ color: '#7aabf5', lineHeight: 1.5 }}>جميع المفاتيح تُحفظ في متصفحك ولا تُرسل لأي خادم خارجي. تُستخدم فقط لإجراء طلبات API مباشرة.</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.textPrimary, margin: '0 0 6px' }}>مفاتيح API (BYOK)</h1>
        <p style={{ fontSize: 13, color: C.textSec, margin: 0 }}>
          أضف مفاتيحك الخاصة — {validCount} من {apiFields.length} مفعّل
        </p>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: '#1c2330', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${(validCount / apiFields.length) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright})`, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {apiFields.map(field => {
          const k = keys[field.id];
          return (
            <div key={field.id} style={{ background: C.bgCard, border: `1px solid ${k.status === 'valid' ? 'rgba(200,168,75,0.3)' : C.border}`, borderRadius: 12, padding: 20, transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, fontFamily: FONTS.mono }}>{field.title}</span>
                    {field.badge && (
                      <span style={{ background: field.badge === 'مطلوب' ? 'rgba(45,212,160,0.12)' : 'rgba(200,168,75,0.12)', color: field.badge === 'مطلوب' ? C.success : C.gold, fontSize: 10, padding: '2px 7px', borderRadius: 10 }}>{field.badge}</span>
                    )}
                    {k.status === 'valid' && <span style={{ color: C.success, fontSize: 12 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSec }}>{field.description}</div>
                </div>
                <a href={field.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.gold, textDecoration: 'none', flexShrink: 0, marginRight: 12 }}>احصل على مفتاح ↗</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={k.show ? 'text' : 'password'}
                  value={k.value}
                  onChange={e => update(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 40px 10px 40px', fontSize: 13, color: C.textPrimary, fontFamily: FONTS.mono, outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'left', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = C.gold)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
                <button onClick={() => toggleShow(field.id)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center', padding: 4 }}>
                  {k.show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', background: k.status === 'valid' ? C.success : k.status === 'invalid' ? C.danger : '#333', display: 'inline-block' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <button disabled={!hasChanges} onClick={handleSave} style={{ width: '100%', height: 48, background: hasChanges ? C.gold : '#1c2330', color: hasChanges ? '#0a0d12' : C.textMuted, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: hasChanges ? 'pointer' : 'not-allowed', fontFamily: FONTS.arabic, transition: 'all 0.2s' }}>
          حفظ وتفعيل المفاتيح 💾
        </button>
      </div>
    </div>
  );
}
