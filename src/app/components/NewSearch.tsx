import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, X, Download } from 'lucide-react';
import { C, FONTS } from './colors';

const AGENT_BASE = 'https://api.agentcraft.info';

const LANGUAGES = ['الألمانية 🇩🇪', 'الإنكليزية 🇬🇧', 'الفرنسية 🇫🇷', 'العربية 🇸🇦', 'الإيطالية 🇮🇹', 'الإسبانية 🇪🇸'];
const COUNTRIES = [
  'ألمانيا 🇩🇪', 'فرنسا 🇫🇷', 'هولندا 🇳🇱', 'إيطاليا 🇮🇹', 'إسبانيا 🇪🇸',
  'بريطانيا 🇬🇧', 'بولندا 🇵🇱', 'النمسا 🇦🇹', 'بلجيكا 🇧🇪', 'سويسرا 🇨🇭',
  'السويد 🇸🇪', 'الدنمارك 🇩🇰', 'النرويج 🇳🇴', 'فنلندا 🇫🇮', 'البرتغال 🇵🇹',
  'اليونان 🇬🇷', 'رومانيا 🇷🇴', 'التشيك 🇨🇿', 'المجر 🇭🇺', 'كرواتيا 🇭🇷',
  'أمريكا 🇺🇸', 'كندا 🇨🇦', 'المكسيك 🇲🇽', 'البرازيل 🇧🇷', 'الأرجنتين 🇦🇷',
  'كولومبيا 🇨🇴', 'تشيلي 🇨🇱', 'بيرو 🇵🇪',
  'تركيا 🇹🇷', 'إسطنبول 🇹🇷', 'غازي عنتاب 🇹🇷', 'بورصة 🇹🇷', 'أنقرة 🇹🇷',
  'الإمارات 🇦🇪', 'السعودية 🇸🇦', 'قطر 🇶🇦', 'الكويت 🇰🇼', 'البحرين 🇧🇭',
  'عُمان 🇴🇲', 'الأردن 🇯🇴', 'مصر 🇪🇬', 'المغرب 🇲🇦', 'تونس 🇹🇳', 'الجزائر 🇩🇿',
  'أستراليا 🇦🇺', 'نيوزيلندا 🇳🇿', 'اليابان 🇯🇵', 'كوريا الجنوبية 🇰🇷',
  'سنغافورة 🇸🇬', 'ماليزيا 🇲🇾', 'إندونيسيا 🇮🇩', 'تايلاند 🇹🇭',
  'جنوب أفريقيا 🇿🇦', 'نيجيريا 🇳🇬', 'كينيا 🇰🇪', 'إثيوبيا 🇪🇹', 'غانا 🇬🇭', 'السنغال 🇸🇳',
];

const LANG_CODE: Record<string, string> = {
  'الألمانية 🇩🇪': 'de', 'الإنكليزية 🇬🇧': 'en', 'الفرنسية 🇫🇷': 'fr',
  'العربية 🇸🇦': 'ar', 'الإيطالية 🇮🇹': 'it', 'الإسبانية 🇪🇸': 'es',
};

