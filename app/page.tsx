'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Copy, ShieldCheck, Users } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { analyze } from '@/lib/detector'
import { friendlyError, supabase } from '@/lib/supabase'

function maskAlertSnippet(text: string) {
  return text.slice(0, 120).replace(/\d{4,}/g, '****').replace(/https?:\/\/[^\s]+/gi, '[link masked]')
}

const samples = [
  ['Digital arrest', 'This is CBI. Your parcel contains drugs. Stay on video call, transfer ₹50,000 immediately and do not tell anyone.'],
  ['Fake KYC', 'Your bank KYC expires today. Share PAN and OTP now or your account will be blocked.'],
  ['Safe message', 'Hi, call me when you are free. I wanted to check in.'],
] as const

export default function Page() {
  const [text, setText] = useState(samples[0][1])
  const [selected, setSelected] = useState(samples[0][1])
  const [familyCode, setFamilyCode] = useState('')
  const [device, setDevice] = useState('My phone')
  const [codeInput, setCodeInput] = useState('')
  const [familyMessage, setFamilyMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const result = useMemo(() => analyze(selected), [selected])

  useEffect(() => {
    setFamilyCode(localStorage.getItem('scamshield_family_code') ?? '')
    setDevice(localStorage.getItem('scamshield_device') ?? 'My phone')
  }, [])

  function saveFamily(code: string, nickname: string) {
    localStorage.setItem('scamshield_family_code', code)
    localStorage.setItem('scamshield_device', nickname || 'My phone')
    setFamilyCode(code)
    setDevice(nickname || 'My phone')
  }

  async function createFamily() {
    setFamilyMessage('')
    if (!supabase) return setFamilyMessage('Family protection is unavailable, but local analysis still works.')
    const { data, error } = await supabase.rpc('create_family')
    if (error || !data) return setFamilyMessage(friendlyError(error))
    const code = typeof data === 'string' ? data : data.code ?? data.p_code
    saveFamily(String(code), device)
    setFamilyMessage('Family code created. Share it with your trusted guardian.')
  }

  async function joinFamily() {
    const code = codeInput.replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) return setFamilyMessage('Enter a 6-digit family code.')
    if (!supabase) return setFamilyMessage('Family protection is unavailable, but local analysis still works.')
    const { data, error } = await supabase.rpc('family_exists', { p_code: code })
    if (error || !data) return setFamilyMessage(error ? friendlyError(error) : 'That family code was not found.')
    saveFamily(code, device)
    setFamilyMessage('Family code saved on this device.')
  }

  async function sendAlert() {
    if (result.score < 70 || !familyCode || sending || !supabase) return
    setSending(true)
    const { error } = await supabase.rpc('create_alert', { p_code: familyCode, p_device: device, p_category: result.categories[0] ?? 'Suspicious message', p_score: result.score, p_level: result.level, p_snippet: maskAlertSnippet(selected) })
    if (!error) setFamilyMessage('Your family has been alerted')
    else setFamilyMessage(friendlyError(error))
    setSending(false)
  }

  async function analyzeMessage(next = text) {
    const message = next.trim() || samples[0][1]
    setSelected(message)
    if (supabase) await supabase.rpc('add_scan_stat', { p_category: analyze(message).categories[0] ?? 'Safe', p_level: analyze(message).level, p_score: analyze(message).score, p_language: 'en' })
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`ScamShield alert: ${result.level} risk (${result.score}/100). Please check on your family guardian page.`)}`

  return <SiteShell><main className="min-h-screen bg-[#f6fbfb] text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-teal-700 text-white"><ShieldCheck /></div><div><p className="text-lg font-black">Scam<span className="text-teal-700">Shield</span></p><p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Private. Explainable. Local.</p></div></div><nav className="hidden gap-6 text-sm font-semibold text-slate-500 md:flex"><a href="#analyzer">Analyze</a><a href="/guardian">Family alerts</a><a href="/insights">Insights</a><a href="/report">Get help</a></nav></div></header><section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1fr_.9fr] lg:px-8"><div className="flex flex-col justify-center"><div className="mb-5 w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">Your messages stay on this device</div><h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-[-.055em] sm:text-6xl">Pause before the scam<br /><span className="text-teal-700">takes your money.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">Spot fraud patterns in messages and calls, then help your family act before it&apos;s too late.</p><a href="#analyzer" className="mt-8 flex w-fit items-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-bold text-white">Try the analyzer <ArrowRight /></a></div><div id="analyzer" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">Scam analyzer</p><h2 className="mt-1 text-2xl font-black">What did they send you?</h2><textarea value={text} onChange={e => setText(e.target.value)} className="mt-5 h-36 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-teal-500" /><div className="mt-3 flex gap-3"><button onClick={() => analyzeMessage()} className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Analyze message</button></div><div className="mt-5 flex flex-wrap gap-2">{samples.map(([label, sample]) => <button key={label} onClick={() => { setText(sample); analyzeMessage(sample) }} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">{label}</button>)}</div></div></section><section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8"><div aria-live="polite" className={`rounded-3xl border p-6 ${result.level === 'safe' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}><div className="flex flex-wrap items-center gap-5"><div className="grid size-20 place-items-center rounded-full border-8 border-red-300 bg-white text-2xl font-black text-red-700">{result.score}</div><div><div className="flex items-center gap-2 text-xl font-black">{result.level === 'safe' ? 'Looks safe' : `${result.level} risk`} {result.level === 'safe' ? <CheckCircle2 className="text-emerald-600" /> : <ShieldCheck className="text-red-600" />}</div><p className="mt-1 text-sm text-slate-600">{result.categories.length || 'No'} pattern groups matched.</p></div></div>{result.level !== 'safe' && <div className="mt-5 flex flex-wrap gap-3 border-t border-black/5 pt-5 text-sm font-bold"><a href="tel:1930" className="rounded-lg bg-red-600 px-3 py-2 text-white">Call 1930</a><button onClick={sendAlert} disabled={!familyCode || sending} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-700 disabled:opacity-50"><Users /> {familyCode ? 'Notify my family' : 'Set up family protection'}</button><a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3 py-2 text-slate-700">Share alert on WhatsApp</a></div>}</div><div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-2"><Users className="text-teal-700" /><h2 className="text-xl font-black">Family Protection</h2></div><p className="mt-2 text-sm text-slate-500">Create a private 6-digit code or connect to an existing family.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input value={device} onChange={e => setDevice(e.target.value)} placeholder="Device nickname" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" /><input value={codeInput} onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Existing 6-digit code" inputMode="numeric" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" /><button onClick={joinFamily} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Connect</button></div><button onClick={createFamily} className="mt-3 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white">Generate new code</button>{familyCode && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-teal-50 p-4"><span className="text-xs font-bold text-teal-800">Your family code</span><strong className="text-2xl tracking-[.25em] text-teal-900">{familyCode}</strong><button onClick={() => { navigator.clipboard.writeText(familyCode); setCopied(true) }} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold"><Copy /> {copied ? 'Copied' : 'Copy'}</button></div>}{familyMessage && <p className="mt-3 text-sm font-semibold text-teal-800">{familyMessage}</p>}</div></section></main></SiteShell>
}
