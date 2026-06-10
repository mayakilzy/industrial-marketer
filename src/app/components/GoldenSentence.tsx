import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Copy, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { C, FONTS } from './colors';

const API_BASE = 'https://api.agentcraft.info';

interface GoldenRow {
  id: number; product: string;
  golden_sentence_en?: string; golden_sentence_de?: string;
  golden_sentence_ar?: string; golden_sentence_fr?: string;
  sentence_en?: string; sentence_de?: string;
  sentence_ar?: string; sentence_fr?: string;
  campaign_slug?: string; date_added?: string; created_at?: string;
  sentence?: string; golden_sentence?: string;
}

type LangKey = 'en' | 'de' | 'ar' | 'fr';

const LANG_LABELS: Record<LangKey, string> = {
  en:'English 🇬🇧', de:'Deutsch 🇩🇪', ar:'العربية 🇸🇦', fr:'Français 🇫🇷',
};
const LANG_COLORS: Record<LangKey, { bg:string; color:string }> = {
  en:{ bg:'rgba(45,212,160,0.12)', color:C.success },
  de:{ bg:'rgba(226,85,85,0.12)',  color:'#e25555' },
  ar:{ bg:'rgba(200,168,75,0.12)', color:C.gold    },
  fr:{ bg:'rgba(91,156,246,0.12)', color:C.info    },
};

function getSentence(row: GoldenRow, lang: LangKey): string {
  return (
    row[`sentence_${lang}` as keyof GoldenRow] as string ||
    row[`golden_sentence_${lang}` as keyof GoldenRow] as string ||
    row.golden_sentence || row.sentence || ''
  );
}
function hasAnySentence(row: GoldenRow): boolean {
  return (['en','de','ar','fr'] as LangKey[]).some(l => !!getSentence(row, l));
}
function formatDate(str?: string): string {
  if (!str) return '';
  try { return new Date(str).toLocaleDateString('ar-EG', { year:'numeric', month:'short', day:'numeric' }); }
  catch { return str; }
}
function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Sentence Card ─────────────────────────────────────────────────────────────
function SentenceCard({ row }: { row: GoldenRow }) {
  const [activeLang, setActiveLang] = useState<LangKey>('en');
  const availableLangs = (['en','de','ar','fr'] as LangKey[]).filter(l => !!getSentence(row, l));
  const body = getSentence(row, activeLang);
  const lc   = LANG_COLORS[activeLang];

  useEffect(() => {
    if (!getSentence(row, activeLang) && availableLangs.length > 0)
      setActiveLang(availableLangs[0]);
  }, [row]);

  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.gold}`,
      borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:C.textPrimary, display:'flex', alignItems:'center', gap:6 }}>
            <Sparkles size={14} color={C.gold} />{row.product || 'منتج غير محدد'}
          </div>
          {row.campaign_slug && <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>حملة: {row.campaign_slug}</div>}
        </div>
        {(row.date_added || row.created_at) && (
          <div style={{ fontSize:10, color:C.textMuted, background:'rgba(255,255,255,0.04)',
            padding:'3px 8px', borderRadius:20, flexShrink:0 }}>{formatDate(row.date_added || row.created_at)}</div>
        )}
      </div>
      {availableLangs.length > 1 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {availableLangs.map(l => {
            const isActive = l === activeLang;
            const lcc = LANG_COLORS[l];
            return (
              <button key={l} onClick={() => setActiveLang(l)} style={{
                padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer',
                background: isActive ? lcc.bg : 'rgba(255,255,255,0.04)',
                border:`1px solid ${isActive ? lcc.color : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? lcc.color : C.textMuted, fontFamily:FONTS.arabic,
              }}>{LANG_LABELS[l]}</button>
            );
          })}
        </div>
      )}
      <div style={{ background:'rgba(200,168,75,0.04)', border:`1px solid rgba(200,168,75,0.15)`,
        borderRadius:10, padding:'14px 16px', fontSize:14, color:C.textPrimary, lineHeight:1.8,
        direction: activeLang==='ar' ? 'rtl' : 'ltr', textAlign: activeLang==='ar' ? 'right' : 'left',
        minHeight:72 }}>
        {body || <span style={{ color:C.textMuted, fontSize:12 }}>لا توجد جملة بهذه اللغة</span>}
      </div>
      {body && (
        <button onClick={() => { navigator.clipboard.writeText(body); toast.success('✓ تم النسخ'); }}
          style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6,
            padding:'7px 14px', background:lc.bg, border:`1px solid ${lc.color}`,
            color:lc.color, borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:FONTS.arabic }}>
          <Copy size={12} /> نسخ
        </button>
      )}
    </div>
  );
}

