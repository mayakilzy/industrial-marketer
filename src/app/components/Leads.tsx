import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { C, FONTS } from './colors';

const API_BASE = 'https://api.agentcraft.info';

interface Lead {
  Id:                   number;
  title?:               string;
  company_name?:        string;
  country?:             string;
  city?:                string;
  phone?:               string;
  website?:             string;
  email?:               string;
  rating?:              number;
  data_score?:          number;
  status?:              string;
  interest_level?:      string;
  product_searched?:    string;
  outreach_message_en?: string;
  outreach_message_de?: string;
  outreach_message_fr?: string;
  outreach_message_ar?: string;
  source?:              string;
  campaign_name?:       string;
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'New':       { bg: 'rgba(200,168,75,0.12)',  color: C.gold },
    'Contacted': { bg: 'rgba(45,212,160,0.12)',  color: C.success },
    'Replied':   { bg: 'rgba(91,156,246,0.12)',  color: C.info },
    'Closed':    { bg: 'rgba(226,85,85,0.12)',   color: C.danger },
  };
  const s = map[status || 'New'] || map['New'];
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {status || 'New'}
    </span>
  );
}

function ScoreBar({ score }: { score?: number }) {
  const s = score || 0;
  const color = s >= 8 ? C.success : s >= 5 ? C.gold : C.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 4, background: '#1c2330', borderRadius: 2 }}>
        <div style={{ width: `${s * 10}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: FONTS.mono, color: C.textMuted }}>{s}</span>
    </div>
  );
}

function LeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const API_BASE = 'https://api.agentcraft.info';
  const origMsg = lead.outreach_message_ar || lead.outreach_message_de ||
                  lead.outreach_message_en || lead.outreach_message_fr || '';
  const [tab,      setTab]      = React.useState<'info'|'send'>('info');
  const [toEmail,  setToEmail]  = React.useState('');
  const [replyTo,  setReplyTo]  = React.useState('');
  const [subject,  setSubject]  = React.useState(
    `شراكة تجارية — ${lead.title || lead.company_name || ''}`
  );
  const [body,     setBody]     = React.useState(origMsg);
  const [sending,  setSending]  = React.useState(false);
  const [sent,     setSent]     = React.useState(false);

  const handleSend = async () => {
    if (!toEmail || !toEmail.includes('@')) { toast.error('أدخل بريد المستلم'); return; }
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/email/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: toEmail.trim(), to_name: lead.title || lead.company_name,
          subject: subject.trim(), body: body.trim(),
          reply_to: replyTo.trim(), lead_id: lead.Id,
          campaign: lead.campaign_name || '',
        }),
      });
      const d = await r.json();
      if (d.success) { toast.success(`✓ تم الإرسال إلى ${toEmail}`); setSent(true); }
      else toast.error(`فشل: ${d.error}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const inputSt: React.CSSProperties = {
    width: '100%', background: '#0a0d12', border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '9px 12px', fontSize: 13,
    color: C.textPrimary, fontFamily: FONTS.arabic, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bgCard, border: `1px solid ${C.borderMed}`, borderTop: `2px solid ${C.gold}`, borderRadius: 16, width: 620, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease', fontFamily: FONTS.arabic, direction: 'rtl' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>{lead.title || lead.company_name}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{lead.city} · {lead.country} {lead.phone ? `· ${lead.phone}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSec, fontSize: 16 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {[['info','معلومات'],['send','إرسال رسالة ✉️']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)} style={{
              flex: 1, padding: '12px', background: 'none', border: 'none',
              borderBottom: tab === key ? `2px solid ${C.gold}` : '2px solid transparent',
              color: tab === key ? C.gold : C.textMuted,
              fontSize: 13, cursor: 'pointer', fontFamily: FONTS.arabic,
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Tab: Info */}
          {tab === 'info' && (
            <>
              {[
                { label: 'الدولة',  value: `${lead.country || '—'} — ${lead.city || '—'}` },
                { label: 'المنتج',  value: lead.product_searched || '—' },
                { label: 'الهاتف',  value: lead.phone || '—' },
                { label: 'الموقع',  value: lead.website || '—' },
                { label: 'المصدر',  value: lead.source || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: C.textMuted, minWidth: 80, flexShrink: 0 }}>{label}:</div>
                  <div style={{ fontSize: 13, color: C.textPrimary }}>{value}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>الجودة</div>
                  <ScoreBar score={lead.data_score} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>الحالة</div>
                  <StatusBadge status={lead.status} />
                </div>
              </div>
              {origMsg && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>الرسالة الجاهزة:</div>
                  <div style={{ background: 'rgba(200,168,75,0.04)', border: `1px solid rgba(200,168,75,0.12)`, borderRadius: 8, padding: '12px 14px', fontSize: 12, color: C.textPrimary, lineHeight: 1.8, direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>{origMsg}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(origMsg); toast.success('تم النسخ'); }} style={{ flex: 1, height: 36, background: 'rgba(200,168,75,0.08)', border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: FONTS.arabic }}>نسخ الرسالة</button>
                    <button onClick={() => setTab('send')} style={{ flex: 1, height: 36, background: C.gold, border: 'none', color: '#0a0d12', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.arabic }}>▸ إرسال بريد ✉️</button>
                  </div>
                </div>
              )}
              {!origMsg && (
                <button onClick={() => setTab('send')} style={{ marginTop: 16, width: '100%', height: 40, background: C.gold, border: 'none', color: '#0a0d12', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.arabic }}>▸ كتابة وإرسال رسالة مخصصة</button>
              )}
            </>
          )}

          {/* Tab: Send */}
          {tab === 'send' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sent && (
                <div style={{ background: 'rgba(45,212,160,0.08)', border: `1px solid ${C.success}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.success, textAlign: 'center' }}>
                  ✓ تم الإرسال بنجاح!
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>📧 بريد المستلم <span style={{ color: '#e25555' }}>*</span></div>
                <input value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="buyer@company.com" style={{ ...inputSt, direction: 'ltr' }} onFocus={e => (e.target.style.borderColor = C.gold)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>↩️ الرد يصل إلى (اختياري)</div>
                <input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="your@gmail.com" style={{ ...inputSt, direction: 'ltr' }} onFocus={e => (e.target.style.borderColor = C.gold)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>📌 الموضوع</div>
                <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inputSt, direction: 'rtl' }} onFocus={e => (e.target.style.borderColor = C.gold)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>✉️ نص الرسالة</div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace' }}>{body.length} حرف</div>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} style={{ ...inputSt, direction: 'ltr', resize: 'vertical', lineHeight: 1.7, fontFamily: 'monospace', fontSize: 12 }} onFocus={e => (e.target.style.borderColor = C.gold)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSend} disabled={sending} style={{ flex: 1, height: 44, background: sending ? '#2a2210' : C.gold, color: sending ? '#6b5a2a' : '#0a0d12', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: FONTS.arabic }}>
                  {sending ? '⏳ جارٍ الإرسال...' : '▸ إرسال الرسالة'}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(body); toast.success('تم النسخ'); }} style={{ padding: '0 16px', height: 44, background: 'rgba(200,168,75,0.08)', border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: FONTS.arabic }}>نسخ</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

export function Leads() {
  const [leads,       setLeads]       = useState<Lead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [campaigns,   setCampaigns]   = useState<any[]>([]);
  const [activeCamp,  setActiveCamp]  = useState<string>('all');
  const [hoveredRow,  setHoveredRow]  = useState<number | null>(null);

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const [leadsR, campsR] = await Promise.all([
        fetch(`https://api.agentcraft.info/db/leads?limit=500`),
        fetch(`https://api.agentcraft.info/db/campaigns`),
      ]);
      const leadsData = await leadsR.json();
      const campsData = await campsR.json();
      setLeads(leadsData || []);
      setCampaigns(campsData || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = activeCamp === 'all' ? leads : leads.filter(l => 
    l.campaign_name === activeCamp || (l as any).campaign_slug === activeCamp
  );

  return (
    <div style={{ fontFamily: FONTS.arabic, direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: C.textPrimary, margin: 0 }}>المستوردون المكتشفون</h1>
          <span style={{ background: 'rgba(200,168,75,0.15)', color: C.gold, fontSize: 12, padding: '2px 10px', borderRadius: 10, fontFamily: FONTS.mono }}>{filtered.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadLeads} style={{ padding: '7px 14px', background: 'none', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8, color: C.textSec, fontSize: 12, cursor: 'pointer', fontFamily: FONTS.arabic }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = C.gold); (e.currentTarget.style.color = C.gold); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'); (e.currentTarget.style.color = C.textSec); }}
          >↻ تحديث</button>
        </div>
      </div>

      {/* Campaign filter — dropdown */}
      {campaigns.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={() => setActiveCamp('all')}
            style={{ padding:'5px 14px', background: activeCamp==='all' ? 'rgba(200,168,75,0.15)' : 'none',
              border:`1px solid ${activeCamp==='all' ? C.gold : C.border}`, borderRadius:20,
              color: activeCamp==='all' ? C.gold : C.textMuted, fontSize:11, cursor:'pointer',
              fontFamily:FONTS.arabic, whiteSpace:'nowrap' }}>
            كل الحملات
          </button>
          <select
            value={activeCamp === 'all' ? '' : activeCamp}
            onChange={e => setActiveCamp(e.target.value || 'all')}
            style={{ background:C.bgInput, border:`1px solid ${activeCamp!=='all' ? C.gold : C.border}`,
              borderRadius:20, padding:'5px 14px', fontSize:11,
              color: activeCamp!=='all' ? C.gold : C.textMuted,
              fontFamily:FONTS.arabic, outline:'none', cursor:'pointer' }}
          >
            <option value="">اختر حملة...</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.title || c.slug} style={{ background:C.bgCard }}>
                {c.title || c.slug}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2.5fr 1.3fr 1.2fr 110px 100px 80px', padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.border}` }}>
          {['#', 'الاسم والشركة', 'الدولة', 'المنتج', 'الجودة', 'الحالة', 'عرض'].map(h => (
            <div key={h} style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>⏳ جارٍ تحميل البيانات...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>لا توجد بيانات — ابدأ بحثاً جديداً 🚀</div>
        ) : filtered.map((lead, i) => (
          <div key={lead.Id} style={{ display: 'grid', gridTemplateColumns: '40px 2.5fr 1.3fr 1.2fr 110px 100px 80px', padding: '0 20px', height: 64, alignItems: 'center', borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none', background: hoveredRow === i ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.15s' }}
            onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONTS.mono }}>{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{lead.title || lead.company_name || '—'}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{lead.phone || lead.website || ''}</div>
            </div>
            <div><span style={{ background: 'rgba(91,156,246,0.12)', color: C.info, fontSize: 11, padding: '3px 8px', borderRadius: 20 }}>{lead.country || '—'} · {lead.city || '—'}</span></div>
            <div style={{ fontSize: 13, color: C.textSec }}>{lead.product_searched || '—'}</div>
            <div><ScoreBar score={lead.data_score} /></div>
            <div><StatusBadge status={lead.status} /></div>
            <div>
              <button onClick={() => setSelectedLead(lead)} style={{ padding: '5px 12px', background: 'none', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6, color: C.textSec, fontSize: 12, cursor: 'pointer', fontFamily: FONTS.arabic, transition: 'all 0.15s' }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = C.gold; t.style.color = C.gold; t.style.background = 'rgba(200,168,75,0.06)'; }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = 'rgba(255,255,255,0.12)'; t.style.color = C.textSec; t.style.background = 'none'; }}
              >عرض</button>
            </div>
          </div>
        ))}
      </div>

      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
