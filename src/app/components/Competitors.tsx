import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { C, FONTS } from './colors';

const API_BASE = 'https://api.agentcraft.info';

// ── Types ────────────────────────────────────────────────────────────────────
interface Competitor {
  name:       string;
  country:    string;
  flag:       string;
  type:       'local' | 'chinese';
  rating?:    number;
  address?:   string;
  price?:     string;
  moq?:       string;
  delivery?:  string;
  warranty?:  string;
  weakness:   string;
  source:     string;
}

interface AnalysisResult {
  competitors:      Competitor[];
  avg_price?:       string;
  avg_delivery?:    string;
  avg_warranty?:    string;
  golden_sentence_en: string;
  golden_sentence_de: string;
  golden_sentence_ar: string;
  summary:          string;
}

// ── Country helpers ──────────────────────────────────────────────────────────
const COUNTRIES = [
  'ألمانيا 🇩🇪','فرنسا 🇫🇷','هولندا 🇳🇱','إيطاليا 🇮🇹','إسبانيا 🇪🇸',
  'بريطانيا 🇬🇧','بولندا 🇵🇱','النمسا 🇦🇹','بلجيكا 🇧🇪','سويسرا 🇨🇭',
  'أمريكا 🇺🇸','كندا 🇨🇦','أستراليا 🇦🇺',
  'الإمارات 🇦🇪','السعودية 🇸🇦','قطر 🇶🇦','مصر 🇪🇬','المغرب 🇲🇦',
  'تركيا 🇹🇷','اليابان 🇯🇵','كوريا الجنوبية 🇰🇷',
];

const COUNTRY_EN: Record<string, string> = {
  'ألمانيا 🇩🇪':'Germany','فرنسا 🇫🇷':'France','هولندا 🇳🇱':'Netherlands',
  'إيطاليا 🇮🇹':'Italy','إسبانيا 🇪🇸':'Spain','بريطانيا 🇬🇧':'UK',
  'بولندا 🇵🇱':'Poland','النمسا 🇦🇹':'Austria','بلجيكا 🇧🇪':'Belgium',
  'سويسرا 🇨🇭':'Switzerland','أمريكا 🇺🇸':'USA','كندا 🇨🇦':'Canada',
  'أستراليا 🇦🇺':'Australia','الإمارات 🇦🇪':'UAE','السعودية 🇸🇦':'Saudi Arabia',
  'قطر 🇶🇦':'Qatar','مصر 🇪🇬':'Egypt','المغرب 🇲🇦':'Morocco',
  'تركيا 🇹🇷':'Turkey','اليابان 🇯🇵':'Japan','كوريا الجنوبية 🇰🇷':'South Korea',
};

// ── Hardcoded fallback (shown before any search) ─────────────────────────────
const DEMO_COMPETITORS: Competitor[] = [
  { name:'Shanghai Textile Co.', country:'الصين', flag:'🇨🇳', type:'chinese',
    price:'$12-18/unit', delivery:'45-60 يوم', warranty:'10 أشهر',
    weakness:'وقت شحن طويل — ميزتك: التسليم الأسرع', source:'Alibaba' },
  { name:'Mumbai Exports Ltd', country:'الهند', flag:'🇮🇳', type:'chinese',
    price:'$9-14/unit', delivery:'35-50 يوم', warranty:'8 أشهر',
    weakness:'جودة متوسطة — ميزتك: الجودة الأعلى', source:'Made-in-China' },
  { name:'Istanbul Trade Corp', country:'تركيا', flag:'🇹🇷', type:'local',
    price:'$18-28/unit', delivery:'20-30 يوم', warranty:'14 شهر',
    weakness:'أسعار مرتفعة — ميزتك: سعر أقل بجودة مماثلة', source:'Google Maps' },
];

// ── SSE event types (same pipeline as NewSearch) ─────────────────────────────
interface PipelineEvent {
  type:     string;
  message:  string;
  data:     Record<string, any>;
  progress: number;
}

