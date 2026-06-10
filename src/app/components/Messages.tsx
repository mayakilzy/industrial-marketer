import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { C, FONTS } from './colors';

const API_BASE = 'https://api.agentcraft.info';

interface Message {
  Id:        number;
  company:   string;
  lang:      string;
  subject:   string;
  recipient: string;
  body:      string;
  preview:   string;
  campaign:  string;
  status?:   string;
}

const langColors: Record<string, { bg: string; color: string }> = {
  de: { bg: 'rgba(226,85,85,0.15)',   color: '#e25555' },
  fr: { bg: 'rgba(91,156,246,0.15)',  color: C.info },
  en: { bg: 'rgba(45,212,160,0.15)',  color: C.success },
  ar: { bg: 'rgba(200,168,75,0.15)',  color: C.gold },
  it: { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
  es: { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
};

function detectLang(row: any): string {
  if (row.outreach_message_de) return 'de';
  if (row.outreach_message_en) return 'en';
  if (row.outreach_message_fr) return 'fr';
  if (row.outreach_message_ar) return 'ar';
  return 'en';
}

function getBody(row: any, lang: string): string {
  return row[`outreach_message_${lang}`] || row.outreach_message_en || row.outreach_message_de || '';
}

function extractSubject(body: string): string {
  const match = body.match(/^(?:Subject:|Betreff:|Objet:|Konu:)\s*(.+)/m);
  return match ? match[1].trim() : body.replace(/\*\*/g, '').slice(0, 60) + '…';
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^[ \t]*[-*]{3,}[ \t]*$/gm,
      `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:14px 0"/>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8dfc0;font-weight:600">$1</strong>')
    .replace(/__(.+?)__/g,     '<strong style="color:#e8dfc0;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/`([^`]+)`/g,
      `<code style="background:rgba(255,255,255,0.07);padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>`)
    .replace(/\n/g, '<br/>');
}

function MessageBody({ body }: { body: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
      style={{
        fontFamily: FONTS.arabic, fontSize: 14, color: C.textPrimary,
        lineHeight: 1.85, direction: 'ltr', textAlign: 'left',
        margin: '0 0 24px', wordBreak: 'break-word',
      }}
    />
  );
}

// ── Send Modal ────────────────────────────────────────────────────
interface SendModalProps {
  msg:     Message;
  onClose: () => void;
  onSent:  (id: number) => void;
}

function SendModal({ msg, onClose, onSent }: SendModalProps) {
  const [toEmail,  setToEmail]  = useState('');
  const [replyTo,  setReplyTo]  = useState('');
  const [subject,  setSubject]  = useState(msg.subject);
  const [body,     setBody]     = useState(msg.body);
  const [sending,  setSending]  = useState(false);

  const handleSend = async () => {
    if (!toEmail || !toEmail.includes('@')) {
      toast.error('أدخل بريد المستلم الصحيح');
      return;
    }
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/email/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email:  toEmail.trim(),
          to_name:   msg.company,
          subject:   subject.trim(),
          body:      body.trim(),
          reply_to:  replyTo.trim(),
          lead_id:   msg.Id,
          campaign:  msg.campaign,
        }),
      });
      const data = await r.json();
      if (data.success) {
        toast.success(`✓ تم الإرسال إلى ${toEmail}`);
        onSent(msg.Id);
        onClose();
      } else {
        toast.error(`فشل الإرسال: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`خطأ: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a0d12',
    border: `1px solid ${C.border}`, borderRadius: 8,
    padding: '10px 14px', fontSize: 13,
    color: C.textPrimary, fontFamily: FONTS.arabic,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bgCard,
        border: `1px solid ${C.borderMed}`,
        borderTop: `3px solid ${C.gold}`,
        borderRadius: 16, width: 640, maxWidth: '94vw',
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: FONTS.arabic, direction: 'rtl',
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>
              إرسال إلى {msg.company}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
              راجع وعدّل الرسالة قبل الإرسال
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${C.border}`,
            borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
            color: C.textSec, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* To Email */}
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
              📧 بريد المستلم <span style={{ color: '#e25555' }}>*</span>
            </div>
            <input
              value={toEmail} onChange={e => setToEmail(e.target.value)}
              placeholder="buyer@company.de"
              style={{ ...inputStyle, direction: 'ltr' }}
              onFocus={e => (e.target.style.borderColor = C.gold)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Reply-To */}
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
              ↩️ الرد يصل إلى (اختياري — بريدك الشخصي)
            </div>
            <input
              value={replyTo} onChange={e => setReplyTo(e.target.value)}
              placeholder="your@gmail.com"
              style={{ ...inputStyle, direction: 'ltr' }}
              onFocus={e => (e.target.style.borderColor = C.gold)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Subject */}
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
              📌 الموضوع
            </div>
            <input
              value={subject} onChange={e => setSubject(e.target.value)}
              style={{ ...inputStyle, direction: 'ltr' }}
              onFocus={e => (e.target.style.borderColor = C.gold)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Body */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 6,
            }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>✉️ نص الرسالة</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONTS.mono }}>
                {body.length} حرف
              </div>
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={12}
              style={{
                ...inputStyle, direction: 'ltr', resize: 'vertical',
                lineHeight: 1.7, fontFamily: 'monospace', fontSize: 12,
              }}
              onFocus={e => (e.target.style.borderColor = C.gold)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                flex: 1, height: 46,
                background: sending ? '#2a2210' : C.gold,
                color:      sending ? '#6b5a2a' : '#0a0d12',
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 700,
                cursor: sending ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.arabic, transition: 'all 0.2s',
              }}
            >
              {sending ? '⏳ جارٍ الإرسال...' : '▸ إرسال الرسالة'}
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(body); toast.success('تم النسخ'); }}
              style={{
                padding: '0 20px', height: 46,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                color: C.textSec, borderRadius: 8,
                fontSize: 13, cursor: 'pointer',
                fontFamily: FONTS.arabic,
              }}
            >
              نسخ
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function Messages() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [selected,    setSelected]    = useState<Message | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [sentIds,     setSentIds]     = useState<Set<number>>(new Set());
  const [activeCamp,  setActiveCamp]  = useState<string>('all');

  useEffect(() => { loadMessages(); }, []);

  async function loadMessages() {
    setLoading(true);
    try {
      const r    = await fetch(`${API_BASE}/db/leads?limit=500`);
      const rows = await r.json();
      const all: Message[] = [];
      for (const row of (rows || [])) {
        const lang = detectLang(row);
        const body = getBody(row, lang);
        if (!body) continue;
        all.push({
          Id:        row.id,
          company:   row.title || row.company_name || '—',
          lang,
          subject:   extractSubject(body),
          recipient: `${row.title || row.company_name || '—'} · ${row.city || ''} ${row.country || ''}`,
          body,
          preview:   body.replace(/\*\*|__|---|\*/g, '').slice(0, 80).replace(/\n/g, ' '),
          campaign:  row.campaign_slug || '',
          status:    row.status || 'New',
        });
      }
      setMessages(all);
      if (all.length > 0) setSelected(all[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // unique campaigns
  const campaigns = [...new Set(messages.map(m => m.campaign).filter(Boolean))];
  const filtered  = activeCamp === 'all' ? messages : messages.filter(m => m.campaign === activeCamp);

  const lc = selected ? (langColors[selected.lang] || langColors['en']) : langColors['en'];
  const isContacted = selected ? sentIds.has(selected.Id) || selected.status === 'Contacted' : false;

  return (
    <div style={{ fontFamily: FONTS.arabic, direction: 'rtl', display: 'flex', gap: 0, height: 'calc(100vh - 140px)' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 280, flexShrink: 0,
        borderLeft: `1px solid ${C.border}`,
        overflowY: 'auto', background: C.bgCard,
        borderRadius: '0 16px 16px 0',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>الرسائل</span>
              <span style={{
                marginRight: 8, background: 'rgba(45,212,160,0.15)', color: C.success,
                fontSize: 11, padding: '2px 8px', borderRadius: 10, fontFamily: FONTS.mono,
              }}>{filtered.length}</span>
            </div>
            <button onClick={loadMessages} style={{
              background: 'none', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer',
            }}>↻</button>
          </div>
          {/* Campaign filter */}
          {campaigns.length > 1 && (
            <select value={activeCamp} onChange={e => setActiveCamp(e.target.value)}
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'5px 10px', fontSize:11,
                color: activeCamp !== 'all' ? C.gold : C.textMuted,
                fontFamily:FONTS.arabic, outline:'none', cursor:'pointer' }}>
              <option value="all">كل الحملات</option>
              {campaigns.map(c => <option key={c} value={c} style={{ background:C.bgCard }}>{c}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>⏳ جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
            لا توجد رسائل بعد
          </div>
        ) : filtered.map(msg => {
          const isActive    = selected?.Id === msg.Id && selected?.campaign === msg.campaign;
          const isSent      = sentIds.has(msg.Id) || msg.status === 'Contacted';
          const mlc         = langColors[msg.lang] || langColors['en'];
          return (
            <div key={`${msg.campaign}-${msg.Id}`} onClick={() => setSelected(msg)} style={{
              padding: '12px 16px',
              borderBottom: `1px solid rgba(255,255,255,0.04)`,
              cursor: 'pointer',
              background: isActive ? C.bgHover : 'transparent',
              borderRight: isActive ? `3px solid ${C.gold}` : '3px solid transparent',
              transition: 'all 0.15s',
              opacity: isSent ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{
                  fontSize: 13, color: isActive ? C.textPrimary : '#ccc',
                  fontWeight: isActive ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                }}>{msg.company}</div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {isSent
                    ? <span style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>✓</span>
                    : <span style={{ fontSize: 10, color: C.textMuted }} title="لم تُرسَل بعد">⏳</span>
                  }
                  <span style={{
                    background: mlc.bg, color: mlc.color,
                    fontSize: 9, padding: '2px 5px', borderRadius: 4, fontFamily: FONTS.mono,
                  }}>{msg.lang.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>{msg.campaign}</div>
              <div style={{
                fontSize: 11, color: C.textMuted,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                direction: 'ltr', textAlign: 'right',
              }}>{msg.preview}</div>
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, background: C.bgCard,
        borderRadius: '16px 0 0 16px', padding: 28,
        overflowY: 'auto', border: `1px solid ${C.border}`, borderRight: 'none',
      }}>
        {!selected ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: C.textMuted, fontSize: 14,
          }}>اختر رسالة للعرض</div>
        ) : (
          <>
            {/* Tags */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: lc.bg, color: lc.color,
                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: FONTS.mono,
              }}>{selected.lang.toUpperCase()}</span>
              <span style={{
                background: 'rgba(255,255,255,0.05)', color: C.textMuted,
                fontSize: 10, padding: '3px 8px', borderRadius: 20,
              }}>{selected.campaign}</span>
              {isContacted && (
                <span style={{
                  background: 'rgba(45,212,160,0.12)', color: C.success,
                  fontSize: 10, padding: '3px 8px', borderRadius: 20,
                }}>✓ تم الإرسال</span>
              )}
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>الموضوع: </span>
              <span style={{ fontSize: 14, color: C.textPrimary, fontWeight: 500 }}>{selected.subject}</span>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>إلى: </span>
              <span style={{ fontSize: 13, color: C.gold }}>{selected.recipient}</span>
            </div>

            <div style={{ height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 20 }} />

            <MessageBody body={selected.body} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '9px 24px', height: 42,
                  background: isContacted ? 'rgba(45,212,160,0.08)' : C.gold,
                  color:      isContacted ? C.success : '#0a0d12',
                  border: isContacted ? `1px solid ${C.success}` : 'none',
                  borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: FONTS.arabic, transition: 'all 0.2s',
                }}
              >
                {isContacted ? '↻ إرسال مجدداً' : '▸ إرسال الرسالة ✉️'}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(selected.body); toast.success('تم نسخ الرسالة'); }}
                style={{
                  padding: '9px 20px',
                  background: 'rgba(200,168,75,0.08)',
                  border: `1px solid ${C.gold}`,
                  color: C.gold, borderRadius: 8, fontSize: 13,
                  cursor: 'pointer', fontFamily: FONTS.arabic,
                }}
              >
                نسخ
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Send Modal ── */}
      {showModal && selected && (
        <SendModal
          msg={selected}
          onClose={() => setShowModal(false)}
          onSent={(id) => setSentIds(prev => new Set([...prev, id]))}
        />
      )}
    </div>
  );
}
