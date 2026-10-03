'use client'

import { useEffect, useRef, useState } from 'react'
import { BellRing, Check, PhoneCall, ShieldCheck } from 'lucide-react'
import { PageIntro, ShellPage, Surface } from '@/components/site-shell'
import { friendlyError, supabase } from '@/lib/supabase'

type Alert = { id: string; created_at: string; device: string; category: string; score: number; level: string; snippet: string; status: string }

export default function Guardian() {
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [message, setMessage] = useState('')
  const known = useRef(new Set<string>())

  async function load(nextCode = code, initial = false) {
    if (!supabase || !nextCode) return
    const { data, error } = await supabase.rpc('get_alerts', { p_code: nextCode })
    if (error) return setMessage(friendlyError(error))
    const rows = (data ?? []) as Alert[]
    if (!initial && rows.some(row => !known.current.has(row.id))) {
      document.body.animate([{ backgroundColor: '#fee2e2' }, { backgroundColor: '#f8fafc' }], { duration: 700 })
      if ('Notification' in window && Notification.permission === 'granted') new Notification('ScamShield family alert', { body: 'A new high-risk message needs your attention.' })
      try { new Audio('/alert-tone.mp3').play().catch(() => {}) } catch {}
    }
    known.current = new Set(rows.map(row => row.id))
    setAlerts(rows)
  }

  async function connect() {
    const next = input.replace(/\D/g, '').slice(0, 6)
    if (next.length !== 6 || !supabase) return setMessage('Enter a valid 6-digit family code.')
    const { data, error } = await supabase.rpc('family_exists', { p_code: next })
    if (error || !data) return setMessage(error ? friendlyError(error) : 'That family code was not found.')
    setCode(next); setMessage('Guardian connected. Alerts refresh every 3 seconds.')
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    await load(next, true)
  }

  async function update(id: string, status: string) {
    if (!supabase) return
    const { error } = await supabase.rpc('update_alert_status', { p_id: id, p_code: code, p_status: status })
    if (error) setMessage(friendlyError(error)); else await load()
  }

  useEffect(() => { const saved = localStorage.getItem('scamshield_family_code'); if (saved) { setInput(saved); setCode(saved) } }, [])
  useEffect(() => { if (!code) return; load(code, true); const timer = window.setInterval(() => load(), 3000); return () => window.clearInterval(timer) }, [code])

  return <ShellPage><PageIntro eyebrow="Family Guardian" title="A calm second pair of eyes." description="Enter the shared code to see masked high-risk alerts. The original message never leaves the analyzer device." /><Surface><div className="flex flex-wrap gap-3"><input value={input} onChange={e => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit family code" inputMode="numeric" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" /><button onClick={connect} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Connect</button>{code && <span className="flex items-center gap-2 text-sm font-bold text-teal-700"><span className="size-2 rounded-full bg-teal-500" /> Live</span>}</div>{message && <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>}</Surface><div className="mt-5 grid gap-4">{alerts.length === 0 ? <Surface><BellRing className="text-teal-700" /><h2 className="mt-4 text-xl font-black">No alerts yet</h2><p className="mt-2 text-sm text-slate-500">New family alerts will appear here automatically.</p></Surface> : alerts.map(alert => <Surface key={alert.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><ShieldCheck className="text-red-600" /><h2 className="font-black">{alert.category}</h2></div><p className="mt-2 text-sm text-slate-500">{alert.device} · {new Date(alert.created_at).toLocaleString()}</p></div><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase text-red-700">{alert.level} · {alert.score}</span></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{alert.snippet}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => update(alert.id, 'acknowledged')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">Acknowledge</button><button onClick={() => update(alert.id, 'resolved')} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white"><Check /> Resolve</button><a href="tel:1930" className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"><PhoneCall /> Call 1930</a><a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`ScamShield family alert: ${alert.level} risk from ${alert.device}.`)}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">WhatsApp</a></div></Surface>)}</div></ShellPage>
}