const COUNTRY_EN: Record<string, string> = {
  'ألمانيا 🇩🇪': 'Germany', 'فرنسا 🇫🇷': 'France', 'هولندا 🇳🇱': 'Netherlands',
  'إيطاليا 🇮🇹': 'Italy', 'إسبانيا 🇪🇸': 'Spain', 'بريطانيا 🇬🇧': 'UK',
  'الإمارات 🇦🇪': 'UAE', 'السعودية 🇸🇦': 'Saudi Arabia', 'أمريكا 🇺🇸': 'USA',
  'كندا 🇨🇦': 'Canada', 'النمسا 🇦🇹': 'Austria', 'بلجيكا 🇧🇪': 'Belgium',
  'سويسرا 🇨🇭': 'Switzerland', 'أستراليا 🇦🇺': 'Australia', 'البرتغال 🇵🇹': 'Portugal',
  'بولندا 🇵🇱': 'Poland', 'السويد 🇸🇪': 'Sweden', 'الدنمارك 🇩🇰': 'Denmark',
  'النرويج 🇳🇴': 'Norway', 'فنلندا 🇫🇮': 'Finland', 'اليونان 🇬🇷': 'Greece',
  'رومانيا 🇷🇴': 'Romania', 'التشيك 🇨🇿': 'Czech Republic', 'المجر 🇭🇺': 'Hungary',
  'كرواتيا 🇭🇷': 'Croatia', 'المكسيك 🇲🇽': 'Mexico', 'البرازيل 🇧🇷': 'Brazil',
  'الأرجنتين 🇦🇷': 'Argentina', 'كولومبيا 🇨🇴': 'Colombia', 'تشيلي 🇨🇱': 'Chile',
  'بيرو 🇵🇪': 'Peru', 'قطر 🇶🇦': 'Qatar', 'الكويت 🇰🇼': 'Kuwait',
  'البحرين 🇧🇭': 'Bahrain', 'عُمان 🇴🇲': 'Oman', 'الأردن 🇯🇴': 'Jordan',
  'مصر 🇪🇬': 'Egypt', 'المغرب 🇲🇦': 'Morocco', 'تونس 🇹🇳': 'Tunisia',
  'تركيا 🇹🇷': 'Turkey', 'إسطنبول 🇹🇷': 'Istanbul Turkey',
  'غازي عنتاب 🇹🇷': 'Gaziantep Turkey', 'بورصة 🇹🇷': 'Bursa Turkey',
  'أنقرة 🇹🇷': 'Ankara Turkey', 'الجزائر 🇩🇿': 'Algeria',
  'نيوزيلندا 🇳🇿': 'New Zealand', 'اليابان 🇯🇵': 'Japan',
  'كوريا الجنوبية 🇰🇷': 'South Korea', 'سنغافورة 🇸🇬': 'Singapore',
  'ماليزيا 🇲🇾': 'Malaysia', 'إندونيسيا 🇮🇩': 'Indonesia', 'تايلاند 🇹🇭': 'Thailand',
  'جنوب أفريقيا 🇿🇦': 'South Africa', 'نيجيريا 🇳🇬': 'Nigeria', 'كينيا 🇰🇪': 'Kenya',
  'إثيوبيا 🇪🇹': 'Ethiopia', 'غانا 🇬🇭': 'Ghana', 'السنغال 🇸🇳': 'Senegal',
};

interface Lead {
  title: string; company_name?: string; city?: string; country?: string;
  phone?: string; website?: string; email?: string; rating?: number;
  data_score?: number; source?: string; status?: string;
  outreach_message?: string; outreach_message_de?: string; outreach_message_en?: string;
  outreach_message_fr?: string; outreach_message_ar?: string;
}

interface PipelineEvent {
  type: string; message: string; data: Record<string, any>; progress: number;
}

interface Campaign {
  id: number; slug: string; product: string; country: string;
  language: string; total_leads: number; created_at: string;
}

// ── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(leads: Lead[], campaign: string) {
  const headers = ['الاسم', 'المدينة', 'الدولة', 'الهاتف', 'الإيميل', 'الموقع', 'الجودة', 'المصدر'];
  const rows = leads.map(l => [
    l.title || '', l.city || '', l.country || '', l.phone || '',
    l.email || '', l.website || '', l.data_score || '', l.source || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${campaign || 'results'}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success('✓ تم تصدير النتائج كـ CSV');
}

// ── Lead Modal ───────────────────────────────────────────────────────────────
function LeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const msg = lead.outreach_message_de || lead.outreach_message_en ||
              lead.outreach_message_fr || lead.outreach_message_ar ||
              lead.outreach_message || '';
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, animation:'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.bgCard, border:`1px solid ${C.borderMed}`,
        borderTop:`2px solid ${C.gold}`, borderRadius:16, width:580, maxWidth:'90vw', maxHeight:'85vh',
        overflowY:'auto', animation:'slideUp 0.25s ease', fontFamily:FONTS.arabic, direction:'rtl' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'20px 24px', borderBottom:`1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:C.textPrimary }}>{lead.title}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{lead.city} · {lead.country}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${C.border}`,
            borderRadius:8, width:32, height:32, display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer', color:C.textSec, fontSize:16 }}>×</button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          {[
            { label:'الهاتف',  value: lead.phone   },
            { label:'الإيميل', value: lead.email   },
            { label:'الموقع',  value: lead.website },
            { label:'المصدر',  value: lead.source  },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} style={{ display:'flex', gap:16, marginBottom:10 }}>
              <div style={{ fontSize:12, color:C.textMuted, minWidth:80, flexShrink:0 }}>{label}:</div>
              <div style={{ fontSize:13, color:C.textPrimary, direction:'ltr', textAlign:'right' }}>{value}</div>
            </div>
          ))}
          {msg && (
            <>
              <div style={{ height:1, background:C.border, margin:'16px 0' }} />
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>رسالة التواصل:</div>
              <div style={{ background:'rgba(200,168,75,0.05)', border:`1px solid rgba(200,168,75,0.15)`,
                borderRadius:8, padding:'14px 16px', fontSize:13, color:C.textPrimary, lineHeight:1.8,
                direction:'ltr', textAlign:'left', whiteSpace:'pre-wrap' }}>{msg}</div>
              <button onClick={() => { navigator.clipboard.writeText(msg); toast.success('تم النسخ'); }}
                style={{ marginTop:10, width:'100%', height:38, background:'rgba(200,168,75,0.1)',
                  border:`1px solid ${C.gold}`, color:C.gold, borderRadius:8, fontSize:13,
                  cursor:'pointer', fontFamily:FONTS.arabic }}>نسخ الرسالة</button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ steps, states }: { steps: {id:string; label:string}[]; states: Record<string,'idle'|'running'|'done'> }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:16 }}>
      {steps.map((step, i) => {
        const state = states[step.id] || 'idle';
        const color = state === 'done' ? C.success : state === 'running' ? C.gold : C.textMuted;
        const icon  = state === 'done' ? '✓' : state === 'running' ? '⟳' : String(i + 1);
        return (
          <React.Fragment key={step.id}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ width:32, height:32, borderRadius:'50%',
                background: state === 'idle' ? 'rgba(255,255,255,0.04)' : `${color}22`,
                border:`2px solid ${color}`, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:12, color,
                animation: state === 'running' ? 'spin 1s linear infinite' : 'none' }}>
                {icon}
              </div>
              <div style={{ fontSize:10, color, textAlign:'center', maxWidth:70 }}>{step.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex:1, height:2, background: states[steps[i+1].id] !== 'idle' ? C.gold : C.border,
                margin:'0 4px', marginBottom:24, transition:'background 0.5s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Lead Card ─────────────────────────────────────────────────────────────────
function LeadCard({ lead, index, onSelect }: { lead: Lead; index: number; onSelect: () => void }) {
  const score = lead.data_score || 0;
  const scoreColor = score >= 10 ? C.success : score >= 7 ? C.gold : C.danger;
  const hasMsg = !!(lead.outreach_message_de || lead.outreach_message_en ||
                    lead.outreach_message_fr || lead.outreach_message_ar || lead.outreach_message);
  return (
    <div onClick={onSelect} style={{ background:C.bgCard, border:`1px solid ${C.border}`,
      borderTop:`2px solid ${score >= 10 ? C.success : score >= 7 ? C.gold : C.border}`,
      borderRadius:12, padding:'16px 18px', cursor:'pointer',
      animation:`slideIn 0.3s ease ${index * 0.05}s both`,
      transition:'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ fontWeight:600, fontSize:14, color:C.textPrimary, flex:1, paddingLeft:8 }}>{lead.title}</div>
        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontSize:11, color:'#f5c842' }}>★</span>
          <span style={{ fontSize:12, color:C.textSec, fontFamily:FONTS.mono }}>{lead.rating?.toFixed(1) || '—'}</span>
        </div>
      </div>
      <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>
        {[lead.city, lead.country].filter(Boolean).join(' · ')}
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        {lead.email  && <span style={{ fontSize:10, background:'rgba(45,212,160,0.1)', color:C.success, padding:'2px 6px', borderRadius:4 }}>✉ {lead.email}</span>}
        {lead.phone  && <span style={{ fontSize:10, background:'rgba(200,168,75,0.1)', color:C.gold, padding:'2px 6px', borderRadius:4 }}>📞</span>}
        {lead.website && <span style={{ fontSize:10, background:'rgba(91,156,246,0.1)', color:C.info, padding:'2px 6px', borderRadius:4 }}>🌐</span>}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:50, height:3, background:'#1c2330', borderRadius:2 }}>
            <div style={{ width:`${score * 10}%`, height:'100%', background:scoreColor, borderRadius:2 }} />
          </div>
          <span style={{ fontSize:10, color:scoreColor, fontFamily:FONTS.mono }}>{score}/10</span>
        </div>
        {hasMsg && <span style={{ fontSize:10, color:C.success }}>✉️ رسالة جاهزة</span>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function NewSearch() {
  const [product,  setProduct]  = useState('');
  const [country,  setCountry]  = useState('');
  const [count,    setCount]    = useState('10');
  const [lang,     setLang]     = useState('الألمانية 🇩🇪');
  const [running,  setRunning]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepStates, setStepStates] = useState<Record<string, 'idle'|'running'|'done'>>({});
  const [currentMsg, setCurrentMsg] = useState('');
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [elapsed,  setElapsed]  = useState(0);
  const [done,     setDone]     = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<string>('');
  const [lastSlug, setLastSlug] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const xhrRef   = useRef<AbortController | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  // Load campaigns on mount
  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    try {
      const r = await fetch(`${AGENT_BASE}/db/campaigns`);
      const data = await r.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadCampaignLeads(slug: string) {
    try {
      const r = await fetch(`${AGENT_BASE}/db/leads?campaign_slug=${encodeURIComponent(slug)}&limit=200`);
      const data = await r.json();
      setLeads(Array.isArray(data) ? data : []);
      setDone(true);
      setActiveCampaign(slug);
    } catch { toast.error('تعذّر تحميل الحملة'); }
  }

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const handleEvent = (event: PipelineEvent) => {
    setProgress(event.progress);
    setCurrentMsg(event.message);
    switch (event.type) {
      case 'step_start':
        if (event.message.includes('Routing') || event.message.includes('route'))
          setStepStates(s => ({ ...s, route: 'running' }));
        else if (event.message.includes('Hunt') || event.message.includes('Search') || event.message.includes('import'))
          setStepStates(s => ({ ...s, route:'done', hunt:'running' }));
        else if (event.message.includes('email') || event.message.includes('Scrapling'))
          setStepStates(s => ({ ...s, hunt:'done', email:'running' }));
        else if (event.message.includes('Writing') || event.message.includes('message'))
          setStepStates(s => ({ ...s, email:'done', write:'running' }));
        else if (event.message.includes('Saving'))
          setStepStates(s => ({ ...s, write:'done', save:'running' }));
        break;
      case 'step_done':
        if (event.message.includes('Source') || event.message.includes('Query'))
          setStepStates(s => ({ ...s, route:'done' }));
        else if (event.message.includes('importer') || event.message.includes('Found'))
          setStepStates(s => ({ ...s, hunt:'done' }));
        else if (event.message.includes('email'))
          setStepStates(s => ({ ...s, email:'done' }));
        else if (event.message.includes('message') || event.message.includes('written'))
          setStepStates(s => ({ ...s, write:'done' }));
        else if (event.message.includes('Saved'))
          setStepStates(s => ({ ...s, save:'done' }));
        break;
      case 'lead_found':
        setLeads(prev => prev.some(l => l.title === event.data.title) ? prev : [...prev, event.data as Lead]);
        break;
      case 'lead_saved':
        setLeads(prev => prev.map(l => l.title === event.data.title
          ? { ...l, outreach_message: event.data.outreach_message, status: event.data.status,
              outreach_message_de: event.data.outreach_message_de, outreach_message_en: event.data.outreach_message_en,
              outreach_message_fr: event.data.outreach_message_fr, outreach_message_ar: event.data.outreach_message_ar }
          : l));
        break;
      case 'done':
        setStepStates({ route:'done', hunt:'done', email:'done', write:'done', save:'done' });
        setRunning(false); setDone(true);
        if (event.data.leads) setLeads(event.data.leads as Lead[]);
        if (event.data.slug) { setLastSlug(event.data.slug); loadCampaigns(); }
        toast.success(`🎯 ${event.data.saved} مستورد جاهزون في "${event.data.slug}"`);
        break;
      case 'error':
        setRunning(false);
        toast.error(event.message);
        break;
    }
  };

  const handleStart = async () => {
    if (!product.trim()) { toast.error('يرجى إدخال المنتج'); return; }
    if (!country)        { toast.error('يرجى اختيار الدولة'); return; }

    let anthropicKey = '';
    try {
      const kr = await fetch(`${AGENT_BASE}/db/keys-raw`);
      if (kr.ok) { const kd = await kr.json(); anthropicKey = kd.anthropic_key || ''; }
    } catch {}
    if (!anthropicKey) {
      try { const s = JSON.parse(localStorage.getItem('im_api_keys') || '{}'); anthropicKey = s.anthropic_key || ''; } catch {}
    }

    if (xhrRef.current) xhrRef.current.abort();
    xhrRef.current = new AbortController();

    setRunning(true); setDone(false); setLeads([]);
    setProgress(0); setElapsed(0); setStepStates({});
    setActiveCampaign('');

    const countryEn = COUNTRY_EN[country] || country;
    const langCode  = LANG_CODE[lang] || 'de';
    const senderInfo = { company:'Shahrour Equipment', origin:'Turkey', warranty:'2 years', delivery:'10 days', certs:'CE, ISO' };

    try {
      const resp = await fetch(`${AGENT_BASE}/industrial/search`, {
        method:'POST', signal: xhrRef.current.signal,
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          product: product.trim(), country: countryEn, count: parseInt(count),
          language: langCode, ...senderInfo,
          sender_company: senderInfo.company, sender_origin: senderInfo.origin,
          sender_warranty: senderInfo.warranty, sender_delivery: senderInfo.delivery,
          sender_certs: senderInfo.certs,
          nocodb_template_table_id: 'm32eju6rv9tx1zj',
          'x-anthropic-key': anthropicKey,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try { handleEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') { setRunning(false); toast.error('تعذّر الاتصال بالوكيل'); }
    }
  };

  const mins   = Math.floor(elapsed / 60);
  const secs   = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2,'0')} دقيقة` : `${secs} ثانية`;

  const steps = [
    { id:'route', label:'اختيار المصدر' },
    { id:'hunt',  label:'صيد المستوردين' },
    { id:'email', label:'استخراج الإيميلات' },
    { id:'write', label:'كتابة الرسائل' },
    { id:'save',  label:'حفظ في قاعدة البيانات' },
  ];

  const displaySlug = activeCampaign || lastSlug;

  return (
    <div style={{ fontFamily:FONTS.arabic, direction:'rtl' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, color:C.textPrimary, margin:'0 0 6px' }}>بحث جديد</h1>
          <p style={{ fontSize:13, color:C.textSec, margin:0 }}>ابحث عن مستوردين دوليين وأرسل لهم رسائل مخصصة</p>
        </div>

        {/* ── Campaigns dropdown ── */}
        {campaigns.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:C.textMuted }}>حملة سابقة:</span>
            <select
              value={activeCampaign}
              onChange={e => { if (e.target.value) loadCampaignLeads(e.target.value); }}
              style={{ background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'7px 12px', fontSize:12, color:C.textPrimary,
                fontFamily:FONTS.arabic, outline:'none', cursor:'pointer', maxWidth:200 }}
            >
              <option value="">اختر حملة...</option>
              {campaigns.map(c => (
                <option key={c.slug} value={c.slug} style={{ background:C.bgCard }}>
                  {c.product} — {c.country} ({c.total_leads})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Search Form ── */}
      <div style={{ background:C.bgCard, border:`1px solid ${C.border}`,
        borderTop:`2px solid ${C.gold}`, borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 80px 1.2fr', gap:12, marginBottom:16 }}>
          {/* Product + PDF */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>المنتج</div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={product} onChange={e => setProduct(e.target.value)}
                placeholder="مثال: خلاط حمص صناعي..."
                style={{ flex:1, background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8,
                  padding:'11px 14px', fontSize:14, color:C.textPrimary, fontFamily:FONTS.arabic,
                  outline:'none', boxSizing:'border-box' as const }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.border}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
              <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display:'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setPdfFile(f); if (!product.trim()) setProduct(f.name.replace('.pdf','').replace(/_/g,' ')); toast.success(`📄 ${f.name}`); }
                  e.target.value = '';
                }}
              />
              <button onClick={() => pdfInputRef.current?.click()}
                title="رفع كتالوج PDF" aria-label="رفع PDF"
                style={{ flexShrink:0, width:44, height:44,
                  background: pdfFile ? 'rgba(200,168,75,0.15)' : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${pdfFile ? C.gold : C.border}`,
                  borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                📄
              </button>
            </div>
            {pdfFile && (
              <div style={{ fontSize:11, color:C.gold, marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{pdfFile.name}</span>
                <button onClick={() => setPdfFile(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, padding:0, fontSize:12 }}>✕</button>
              </div>
            )}
          </div>
          {/* Country */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>الدولة</div>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'11px 14px', fontSize:14, color: country ? C.textPrimary : C.textMuted,
                fontFamily:FONTS.arabic, outline:'none', cursor:'pointer', appearance:'none' as any,
                boxSizing:'border-box' as const }}
              onFocus={e => e.currentTarget.style.borderColor = C.gold}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            >
              <option value="">اختر...</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={{ background:C.bgCard }}>{c}</option>)}
            </select>
          </div>
          {/* Count */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>العدد</div>
            <input value={count} onChange={e => setCount(e.target.value)} type="number" min="1" max="50"
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'11px 10px', fontSize:14, color:C.textPrimary, textAlign:'center',
                outline:'none', boxSizing:'border-box' as const }}
              onFocus={e => e.target.style.borderColor = C.gold}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          {/* Language */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>لغة الرسائل</div>
            <select value={lang} onChange={e => setLang(e.target.value)}
              style={{ width:'100%', background:C.bgInput, border:`1px solid ${C.border}`, borderRadius:8,
                padding:'11px 14px', fontSize:13, color:C.textPrimary,
                fontFamily:FONTS.arabic, outline:'none', cursor:'pointer', appearance:'none' as any,
                boxSizing:'border-box' as const }}
              onFocus={e => e.currentTarget.style.borderColor = C.gold}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            >
              {LANGUAGES.map(l => <option key={l} value={l} style={{ background:C.bgCard }}>{l}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleStart} disabled={running || !product.trim() || !country}
          style={{ width:'100%', height:48,
            background: (running || !product.trim() || !country) ? '#2a2210' : C.gold,
            color:      (running || !product.trim() || !country) ? '#6b5a2a' : '#0a0d12',
            border:'none', borderRadius:8, fontSize:14, fontWeight:700,
            cursor: (running || !product.trim() || !country) ? 'not-allowed' : 'pointer',
            fontFamily:FONTS.arabic, transition:'all 0.2s' }}>
          {running ? `⏳ جارٍ البحث... ${timeStr}` : '▸ ابدأ الاستخبارات التصديرية'}
        </button>
      </div>

      {/* ── Progress ── */}
      {(running || (done && leads.length > 0)) && (
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`,
          borderRadius:12, padding:'20px 24px', marginBottom:20 }}>
          <StepIndicator steps={steps} states={stepStates} />
          <div style={{ height:4, background:'#1c2330', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${progress}%`,
              background:`linear-gradient(90deg, ${C.gold}, #f0c040)`,
              borderRadius:2, transition:'width 0.6s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
            <span style={{ color:C.textSec }}>{currentMsg}</span>
            <span style={{ color:C.gold, fontFamily:FONTS.mono }}>{progress}%</span>
          </div>
        </div>
      )}

      {/* ── Results Header ── */}
      {leads.length > 0 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:15, fontWeight:600, color:C.textPrimary }}>
              المستوردون المكتشفون
            </span>
            <span style={{ background:'rgba(200,168,75,0.15)', color:C.gold,
              fontSize:12, padding:'2px 10px', borderRadius:10, fontFamily:FONTS.mono }}>
              {leads.length}
            </span>
            {done && <span style={{ fontSize:11, color:C.success }}>✓ جاهزون للتواصل</span>}
            {displaySlug && (
              <span style={{ fontSize:11, color:C.textMuted, background:'rgba(255,255,255,0.04)',
                padding:'2px 8px', borderRadius:10 }}>
                {displaySlug}
              </span>
            )}
          </div>

          {/* Export button */}
          {done && leads.length > 0 && (
            <button
              onClick={() => exportToCSV(leads, displaySlug)}
              style={{ display:'flex', alignItems:'center', gap:6,
                padding:'8px 16px', background:'rgba(45,212,160,0.08)',
                border:`1px solid ${C.success}`, borderRadius:8,
                color:C.success, fontSize:12, cursor:'pointer', fontFamily:FONTS.arabic }}>
              <Download size={13} />
              تصدير CSV
            </button>
          )}
        </div>
      )}

      {/* ── Leads Grid ── */}
      {leads.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
          {leads.map((lead, i) => (
            <LeadCard key={`${lead.title}-${i}`} lead={lead} index={i}
              onSelect={() => setSelectedLead(lead)} />
          ))}
        </div>
      )}

      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
