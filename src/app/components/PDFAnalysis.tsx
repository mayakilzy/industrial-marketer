import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { C, FONTS } from './colors';

const API_BASE = 'https://api.agentcraft.info';

interface AnalysisResult {
  products:         string[];
  quality_score:    number;
  pricing_analysis: string;
  strengths:        string[];
  gaps:             string[];
  certifications:   string[];
  target_markets:   string[];
  golden_sentence:  string;
  summary:          string;
}

const LANGUAGES = [
  { code:'ar', label:'العربية 🇸🇦' },
  { code:'en', label:'English 🇬🇧' },
  { code:'de', label:'Deutsch 🇩🇪' },
  { code:'fr', label:'Français 🇫🇷' },
];

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fetchCachedAnalysis(filename: string): Promise<AnalysisResult | null> {
  try {
    const r = await fetch(`${API_BASE}/db/pdf-analyses/by-filename?filename=${encodeURIComponent(filename)}`);
    if (!r.ok) return null;
    const data = await r.json();
    if (!data?.analysis) return null;
    return typeof data.analysis === 'string' ? JSON.parse(data.analysis) : data.analysis;
  } catch { return null; }
}

export function PDFAnalysis() {
  const [dragging,     setDragging]     = useState(false);
  const [file,         setFile]         = useState<File | null>(null);
  const [product,      setProduct]      = useState('');
  const [market,       setMarket]       = useState('');
  const [language,     setLanguage]     = useState('ar');
  const [analyzing,    setAnalyzing]    = useState(false);
  const [results,      setResults]      = useState<AnalysisResult | null>(null);
  const [fromCache,    setFromCache]    = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [focused1,     setFocused1]     = useState(false);
  const [focused2,     setFocused2]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(f: File) {
    if (f.type !== 'application/pdf') { toast.error('يرجى رفع ملف PDF فقط'); return; }
    setFile(f); setResults(null); setFromCache(false);
    toast.success(`تم اختيار: ${f.name}`);
    const cached = await fetchCachedAnalysis(f.name);
    if (cached) { setResults(cached); setFromCache(true); toast.success('✓ تم استرجاع التحليل من قاعدة البيانات'); }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelected(f);
  };

  const handleAnalyze = async () => {
    if (!file) { toast.error('يرجى رفع ملف PDF أولاً'); return; }
    setAnalyzing(true); setResults(null); setFromCache(false);
    try {
      const cached = await fetchCachedAnalysis(file.name);
      if (cached) { setResults(cached); setFromCache(true); toast.success('✓ تم استرجاع التحليل من قاعدة البيانات'); return; }

      const pdf_base64 = await toBase64(file);
      const resp = await fetch(`${API_BASE}/user/analyze-pdf`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          pdf_base64, filename: file.name,
          product: product.trim(), market: market.trim(),
          language,     // ← لغة التحليل
        }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.detail || `HTTP ${resp.status}`); }
      const data = await resp.json();
      setResults(data.analysis); setFromCache(false);
      toast.success('✓ اكتمل التحليل بنجاح');
    } catch (err: any) {
      toast.error(`فشل التحليل: ${err.message}`);
    } finally { setAnalyzing(false); }
  };

  const inputStyle = (focused: boolean) => ({
    width:'100%', background:C.bgInput,
    border:`1px solid ${focused ? C.gold : C.border}`,
    borderRadius:8, padding:'12px 16px', fontSize:14,
    color:C.textPrimary, fontFamily:FONTS.arabic, outline:'none',
    boxSizing:'border-box' as const,
    boxShadow: focused ? `0 0 0 3px rgba(200,168,75,0.1)` : 'none',
    transition:'all 0.15s',
  });

  return (
    <div style={{ fontFamily:FONTS.arabic, direction:'rtl', maxWidth:740, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
        background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.25)',
        borderRadius:8, marginBottom:20, fontSize:12, color:'#c084fc' }}>
        <span>👑</span>
        <span>هذه الميزة متاحة في خطة <strong>Pro</strong> — أنت مشترك حالياً</span>
      </div>

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:600, color:C.textPrimary, margin:'0 0 6px' }}>تحليل الكتالوج بالذكاء الاصطناعي</h1>
        <p style={{ fontSize:13, color:C.textSec, margin:0 }}>ارفع كتالوجك — يدعم المنتج الواحد أو كتالوج بعشرات المنتجات</p>
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={handleDrop} onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${dragging ? C.gold : C.borderGold}`, borderRadius:12, padding:'48px 24px',
          textAlign:'center', background: dragging ? 'rgba(200,168,75,0.06)' : 'rgba(200,168,75,0.03)',
          cursor:'pointer', marginBottom:20, transition:'all 0.2s' }}>
        <input ref={inputRef} type="file" accept=".pdf" style={{ display:'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = ''; }} />
        {file ? (
          <div>
            <FileText size={36} color={C.gold} style={{ margin:'0 auto 10px', display:'block' }} />
            <div style={{ fontSize:14, color:C.textPrimary, marginBottom:4 }}>{file.name}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{(file.size/1024/1024).toFixed(2)} MB</div>
            <div style={{ fontSize:11, color:C.gold, marginTop:6 }}>انقر لتغيير الملف</div>
          </div>
        ) : (
          <div>
            <Upload size={36} color={dragging ? C.gold : 'rgba(200,168,75,0.4)'} style={{ margin:'0 auto 12px', display:'block' }} />
            <div style={{ fontSize:14, color:C.textSec, marginBottom:6 }}>اسحب وأسقط ملف PDF هنا</div>
            <div style={{ fontSize:12, color:C.textMuted }}>PDF · حتى 10MB</div>
          </div>
        )}
      </div>

      {/* Form */}
      <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.gold}`,
        borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>المنتج (اختياري)</div>
            <input value={product} onChange={e => setProduct(e.target.value)}
              placeholder="اتركه فارغاً للتحليل الشامل..."
              onFocus={() => setFocused1(true)} onBlur={() => setFocused1(false)}
              style={inputStyle(focused1)} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>السوق المستهدف (اختياري)</div>
            <input value={market} onChange={e => setMarket(e.target.value)}
              placeholder="مثال: أوروبا الغربية..."
              onFocus={() => setFocused2(true)} onBlur={() => setFocused2(false)}
              style={inputStyle(focused2)} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>لغة التحليل</div>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'12px 14px', fontSize:13, color:C.textPrimary,
                fontFamily:FONTS.arabic, outline:'none', cursor:'pointer', boxSizing:'border-box' as const }}
              onFocus={e => e.currentTarget.style.borderColor = C.gold}
              onBlur={e => e.currentTarget.style.borderColor = C.border}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background:C.bgCard }}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleAnalyze} disabled={analyzing || !file}
          style={{ width:'100%', height:48,
            background: analyzing || !file ? '#2a2210' : C.gold,
            color:      analyzing || !file ? '#6b5a2a' : '#0a0d12',
            border:'none', borderRadius:8, fontSize:14, fontWeight:600,
            cursor: analyzing || !file ? 'not-allowed' : 'pointer',
            fontFamily:FONTS.arabic, transition:'all 0.2s' }}>
          {analyzing ? '⏳ جارٍ التحليل بـ Claude AI...'
            : fromCache ? '↻ إعادة التحليل (تجاهل الكاش)'
            : '▸ تحليل الكتالوج بالذكاء الاصطناعي'}
        </button>

        {!file && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.textMuted }}>
            <Database size={11} />
            <span>الملفات المحللة مسبقاً تُعرض فوراً من قاعدة البيانات</span>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:24,
          animation:'slideDown 0.3s ease' }}>

          {fromCache && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(45,212,160,0.08)', border:'1px solid rgba(45,212,160,0.2)',
              borderRadius:20, padding:'4px 12px', fontSize:11, color:C.success, marginBottom:16 }}>
              <Database size={11} /> مسترجع من قاعدة البيانات — لم يُستهلك رصيد Claude
            </div>
          )}

          <div style={{ fontSize:15, fontWeight:600, color:C.textPrimary, marginBottom:20 }}>نتائج التحليل</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div style={{ background:'#0a0d12', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>جودة الكتالوج</div>
              <div style={{ fontSize:'1.8rem', fontFamily:FONTS.mono, color: results.quality_score >= 80 ? C.success : C.gold }}>
                {results.quality_score}%
              </div>
              <div style={{ height:4, background:'#1c2330', borderRadius:2, marginTop:8 }}>
                <div style={{ width:`${results.quality_score}%`, height:'100%',
                  background: results.quality_score >= 80 ? C.success : C.gold, borderRadius:2 }} />
              </div>
            </div>
            <div style={{ background:'#0a0d12', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>تحليل التسعير</div>
              <div style={{ fontSize:13, color:C.textPrimary, lineHeight:1.6 }}>{results.pricing_analysis}</div>
            </div>
          </div>

          {results.summary && (
            <div style={{ padding:'12px 16px', marginBottom:16, background:'rgba(200,168,75,0.05)',
              border:`1px solid rgba(200,168,75,0.15)`, borderRadius:8, fontSize:13, color:C.textSec, lineHeight:1.7 }}>
              {results.summary}
            </div>
          )}

          {results.golden_sentence && (
            <div style={{ padding:'12px 16px', marginBottom:16, background:'rgba(45,212,160,0.05)',
              border:`1px solid rgba(45,212,160,0.2)`, borderRadius:8 }}>
              <div style={{ fontSize:11, color:C.success, marginBottom:6, fontWeight:600 }}>✨ الجملة الذهبية</div>
              <div style={{ fontSize:13, color:C.textPrimary, lineHeight:1.6,
                direction: language==='ar' ? 'rtl' : 'ltr', textAlign: language==='ar' ? 'right' : 'left' }}>
                {results.golden_sentence}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(results.golden_sentence); toast.success('تم النسخ'); }}
                style={{ marginTop:8, background:'none', border:`1px solid rgba(45,212,160,0.3)`,
                  color:C.success, borderRadius:6, padding:'4px 12px', fontSize:11,
                  cursor:'pointer', fontFamily:FONTS.arabic }}>نسخ</button>
            </div>
          )}

          {results.products?.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <button onClick={() => setShowProducts(p => !p)}
                style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
                  cursor:'pointer', color:C.textPrimary, fontSize:13, fontWeight:600,
                  fontFamily:FONTS.arabic, padding:0, marginBottom:8 }}>
                📦 المنتجات المكتشفة ({results.products.length})
                {showProducts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showProducts && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {results.products.map((p, i) => (
                    <span key={i} style={{ padding:'4px 10px', borderRadius:20, fontSize:11,
                      background:'rgba(200,168,75,0.1)', color:C.gold,
                      border:`1px solid rgba(200,168,75,0.2)` }}>{p}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <div style={{ fontSize:12, color:C.success, marginBottom:8, fontWeight:600 }}>✅ نقاط القوة</div>
              {results.strengths?.map((s, i) => (
                <div key={i} style={{ fontSize:12, color:C.textSec, marginBottom:6, display:'flex', gap:6 }}>
                  <span style={{ color:C.success, flexShrink:0 }}>▸</span><span>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:12, color:C.danger, marginBottom:8, fontWeight:600 }}>⚠️ نقاط تحتاج تحسين</div>
              {results.gaps?.map((g, i) => (
                <div key={i} style={{ fontSize:12, color:C.textSec, marginBottom:6, display:'flex', gap:6 }}>
                  <span style={{ color:C.danger, flexShrink:0 }}>▸</span><span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {(results.certifications?.length > 0 || results.target_markets?.length > 0) && (
            <div style={{ display:'flex', gap:16, marginTop:16, flexWrap:'wrap' }}>
              {results.certifications?.length > 0 && (
                <div>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:6 }}>الشهادات</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {results.certifications.map((c, i) => (
                      <span key={i} style={{ padding:'3px 8px', borderRadius:20, fontSize:11,
                        background:'rgba(91,156,246,0.12)', color:'#5b9cf6' }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {results.target_markets?.length > 0 && (
                <div>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:6 }}>الأسواق المناسبة</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {results.target_markets.map((m, i) => (
                      <span key={i} style={{ padding:'3px 8px', borderRadius:20, fontSize:11,
                        background:'rgba(45,212,160,0.1)', color:C.success }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
