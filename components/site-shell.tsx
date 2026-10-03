'use client'

import { Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hindi, setHindi] = useState(false)
  const [dark, setDark] = useState(false)
  const links = [
    ['Analyzer', '/'], ['Family Guardian', '/guardian'], ['Insights', '/insights'], ['Report Help', '/report'], ['Privacy', '/privacy'],
  ]
  const toggleTheme = () => { setDark(!dark); document.documentElement.classList.toggle('dark', !dark) }
  return <div className={dark ? 'dark' : ''}>
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        <a href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#0f766e] text-white"><ShieldCheck /></span><span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Scam<span className="text-[#0f766e]">Shield</span></span></a>
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">{links.map(([label, href]) => <a key={href} href={href} className={`transition hover:text-[#0f766e] ${pathname === href ? 'text-[#0f766e]' : 'text-slate-500 dark:text-slate-300'}`}>{label}</a>)}</nav>
        <div className="flex items-center gap-2"><button aria-label="Toggle language" onClick={() => setHindi(!hindi)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:text-white">{hindi ? 'EN' : 'हिन्दी'}</button><button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-full border border-slate-200 p-2 dark:border-slate-700 dark:text-white">{dark ? <Sun /> : <Moon />}</button><button aria-label="Open menu" onClick={() => setOpen(!open)} className="rounded-full border border-slate-200 p-2 md:hidden dark:border-slate-700 dark:text-white">{open ? <X /> : <Menu />}</button></div>
      </div>
      {open && <nav className="flex flex-col gap-1 border-t border-slate-200 px-5 py-3 md:hidden dark:border-slate-700">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-teal-50 dark:text-slate-200">{label}</a>)}</nav>}
    </header>{children}
    <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><p><strong className="text-slate-900 dark:text-white">ScamShield</strong> · 1930 helpline</p><p>Hypnexis&apos;26 prototype</p></div></footer>
  </div>
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-10 max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">{title}</h1><p className="mt-4 text-lg leading-8 text-slate-500 dark:text-slate-300">{description}</p></div> }

export function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</section> }

export function ShellPage({ children }: { children: React.ReactNode }) { return <SiteShell><main className="min-h-[calc(100vh-140px)] bg-[#f6fbfb] px-5 py-12 dark:bg-slate-950 lg:px-8"><div className="mx-auto max-w-7xl">{children}</div></main></SiteShell> }

