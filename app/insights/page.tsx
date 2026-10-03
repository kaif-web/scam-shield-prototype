'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageIntro, ShellPage, Surface } from '@/components/site-shell'
import { friendlyError, supabase } from '@/lib/supabase'
import { accuracySamples } from '@/lib/detector/samples'
import { analyze } from '@/lib/detector'

const demo = { by_category: [{ name: 'KYC', value: 42 }, { name: 'UPI', value: 34 }, { name: 'Parcel', value: 28 }, { name: 'APK', value: 23 }], by_level: [{ name: 'Safe', value: 54 }, { name: 'Suspicious', value: 25 }, { name: 'High', value: 14 }, { name: 'Critical', value: 7 }], last_14_days: [{ day: '1', scans: 12 }, { day: '3', scans: 18 }, { day: '5', scans: 15 }, { day: '7', scans: 29 }, { day: '9', scans: 24 }, { day: '11', scans: 36 }, { day: '13', scans: 31 }] }

export default function Insights() {
  const [stats, setStats] = useState<typeof demo>(demo)
  const [demoMode, setDemoMode] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { (async () => { if (!supabase) return; const { data, error: rpcError } = await supabase.rpc('get_stats'); if (rpcError) return setError(friendlyError(rpcError)); const raw = data as any; const total = [...(raw?.by_category ?? []), ...(raw?.by_level ?? [])].reduce((sum: number, row: any) => sum + Number(row.value ?? row.count ?? 0), 0); if (total > 0) { setStats({ by_category: raw.by_category ?? demo.by_category, by_level: raw.by_level ?? demo.by_level, last_14_days: raw.last_14_days ?? demo.last_14_days }); setDemoMode(false) } })() }, [])
  const rows = accuracySamples.map(s => ({ expected: s.label, result: analyze(s.text) })); const tp = rows.filter(x => x.expected === 'scam' && x.result.level !== 'safe').length; const fn = rows.filter(x => x.expected === 'scam' && x.result.level === 'safe').length
  return <ShellPage><PageIntro eyebrow="Insights" title="See the patterns, not the panic." description="Transparent activity metrics. Message text is never included." />{error && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}{demoMode && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Demo data · No scans have been recorded yet.</div>}<div className="grid gap-5 lg:grid-cols-2"><Surface><h2 className="font-black">Scans by category</h2><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.by_category}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Surface><Surface><h2 className="font-black">Scans over the last 14 days</h2><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={stats.last_14_days}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line type="monotone" dataKey="scans" stroke="#0f766e" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Surface><Surface><h2 className="font-black">Engine accuracy</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-teal-50 p-4"><p className="text-3xl font-black text-teal-800">{Math.round(tp / (tp + fn) * 100)}%</p><p className="text-xs font-bold text-slate-500">Detection rate</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-3xl font-black">Local</p><p className="text-xs font-bold text-slate-500">Private processing</p></div></div></Surface></div></ShellPage>
}