// ── Card ─────────────────────────────────────────────────────────────────────
function CompetitorCard({ c, index }: { c: Competitor; index: number }) {
  const isLocal   = c.type === 'local';
  const accentColor = isLocal ? C.info : '#e25555';
  const typeLabel   = isLocal ? 'محلي' : 'صيني';

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accentColor}`,
      borderRadius: 12, padding: 18,
      animation: `slideIn 0.35s ease ${index * 0.07}s both`,
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
        <span style={{ fontSize:22 }}>{c.flag}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {c.name}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, color:C.textMuted }}>{c.country}</span>
            <span style={{
              fontSize:9, padding:'1px 6px', borderRadius:10,
              background: isLocal ? 'rgba(91,156,246,0.12)' : 'rgba(226,85,85,0.12)',
              color: accentColor,
            }}>{typeLabel}</span>
            <span style={{ fontSize:9, color:C.textMuted, background:'rgba(255,255,255,0.04)',
              padding:'1px 6px', borderRadius:10 }}>{c.source}</span>
          </div>
        </div>
        {c.rating != null && c.rating > 0 && (
          <div style={{ fontSize:11, color:C.gold, fontFamily:FONTS.mono, flexShrink:0 }}>
            ⭐ {c.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div style={{ marginBottom:12 }}>
        {[
          { label:'السعر',        val: c.price    },
          { label:'وقت التسليم',  val: c.delivery },
          { label:'الضمان',       val: c.warranty },
          { label:'العنوان',      val: c.address  },
        ].filter(m => m.val).map(m => (
          <div key={m.label} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'4px 0', borderBottom:`1px solid rgba(255,255,255,0.04)`,
          }}>
            <span style={{ fontSize:11, color:C.textMuted }}>{m.label}</span>
            <span style={{ fontSize:11, color:C.textPrimary, fontFamily:FONTS.mono,
              maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              textAlign:'left', direction:'ltr' }}>
              {m.val}
            </span>
          </div>
        ))}
      </div>

      {/* Weakness */}
      <div style={{
        borderTop:`1px solid ${C.border}`, paddingTop:10,
        fontSize:11, color:C.gold, lineHeight:1.5,
      }}>
        ⚡ {c.weakness}
      </div>
    </div>
  );
}

// ── Golden sentence display ───────────────────────────────────────────────────
function GoldenBlock({ result }: { result: AnalysisResult }) {
  const [lang, setLang] = useState<'en'|'de'|'ar'>('en');
  const sentences = { en: result.golden_sentence_en, de: result.golden_sentence_de, ar: result.golden_sentence_ar };
  const body = sentences[lang] || '';

  return (
    <div style={{
      background: C.bgCard, border:`1px solid rgba(45,212,160,0.2)`,
      borderTop:`2px solid ${C.success}`,
      borderRadius:14, padding:20, marginBottom:20,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:600, color:C.success }}>✨ الجملة الذهبية</div>
        <div style={{ display:'flex', gap:6 }}>
          {(['en','de','ar'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding:'2px 8px', borderRadius:10, fontSize:10, cursor:'pointer',
              background: lang===l ? 'rgba(45,212,160,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lang===l ? C.success : 'rgba(255,255,255,0.08)'}`,
              color: lang===l ? C.success : C.textMuted,
              fontFamily: FONTS.arabic,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Averages */}
      {(result.avg_price || result.avg_delivery || result.avg_warranty) && (
        <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
          {[
            { label:'متوسط السعر',     val: result.avg_price    },
            { label:'متوسط التسليم',   val: result.avg_delivery },
            { label:'متوسط الضمان',    val: result.avg_warranty },
          ].filter(s => s.val).map(s => (
            <div key={s.label} style={{
              background:'rgba(255,255,255,0.04)', borderRadius:8,
              padding:'6px 12px', fontSize:11,
            }}>
              <div style={{ color:C.textMuted, marginBottom:2 }}>{s.label}</div>
              <div style={{ color:C.textPrimary, fontFamily:FONTS.mono }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background:'rgba(45,212,160,0.04)', border:`1px solid rgba(45,212,160,0.12)`,
        borderRadius:10, padding:'12px 16px',
        fontSize:13, color:C.textPrimary, lineHeight:1.8,
        direction: lang==='ar' ? 'rtl' : 'ltr',
        textAlign: lang==='ar' ? 'right' : 'left',
      }}>
        {body || <span style={{ color:C.textMuted, fontSize:12 }}>لا توجد جملة بهذه اللغة</span>}
      </div>

      {body && (
        <button onClick={() => { navigator.clipboard.writeText(body); toast.success('تم النسخ'); }}
          style={{
            marginTop:10, padding:'6px 14px',
            background:'rgba(45,212,160,0.08)', border:`1px solid ${C.success}`,
            color:C.success, borderRadius:7, fontSize:11, cursor:'pointer',
            fontFamily:FONTS.arabic,
          }}>
          نسخ
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Competitors() {
  const [product,  setProduct]  = useState('');
  const [country,  setCountry]  = useState('');
  const [running,  setRunning]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [status,   setStatus]   = useState('');
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [elapsed,  setElapsed]  = useState(0);
  const [history,  setHistory]  = useState<{key:string; product:string; country:string; result:AnalysisResult}[]>([]);
  const abortRef  = useRef<AbortController | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef(0);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('competitors_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Timer
  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const handleSearch = async () => {
    if (!product.trim()) { toast.error('أدخل اسم المنتج'); return; }
    if (!country)        { toast.error('اختر الدولة');     return; }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setRunning(true);
    setResult(null);
    setProgress(0);
    setElapsed(0);
    setStatus('جارٍ الاتصال...');

    const countryEn = COUNTRY_EN[country] || country;

    // Load API keys
    let apify_token = '', anthropic_key = '';
    try {
      const kr = await fetch(`${API_BASE}/db/keys-raw`);
      if (kr.ok) { const kd = await kr.json(); apify_token = kd.apify_token || ''; anthropic_key = kd.anthropic_key || ''; }
    } catch {}
    if (!apify_token) {
      try { const stored = JSON.parse(localStorage.getItem('im_api_keys') || '{}'); apify_token = stored.apify_token || ''; anthropic_key = stored.anthropic_key || ''; } catch {}
    }

    try {
      const resp = await fetch(`${API_BASE}/industrial/competitors`, {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'X-Apify-Token':   apify_token,
          'X-Anthropic-Key': anthropic_key,
        },
        body: JSON.stringify({ product: product.trim(), country: countryEn, limit: 10 }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev: PipelineEvent = JSON.parse(line.slice(6));
            setProgress(ev.progress);
            setStatus(ev.message);

            if (ev.type === 'done' && ev.data.analysis) {
              const analysis = ev.data.analysis as AnalysisResult;
              setResult(analysis);
              // حفظ في localStorage
              const key = `${product.trim()}-${country}`;
              const newEntry = { key, product: product.trim(), country, result: analysis };
              setHistory(prev => {
                const updated = [newEntry, ...prev.filter(h => h.key !== key)].slice(0, 10);
                localStorage.setItem('competitors_history', JSON.stringify(updated));
                return updated;
              });
              toast.success(`✓ تم تحليل ${analysis.competitors?.length || 0} منافس`);
            }
            if (ev.type === 'error') { toast.error(ev.message); }
          } catch {}
        }
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('تعذّر الاتصال بالوكيل');
    } finally {
      setRunning(false);
    }
  };

  const competitors = result?.competitors || [];
  const local       = competitors.filter(c => c.type === 'local');
  const chinese     = competitors.filter(c => c.type === 'chinese');
  const showDemo    = !running && !result;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2,'0')} دقيقة` : `${secs} ثانية`;

  return (
    <div style={{ fontFamily:FONTS.arabic, direction:'rtl' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, color:C.textPrimary, margin:'0 0 6px' }}>
            تحليل المنافسين
          </h1>
          <p style={{ fontSize:13, color:C.textSec, margin:0 }}>
            منافسون محليون + صينيون — مع جملة ذهبية جاهزة للتواصل
          </p>
        </div>
        {/* History dropdown */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:C.textMuted, whiteSpace:'nowrap' }}>تحليل سابق:</span>
          <select
            onChange={e => {
              const entry = history.find(h => h.key === e.target.value);
              if (entry) { setResult(entry.result); setProduct(entry.product); setCountry(entry.country); }
            }}
            defaultValue=""
            disabled={history.length === 0}
            style={{ background:C.bgInput, border:`1px solid ${history.length > 0 ? C.border : 'rgba(255,255,255,0.04)'}`,
              borderRadius:8, padding:'7px 12px', fontSize:12,
              color: history.length > 0 ? C.textPrimary : C.textMuted,
              fontFamily:FONTS.arabic, outline:'none',
              cursor: history.length > 0 ? 'pointer' : 'not-allowed', maxWidth:220 }}>
            <option value="">{history.length > 0 ? 'اختر تحليلاً...' : 'لا توجد تحليلات سابقة'}</option>
            {history.map(h => (
              <option key={h.key} value={h.key} style={{ background:C.bgCard }}>
                {h.product} — {h.country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search form */}
      <div style={{
        background:C.bgCard, border:`1px solid ${C.border}`,
        borderTop:`2px solid ${C.gold}`, borderRadius:16, padding:24, marginBottom:20,
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          {/* Product */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>المنتج</div>
            <input value={product} onChange={e => setProduct(e.target.value)}
              placeholder="مثال: خلاط حمص صناعي..."
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'11px 14px', fontSize:14, color:C.textPrimary,
                fontFamily:FONTS.arabic, outline:'none', boxSizing:'border-box' as const }}
              onFocus={e => e.target.style.borderColor = C.gold}
              onBlur={e => e.target.style.borderColor = C.border}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          {/* Country */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>الدولة المستهدفة</div>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'11px 14px', fontSize:14,
                color: country ? C.textPrimary : C.textMuted,
                fontFamily:FONTS.arabic, outline:'none', cursor:'pointer', appearance:'none' as any,
                boxSizing:'border-box' as const }}
              onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            >
              <option value="">اختر الدولة...</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={{ background:C.bgCard }}>{c}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSearch} disabled={running || !product.trim() || !country}
          style={{
            width:'100%', height:48,
            background: (running || !product.trim() || !country) ? '#2a2210' : C.gold,
            color:       (running || !product.trim() || !country) ? '#6b5a2a' : '#0a0d12',
            border:'none', borderRadius:8, fontSize:14, fontWeight:700,
            cursor: (running || !product.trim() || !country) ? 'not-allowed' : 'pointer',
            fontFamily:FONTS.arabic, transition:'all 0.2s',
          }}>
          {running ? `⏳ جارٍ التحليل... ${timeStr}` : '▸ ابدأ تحليل المنافسين'}
        </button>
      </div>

      {/* Progress */}
      {running && (
        <div style={{
          background:C.bgCard, border:`1px solid ${C.border}`,
          borderRadius:12, padding:'16px 20px', marginBottom:20,
        }}>
          <div style={{ height:4, background:'#1c2330', borderRadius:2, overflow:'hidden', marginBottom:10 }}>
            <div style={{
              height:'100%', width:`${progress}%`,
              background:`linear-gradient(90deg, ${C.gold}, #f0c040)`,
              borderRadius:2, transition:'width 0.6s ease',
            }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
            <span style={{ color:C.textSec }}>{status}</span>
            <span style={{ color:C.gold, fontFamily:FONTS.mono }}>{progress}%</span>
          </div>
        </div>
      )}

      {/* Golden sentence */}
      {result && <GoldenBlock result={result} />}

      {/* Summary */}
      {result?.summary && (
        <div style={{
          background:'rgba(200,168,75,0.04)', border:`1px solid rgba(200,168,75,0.12)`,
          borderRadius:10, padding:'12px 16px', marginBottom:20,
          fontSize:13, color:C.textSec, lineHeight:1.7,
        }}>
          {result.summary}
        </div>
      )}

      {/* Results grid */}
      {(showDemo || competitors.length > 0) && (
        <>
          {/* Local competitors */}
          {(showDemo || local.length > 0) && (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:14, fontWeight:600, color:C.info }}>🏭 منافسون محليون</span>
                {!showDemo && (
                  <span style={{ background:'rgba(91,156,246,0.12)', color:C.info,
                    fontSize:11, padding:'2px 8px', borderRadius:10, fontFamily:FONTS.mono }}>
                    {local.length}
                  </span>
                )}
                {showDemo && (
                  <span style={{ fontSize:11, color:C.textMuted }}>(بيانات تجريبية — ابدأ بحثاً للحصول على بيانات حقيقية)</span>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
                {(showDemo ? DEMO_COMPETITORS.filter(c => c.type==='local') : local)
                  .map((c, i) => <CompetitorCard key={c.name} c={c} index={i} />)}
              </div>
            </div>
          )}

          {/* Chinese competitors */}
          {(showDemo || chinese.length > 0) && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:14, fontWeight:600, color:'#e25555' }}>🇨🇳 منافسون صينيون</span>
                {!showDemo && (
                  <span style={{ background:'rgba(226,85,85,0.12)', color:'#e25555',
                    fontSize:11, padding:'2px 8px', borderRadius:10, fontFamily:FONTS.mono }}>
                    {chinese.length}
                  </span>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
                {(showDemo ? DEMO_COMPETITORS.filter(c => c.type==='chinese') : chinese)
                  .map((c, i) => <CompetitorCard key={c.name} c={c} index={i} />)}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}
