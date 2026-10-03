'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, Eye, Link2, Mic, PhoneCall, ShieldCheck, Siren, Users, Volume2, VolumeX, Zap } from 'lucide-react'

const samples = [
  { label: 'Digital arrest', text: 'This is CBI. Your Aadhaar is linked to a money laundering case. Stay on video call and transfer ₹50,000 immediately. Do not tell anyone.' },
  { label: 'Fake KYC', text: 'Dear customer, your KYC will expire today. Update PAN and Aadhaar now at http://sbi-verify.example.apk or your account will be blocked.' },
  { label: 'Electricity bill', text: 'Your electricity connection will be disconnected within 30 minutes. Pay the pending bill immediately on this UPI ID to avoid disconnection.' },
  { label: 'Parcel scam', text: 'Your parcel contains drugs and has been seized by customs. Call this officer immediately or an arrest warrant will be issued.' },
  { label: 'APK / challan', text: 'RTO challan pending. Install this APK to view details and avoid penalty: http://tinyurl.com/rto-update.apk' },
  { label: 'Investment task', text: 'Earn guaranteed returns by completing tasks on Telegram. Deposit ₹2,000 now to unlock your commission.' },
  { label: 'Safe message', text: 'Hi, call me when you are free. I wanted to check in.' },
  { label: 'Real OTP', text: 'Your OTP is 123456. Do not share it with anyone. Valid for 10 minutes.' },
]

function analyze(text: string) {
  const lower = text.toLowerCase()
  const rules = [
    { category: 'Digital arrest / fake authority', words: ['cbi', 'police', 'customs', 'arrest', 'money laundering', 'video call', 'do not tell', 'giraftaar', 'गिरफ्तार'], weight: 28 },
    { category: 'Fake KYC / bank', words: ['kyc', 'aadhaar', 'pan', 'account blocked', 'sim block', 'credit card'], weight: 20 },
    { category: 'OTP / UPI / remote access', words: ['otp', 'upi pin', 'collect request', 'anydesk', 'teamviewer', 'scan to receive'], weight: 24 },
    { category: 'Parcel / courier', words: ['parcel', 'courier', 'drugs', 'customs', 'challan'], weight: 18 },
    { category: 'Utility disconnection', words: ['electricity', 'disconnected', 'gas bill', 'pending bill'], weight: 20 },
    { category: 'Job / investment scam', words: ['guaranteed returns', 'telegram', 'deposit', 'task', 'crypto', 'commission'], weight: 24 },
    { category: 'Malicious app or link', words: ['.apk', 'install this app', 'tinyurl', 'http://', 'https://'], weight: 22 },
  ]
  const matches = rules.filter((rule) => rule.words.some((word) => lower.includes(word)))
  const urgency = ['immediately', 'within 30 minutes', 'abhi', 'turant', 'today'].some((word) => lower.includes(word))
  const money = /₹|rs\.?|rupees|transfer|pay|deposit|upi/.test(lower)
  const secrecy = ['do not tell', 'kisi ko mat batana', 'secret', 'stay on call'].some((word) => lower.includes(word))
  const raw = matches.reduce((sum, item) => sum + item.weight, 0) + (urgency ? 14 : 0) + (money ? 16 : 0) + (secrecy ? 18 : 0)
  const score = Math.min(99, Math.round(100 * (1 - Math.exp(-raw / 92))))
  const level = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'suspicious' : 'safe'
  const reasons = [...matches.map((item) => `Detected ${item.category.toLowerCase()}`), urgency && 'Creates urgency or a deadline', money && 'Requests money, payment or financial action', secrecy && 'Attempts to isolate you from family or support'].filter(Boolean) as string[]
  return { score, level, categories: matches.map((item) => item.category), reasons: reasons.length ? reasons : ['No common scam patterns detected'], links: (text.match(/https?:\/\/\S+/g) ?? []) }
}