// ── Quick PDF Upload ──────────────────────────────────────────────────────────
function QuickPDFUpload({ onGenerated }: { onGenerated: () => void }) {
  const [file,      setFile]      = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const pdf_base64 = await toBase64(file);
      const resp = await fetch(`${API_BASE}/user/analyze-pdf`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ pdf_base64, filename: file.name, product:'', market:'' }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      toast.success('✓ تم التحليل — تحديث الجمل الذهبية...');
      setTimeout(() => onGenerated(), 1500);
    } catch (e: any) {
      toast.error(`فشل: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ background:'rgba(200,168,75,0.04)', border:`1px dashed rgba(200,168,75,0.3)`,
      borderRadius:12, padding:20, marginBottom:24, textAlign:'center' }}>
      <div style={{ fontSize:13, color:C.textSec, marginBottom:12 }}>
        ارفع كتالوج PDF لاستنباط جملة ذهبية منه فوراً
      </div>
      <input ref={inputRef} type="file" accept=".pdf" style={{ display:'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
        <button onClick={() => inputRef.current?.click()}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
            background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`,
            borderRadius:8, color:C.textSec, fontSize:12, cursor:'pointer', fontFamily:FONTS.arabic }}>
          <Upload size={13} /> {file ? file.name : 'اختر ملف PDF'}
        </button>
        {file && (
          <button onClick={handleAnalyze} disabled={analyzing}
            style={{ padding:'8px 20px', background: analyzing ? '#2a2210' : C.gold,
              color: analyzing ? '#6b5a2a' : '#0a0d12', border:'none', borderRadius:8,
              fontSize:12, fontWeight:700, cursor: analyzing ? 'not-allowed' : 'pointer',
              fontFamily:FONTS.arabic }}>
            {analyzing ? '⏳ جارٍ التحليل...' : '▸ استنباط الجملة الذهبية'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function GoldenSentence() {
  const [rows,     setRows]     = useState<GoldenRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [campaign, setCampaign] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/db/golden-sentences`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const list: GoldenRow[] = Array.isArray(data) ? data : (data.items || data.results || []);
      setRows(list.filter(hasAnySentence));
    } catch (e: any) {
      toast.error(`تعذّر التحميل: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const campaigns = [...new Set(rows.map(r => r.campaign_slug).filter(Boolean))] as string[];
  const filtered  = rows.filter(r => {
    const matchText = !filter || (r.product || '').toLowerCase().includes(filter.toLowerCase());
    const matchCamp = !campaign || r.campaign_slug === campaign;
    return matchText && matchCamp;
  });

  return (
    <div style={{ fontFamily:FONTS.arabic, direction:'rtl' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:600, color:C.textPrimary, margin:'0 0 6px' }}>الجمل الذهبية ✨</h1>
        <p style={{ fontSize:13, color:C.textSec, margin:0 }}>جمل تنافسية جاهزة للاستخدام في رسائل التواصل</p>
      </div>

      {/* Quick PDF upload */}
      <QuickPDFUpload onGenerated={load} />

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, background:C.bgCard,
        border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 16px',
        alignItems:'center', flexWrap:'wrap' }}>
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="بحث بالمنتج..." style={{ flex:1, minWidth:160, background:C.bgInput,
            border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', fontSize:13,
            color:C.textPrimary, fontFamily:FONTS.arabic, outline:'none' }}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        {campaigns.length > 0 && (
          <select value={campaign} onChange={e => setCampaign(e.target.value)}
            style={{ background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8,
              padding:'8px 12px', fontSize:13, color: campaign ? C.textPrimary : C.textMuted,
              fontFamily:FONTS.arabic, outline:'none', cursor:'pointer' }}>
            <option value="">كل الحملات</option>
            {campaigns.map(c => <option key={c} value={c} style={{ background:C.bgCard }}>{c}</option>)}
          </select>
        )}
        <span style={{ background:'rgba(200,168,75,0.12)', color:C.gold,
          fontSize:11, padding:'4px 10px', borderRadius:10, fontFamily:FONTS.mono, flexShrink:0 }}>
          {filtered.length} جملة
        </span>
        <button onClick={load} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:5, background:'none',
            border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 12px',
            cursor:'pointer', color:C.textSec, fontSize:12, fontFamily:FONTS.arabic }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          تحديث
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:C.textMuted, fontSize:13 }}>⏳ جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 24px', background:C.bgCard,
          border:`1px solid ${C.border}`, borderRadius:16 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✨</div>
          <div style={{ fontSize:15, color:C.textPrimary, marginBottom:8 }}>لا توجد جمل ذهبية بعد</div>
          <div style={{ fontSize:13, color:C.textMuted }}>ارفع PDF أعلاه أو ابدأ بحثاً عن منافسين</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:16 }}>
          {filtered.map(row => <SentenceCard key={row.id} row={row} />)}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