export default function Page() {
  const [text, setText] = useState('')
  const [selected, setSelected] = useState(samples[0].text)
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN')
  const [isListening, setIsListening] = useState(false)
  const result = useMemo(() => analyze(selected), [selected])
  const isHindi = language === 'HI'
  const levelCopy = { safe: isHindi ? 'सुरक्षित लगता है' : 'Looks safe', suspicious: isHindi ? 'सावधानी ज़रूरी है' : 'Stay cautious', high: isHindi ? 'उच्च जोखिम' : 'High risk', critical: isHindi ? 'तुरंत रुकें' : 'Critical risk' }
  const analyzeText = () => setSelected(text.trim() || samples[0].text)
  const startListening = () => {
    const Speech = (window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition
    if (!Speech) return
    const recognition = new Speech()
    recognition.lang = isHindi ? 'hi-IN' : 'en-IN'
    recognition.continuous = true
    recognition.onresult = (event) => { const transcript = Array.from(event.results).map((r) => r[0].transcript).join(' '); setText(transcript); setSelected(transcript) }
    recognition.onend = () => setIsListening(false)
    recognition.start(); setIsListening(true)
  }

  return (
    <main className="min-h-screen bg-[#f6fbfb] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-[#0f766e] text-white shadow-lg shadow-teal-900/15"><ShieldCheck /></div><div><p className="text-lg font-black tracking-tight">Scam<span className="text-[#0f766e]">Shield</span></p><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Private. Explainable. Local.</p></div></div>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 md:flex"><a className="text-slate-900" href="#analyzer">Analyze</a><a href="/guardian">Family alerts</a><a href="/insights">Insights</a><a href="/report">Get help</a></nav>
          <div className="flex items-center gap-2"><button onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold shadow-sm">{language === 'EN' ? 'हिन्दी' : 'English'}</button><a href="/guardian" className="hidden rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white sm:block">Guardian login</a></div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-12 pt-14 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:pb-20 lg:pt-20">
        <div className="flex flex-col justify-center"><div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800"><span className="size-2 rounded-full bg-teal-500" /> Your messages stay on this device</div><h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl">Pause before the scam<br /><span className="text-[#0f766e]">takes your money.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">Scam Shield spots fraud patterns in calls, SMS and WhatsApp messages — in English, हिन्दी and Hinglish — and helps your family act before it&apos;s too late.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#analyzer" className="flex items-center gap-2 rounded-xl bg-[#0f766e] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal-800/20">Try a sample scam <ArrowRight /></a><a href="/report" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700">How to report <ClipboardCheck /></a></div><div className="mt-9 flex flex-wrap gap-5 text-xs font-semibold text-slate-500"><span className="flex items-center gap-2"><Eye className="text-teal-600" /> No cloud analysis</span><span className="flex items-center gap-2"><Zap className="text-teal-600" /> Works offline</span><span className="flex items-center gap-2"><Users className="text-teal-600" /> Family-first</span></div></div>
        <div id="analyzer" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/5 sm:p-7"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Scam analyzer</p><h2 className="mt-1 text-2xl font-black tracking-tight">What did they send you?</h2></div><div className="flex rounded-lg bg-slate-100 p-1"><button onClick={() => setLanguage('EN')} className={`rounded-md px-2.5 py-1 text-xs font-bold ${language === 'EN' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>EN</button><button onClick={() => setLanguage('HI')} className={`rounded-md px-2.5 py-1 text-xs font-bold ${language === 'HI' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>हि</button></div></div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={isHindi ? 'SMS या WhatsApp संदेश यहां पेस्ट करें...' : 'Paste an SMS, WhatsApp message or call transcript...'} className="h-36 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /><div className="mt-3 flex items-center justify-between gap-3"><button onClick={startListening} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${isListening ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'}`}><Mic /> {isListening ? 'Listening…' : 'Voice mode'}</button><button onClick={analyzeText} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Analyze message <ArrowRight /></button></div><div className="mt-5"><p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Or try a sample</p><div className="flex flex-wrap gap-2">{samples.map((sample) => <button key={sample.label} onClick={() => { setText(sample.text); setSelected(sample.text) }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50">{sample.label}</button>)}</div></div></div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8"><div aria-live="polite" className={`rounded-3xl border p-5 sm:p-7 ${result.level === 'safe' ? 'border-emerald-200 bg-emerald-50' : result.level === 'suspicious' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-5"><div className={`grid size-20 shrink-0 place-items-center rounded-full border-8 bg-white text-2xl font-black ${result.level === 'safe' ? 'border-emerald-300 text-emerald-700' : result.level === 'suspicious' ? 'border-amber-300 text-amber-700' : 'border-red-300 text-red-700'}`}>{result.score}</div><div><div className="flex items-center gap-2"><p className="text-xl font-black">{levelCopy[result.level as keyof typeof levelCopy]}</p>{result.level === 'safe' ? <CheckCircle2 className="text-emerald-600" /> : <AlertTriangle className="text-red-600" />}</div><p className="mt-1 text-sm text-slate-600">{isHindi ? 'आपके संदेश का स्थानीय विश्लेषण' : 'Local analysis of your message'} · {result.categories.length || 'No'} pattern groups matched</p></div></div><div className="flex flex-wrap gap-2">{result.reasons.slice(0, 3).map((reason) => <span key={reason} className="rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700">{reason}</span>)}</div></div>{result.level !== 'safe' && <div className="mt-6 flex flex-wrap gap-3 border-t border-black/5 pt-5 text-sm font-bold"><span className="flex items-center gap-2"><PhoneCall className="text-red-600" /> Hang up</span><span className="flex items-center gap-2"><ShieldCheck className="text-red-600" /> Never share OTP or PIN</span><a href="tel:1930" className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white">Call 1930</a><button className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-700"><Users /> Notify my family</button></div>}</div></section>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><p><strong className="text-slate-900">ScamShield</strong> · Built for safer digital India</p><div className="flex gap-5"><a href="/insights">Insights</a><a href="/report">Report help</a><a href="/guardian">Guardian</a></div></div></footer>
    </main>
  )
}
