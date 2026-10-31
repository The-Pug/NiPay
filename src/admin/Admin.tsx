import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowLeftRight, Bell, BookOpen, ChevronsLeft, ChevronsRight, ClipboardCheck, Fingerprint, Landmark, LayoutDashboard,
  LogOut, Menu, Network, PieChart, Radio, Scale, Search, ShieldAlert, SlidersHorizontal, Users as UsersIcon, Zap, Gavel, ScrollText,
} from 'lucide-react';
import { api } from '../lib/api';
import { errText } from '../shared/atoms';
import {
  BarChart, Button, Col, DataTable, DL, Distribution, Drawer, Empty, ErrorState, Kpi, LineChart, Note, PageHeader, Panel, SearchInput, Select, Skeleton,
  Status, Tag, ago, dateOnly, dt, inr, num,
} from './ui';

// ---------- session + polling ----------
const TK = 'nipay:admin:token';
const useAdmin = () => {
  const [tok, setTok] = useState<string | null>(sessionStorage.getItem(TK));
  const [who, setWho] = useState<{ name: string; role: string } | null>(JSON.parse(sessionStorage.getItem(TK + 'who') || 'null'));
  const logout = useCallback(() => { sessionStorage.removeItem(TK); sessionStorage.removeItem(TK + 'who'); setTok(null); setWho(null); }, []);
  const call = useCallback(async (path: string, body?: unknown) => {
    try { return await api(path, { token: tok, body, method: body !== undefined ? 'POST' : 'GET' }); }
    catch (e: any) { if (e?.status === 401) logout(); throw e; }
  }, [tok, logout]);
  const login = async (u: string, p: string) => { const r = await api('/admin/login', { body: { username: u, password: p } }); sessionStorage.setItem(TK, r.token); sessionStorage.setItem(TK + 'who', JSON.stringify({ name: r.name, role: r.role })); setTok(r.token); setWho({ name: r.name, role: r.role }); };
  const canDecide = who?.role === 'SUPER_ADMIN' || who?.role === 'FRAUD_INVESTIGATOR';
  return { tok, who, call, login, logout, canDecide, isSuper: who?.role === 'SUPER_ADMIN' };
};
type A = ReturnType<typeof useAdmin>;
type P = { a: A; q: URLSearchParams };

function usePoll<T>(call: (p: string) => Promise<T>, path: string, ms = 0): { data: T | null; err: string | null; reload: () => void; at: Date | null } {
  const [data, setData] = useState<T | null>(null); const [err, setErr] = useState<string | null>(null); const [at, setAt] = useState<Date | null>(null);
  const reload = useCallback(() => { call(path).then((d) => { setData(d); setErr(null); setAt(new Date()); }).catch((e) => setErr(errText(e))); }, [call, path]);
  useEffect(() => { reload(); if (!ms) return; const t = setInterval(reload, ms); return () => clearInterval(t); }, [reload, ms]);
  return { data, err, reload, at };
}

// ---------- navigation ----------
type NavItem = { key: string; label: string; icon: React.ElementType };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Overview', items: [{ key: 'overview', label: 'Overview', icon: LayoutDashboard }] },
  { group: 'Operations', items: [
    { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight }, { key: 'live-ledger', label: 'Live Ledger', icon: Radio },
    { key: 'live', label: 'Live Monitor', icon: Activity }, { key: 'users', label: 'Users & Wallets', icon: UsersIcon },
    { key: 'review', label: 'Review Queue', icon: ClipboardCheck }, { key: 'appeals', label: 'Appeals', icon: Gavel }] },
  { group: 'Financial Management', items: [
    { key: 'ledger', label: 'Bank Ledger', icon: Landmark }, { key: 'reconciliation', label: 'Financial Reconciliation', icon: Scale },
    { key: 'analytics', label: 'Analytics', icon: PieChart }, { key: 'flow', label: 'Flow Map', icon: Network }] },
  { group: 'Security & Compliance', items: [
    { key: 'security', label: 'Security Logs', icon: ShieldAlert }, { key: 'same-id', label: 'Same-ID Log', icon: Fingerprint }, { key: 'audit', label: 'Audit Log', icon: ScrollText }] },
  { group: 'Configuration', items: [{ key: 'rules', label: 'Rules & Months', icon: BookOpen }, { key: 'settings', label: 'System Settings', icon: SlidersHorizontal }] },
];
const findNav = (k: string) => { for (const g of NAV) { const i = g.items.find((x) => x.key === k); if (i) return { group: g.group, item: i }; } return null; };
const ROLE: Record<string, string> = { SUPER_ADMIN: 'Super admin', FRAUD_INVESTIGATOR: 'Fraud investigator', READ_ONLY: 'Auditor (read only)' };
const go = (path: string) => { location.hash = '#/' + path; };

export function Admin({ page }: { page: string }) {
  const a = useAdmin();
  if (!a.tok) return <Login a={a} />;
  if (page === 'live-ledger') return <LiveLedger a={a} />;
  return <Shell a={a} page={page} />;
}

function Login({ a }: { a: A }) {
  const [u, setU] = useState('admin'); const [p, setP] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(null); try { await a.login(u, p); } catch (x) { setErr(errText(x)); } finally { setBusy(false); } };
  return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-slate-200 rounded-md shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5"><Logo /><div><p className="text-[15px] font-semibold text-slate-900">NiPay Operations</p><p className="text-[12px] text-slate-500">Bank administration console</p></div></div>
        <label className="block"><span className="text-[12px] font-medium text-slate-600">Username</span>
          <input value={u} onChange={(e) => setU(e.target.value)} data-testid="ad-user" autoComplete="username" className="mt-1 w-full h-9 rounded-md border border-slate-300 px-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" /></label>
        <label className="block"><span className="text-[12px] font-medium text-slate-600">Password</span>
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} data-testid="ad-pass" autoComplete="current-password" className="mt-1 w-full h-9 rounded-md border border-slate-300 px-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" /></label>
        <ErrorState msg={err} />
        <Button tone="primary" type="submit" disabled={busy} data-testid="ad-login" className="w-full h-9">{busy ? 'Signing in…' : 'Sign in'}</Button>
        <Note>Accounts: admin, risk, auditor. Passwords are generated on first start and kept in backend/data/secrets.json.</Note>
      </form>
    </div>
  );
}
const Logo = () => <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>;

function Shell({ a, page }: { a: A; page: string }) {
  const [collapsed, setCollapsed] = useState(localStorage.getItem('nipay:admin:nav') === '1');
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState('');
  const pulse = usePoll<any>(a.call, '/admin/dashboard', 15000);
  const key = page.split('?')[0];
  const nav = findNav(key) ?? findNav('overview')!;
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '');
  useEffect(() => { setMobile(false); }, [page]);
  const toggle = () => { localStorage.setItem('nipay:admin:nav', collapsed ? '0' : '1'); setCollapsed(!collapsed); };
  const Page = ({ overview: Overview, transactions: Transactions, live: Live, users: Users, review: Review, appeals: Appeals, ledger: Ledger, reconciliation: Reconciliation,
    analytics: Analytics, flow: Flow, security: Security, 'same-id': SameId, audit: Audit, rules: Rules, settings: SystemSettings } as Record<string, React.FC<P>>)[nav.item.key] ?? Overview;
  const notif = pulse.data?.notifications ?? 0;
  const side = (
    <nav aria-label="Main" className={`h-full flex flex-col bg-white border-r border-slate-200 ${collapsed ? 'w-14' : 'w-60'} transition-[width] duration-150`}>
      <div className={`h-14 flex items-center gap-2.5 border-b border-slate-200 ${collapsed ? 'justify-center' : 'px-4'}`}><Logo />{!collapsed && <div className="leading-tight"><p className="text-[14px] font-semibold text-slate-900">NiPay</p><p className="text-[11px] text-slate-500">Operations console</p></div>}</div>
      <div className="flex-1 overflow-y-auto py-3">
        {NAV.map((g) => (
          <div key={g.group} className="mb-3">
            {!collapsed && <p className="px-4 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{g.group}</p>}
            {g.items.map((it) => { const on = it.key === nav.item.key; const Icon = it.icon; return (
              <a key={it.key} href={`#/${it.key}`} title={collapsed ? it.label : undefined} aria-current={on ? 'page' : undefined}
                className={`relative flex items-center gap-2.5 h-8 text-[13px] ${collapsed ? 'justify-center mx-2 rounded-md' : 'mx-2 px-2.5 rounded-md'} ${on ? 'bg-blue-50 text-blue-800 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] -ml-2 rounded-r bg-blue-600" />}
                <Icon className={`w-4 h-4 shrink-0 ${on ? 'text-blue-700' : 'text-slate-400'}`} />{!collapsed && <span className="truncate">{it.label}</span>}
                {!collapsed && it.key === 'review' && (pulse.data?.activity?.pending_reviews ?? 0) > 0 && <span className="ml-auto text-[11px] tabular-nums rounded bg-slate-100 px-1.5 text-slate-600">{pulse.data.activity.pending_reviews}</span>}
              </a>); })}
          </div>))}
      </div>
      <button onClick={toggle} className="hidden lg:flex items-center gap-2 h-10 border-t border-slate-200 px-4 text-[12px] text-slate-500 hover:text-slate-800 cursor-pointer" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronsRight className="w-4 h-4 mx-auto" /> : <><ChevronsLeft className="w-4 h-4" />Collapse</>}</button>
    </nav>
  );
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 flex">
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">{side}</div>
      {mobile && <div className="lg:hidden fixed inset-0 z-40 flex"><div className="h-full">{side}</div><div className="flex-1 bg-slate-900/20" onClick={() => setMobile(false)} /></div>}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6">
          <button className="lg:hidden p-1.5 rounded hover:bg-slate-100 cursor-pointer" aria-label="Open menu" onClick={() => setMobile(true)}><Menu className="w-5 h-5" /></button>
          <div className="min-w-0"><p className="text-[11px] text-slate-400 truncate">{nav.group} <span className="mx-1">/</span></p><p className="text-[14px] font-semibold text-slate-900 -mt-0.5 truncate">{nav.item.label}</p></div>
          <form className="ml-auto hidden md:flex items-center relative" onSubmit={(e) => { e.preventDefault(); if (search.trim()) go(`users?q=${encodeURIComponent(search.trim())}`); }} role="search">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name or phone" aria-label="Search users" className="h-8 w-72 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2 text-[13px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </form>
          <span className="hidden xl:inline text-[11px] text-slate-400 whitespace-nowrap" title="Last data refresh">Updated {pulse.at ? pulse.at.toLocaleTimeString('en-IN') : '…'}</span>
          <a href="#/review" className="relative p-1.5 rounded hover:bg-slate-100 md:ml-0 ml-auto" aria-label={`${notif} items need attention`} title="Alerts (24h), open reviews and pending appeals">
            <Bell className="w-[18px] h-[18px] text-slate-600" />{notif > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">{notif > 99 ? '99+' : notif}</span>}</a>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[12px] font-semibold flex items-center justify-center uppercase">{a.who?.name?.[0] ?? '?'}</div>
            <div className="hidden sm:block leading-tight"><p className="text-[13px] font-medium text-slate-800">{a.who?.name}</p><p className="text-[11px] text-slate-500">{ROLE[a.who?.role ?? ''] ?? a.who?.role}</p></div>
            <button onClick={a.logout} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Sign out" title="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto"><Page a={a} q={q} /></main>
      </div>
    </div>
  );
}

// ---------- shared cells ----------
const TYPE_ICON: Record<string, string> = { 'Offline payment': 'P2P', 'Top-up': 'Top-up', 'Move to bank': 'To bank', 'Opening credit': 'Opening', 'Lost-phone forfeit': 'Forfeit' };
const txCols: Col<any>[] = [
  { key: 'id', label: 'Transaction ID', render: (t) => <span className="font-mono text-[12px] text-slate-700">{t.id}</span>, sort: (t) => t.id },
  { key: 'sender', label: 'Sender', render: (t) => <span className="text-slate-800">{t.sender}</span>, sort: (t) => t.sender },
  { key: 'receiver', label: 'Receiver', render: (t) => <span className="text-slate-800">{t.receiver}</span>, sort: (t) => t.receiver },
  { key: 'amount', label: 'Amount', align: 'right', render: (t) => <span className="font-medium">{inr(t.amount)}</span>, sort: (t) => t.amount },
  { key: 'type', label: 'Type', render: (t) => <Tag>{TYPE_ICON[t.type] ?? t.type}</Tag>, sort: (t) => t.type },
  { key: 'at', label: 'Date & time', render: (t) => <span className="text-slate-600 whitespace-nowrap">{dt(t.at)}</span>, sort: (t) => t.at ?? '' },
  { key: 'status', label: 'Status', render: (t) => <Status s={t.status} />, sort: (t) => t.status },
];
function TxDrawer({ t, onClose }: { t: any; onClose: () => void }) {
  return (
    <Drawer title={`${t.type} · ${inr(t.amount)}`} sub={<span className="font-mono">{t.id}</span>} onClose={onClose}>
      <div><Status s={t.status} /></div>
      <DL items={[['Sender', t.sender], ['Receiver', t.receiver], ['Amount', inr(t.amount)], ...(t.fee ? [['Fee', inr(t.fee)] as [string, React.ReactNode]] : []), ['Created', dt(t.at)], ['Settled at bank', t.settled_at ? dt(t.settled_at) : 'Not yet'],
        ...(t.ref ? [['Reference', <span className="font-mono text-[12px]">{t.ref}</span>] as [string, React.ReactNode]] : []), ...(t.transport ? [['Channel', t.transport.toUpperCase()] as [string, React.ReactNode]] : [])]} />
      {t.points && <div><p className="text-[12px] font-semibold text-slate-700 mb-2">Points in this payment</p>
        <DL items={[['Settled', num(t.points.paid ?? 0)], ['Waiting for sync', num(t.points.pending ?? 0)], ['Held for review', num(t.points.held ?? 0)]]} />
        {t.reasons?.length > 0 && <Note>Bank notes: {t.reasons.join(', ')}</Note>}</div>}
      {t.ledger && <div><p className="text-[12px] font-semibold text-slate-700 mb-2">Ledger movement</p>
        <DL items={[['Wallet balance', t.ledger.main], ['Send credits', t.ledger.send], ['Receive credits', t.ledger.receive], ['Bank-held', t.ledger.bank_held], ['Fees', t.ledger.fees]].map(([k, v]) => [k as string, <span className={`tabular-nums ${Number(v) > 0 ? 'text-emerald-700' : Number(v) < 0 ? 'text-rose-700' : 'text-slate-400'}`}>{Number(v) > 0 ? '+' : ''}{num(Number(v))}</span>])} /></div>}
    </Drawer>
  );
}

// ---------- Overview ----------
function Overview({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/dashboard', 5000);
  const [tx, setTx] = useState<any>(null);
  if (!d) return <><PageHeader title="Overview" /><ErrorState msg={err} retry={reload} />{!err && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Panel key={i}><Skeleton rows={3} /></Panel>)}</div>}</>;
  const label = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const t = d.transactions, u = d.users, act = d.activity;
  return (
    <div className="space-y-4">
      <PageHeader title="Overview" sub="Live operational position. Every figure is computed from stored records." />
      <ErrorState msg={err} retry={reload} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Registered users" value={num(u.total)} testid="kpi-users" rows={[['Active (7d)', num(u.active_7d)], ['Suspended', num(u.suspended)], ['New (7d)', num(u.new_7d)]]} />
        <Kpi label="Total user wallet credits" value={inr(d.wallets.total)} testid="kpi-wallets" foot={`Sum of ${num(d.wallets.users_counted)} user wallet balances. Excludes send, receive and bank-held credits.`} />
        <Kpi label="Transactions today" value={num(t.today)} testid="kpi-today" rows={[['Successful', num(t.successful)], ['Pending', num(t.pending)], ['Under review', num(t.under_review)]]} foot="Status counts are for all offline payments to date." />
        <Kpi label="Pending transactions" value={num(t.pending)} testid="kpi-pending" foot="Offline payments whose points have not all reached the bank. They settle at the next sync." />
      </div>
      <Panel title="System activity" flush>
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
          {([['Active user sessions', act.active_sessions, 'users'], ['Pending reviews', act.pending_reviews, 'review'], ['Security alerts (24h)', act.alerts_24h, 'security'], ['Held claims (points)', act.held_claims, 'same-id'], ['Appeals awaiting decision', act.pending_appeals, 'appeals']] as [string, number, string][]).map(([l, v, to]) => (
            <a key={l} href={`#/${to}`} className="px-4 py-3 hover:bg-slate-50"><p className="text-[12px] text-slate-500">{l}</p><p className={`text-[18px] font-semibold tabular-nums ${v > 0 && to !== 'users' ? 'text-amber-700' : 'text-slate-900'}`}>{num(v)}</p></a>))}
        </div>
      </Panel>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Payment volume · last 14 days" actions={<span className="text-slate-400">{inr(d.series.reduce((s: number, x: any) => s + x.amount, 0))} total</span>}>
          <BarChart data={d.series.map((x: any) => ({ label: label(x.date), value: x.amount }))} format={inr} />
        </Panel>
        <Panel title="Registered users · last 14 days" actions={<span className="text-slate-400">+{num(d.series.reduce((s: number, x: any) => s + x.new_users, 0))} new</span>}>
          <LineChart data={d.series.map((x: any) => ({ label: label(x.date), value: x.total_users }))} />
        </Panel>
        <Panel title="Payment status distribution" actions={<span className="text-slate-400">{num(t.payments_total)} payments</span>}>
          <Distribution parts={[{ label: 'Successful', value: t.successful, color: '#10b981' }, { label: 'Pending', value: t.pending, color: '#f59e0b' }, { label: 'Under review', value: t.under_review, color: '#8b5cf6' }]} />
          <div className="mt-4"><Note>Refused payments end on the phone and never reach the bank, so there is no failed status to count.</Note></div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Recent transactions" className="xl:col-span-2" flush actions={<a href="#/transactions" className="text-blue-700 hover:underline">View all</a>}>
          <DataTable cols={txCols} rows={d.recent_transactions} rowKey={(r: any) => r.id} onRow={setTx} pageSize={8} empty="No transactions yet." />
        </Panel>
        <div className="space-y-4">
          <Panel title="Recent security events" flush actions={<a href="#/security" className="text-blue-700 hover:underline">View all</a>}>
            {d.recent_security.length ? <ul className="divide-y divide-slate-100">{d.recent_security.map((e: any) => (
              <li key={e.id} className="px-4 py-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium text-slate-800 truncate">{e.type.replace(/_/g, ' ')}</span><Status s={e.severity} /></div>
                <p className="text-[12px] text-slate-500 truncate">{e.user ?? 'unknown'} · {ago(e.at)}</p></li>))}</ul> : <Empty text="No security events." />}
          </Panel>
          <Panel title="Pending review queue" flush actions={<a href="#/review" className="text-blue-700 hover:underline">Open queue</a>}>
            {d.review_queue.length ? <ul className="divide-y divide-slate-100">{d.review_queue.map((r: any) => (
              <li key={r.id} className="px-4 py-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium text-slate-800">{r.user}</span><Tag>{r.type}</Tag></div>
                <p className="text-[12px] text-slate-500 truncate">{r.summary}</p></li>))}</ul> : <Empty text="Nothing waiting for review." />}
          </Panel>
        </div>
      </div>
      {tx && <TxDrawer t={tx} onClose={() => setTx(null)} />}
    </div>
  );
}

// ---------- Transactions ----------
function Transactions({ a, q }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/transactions', 6000);
  const [s, setS] = useState(q.get('q') ?? ''); const [status, setStatus] = useState('all'); const [type, setType] = useState('all'); const [tx, setTx] = useState<any>(null);
  const rows = (d?.transactions ?? []).filter((t: any) => (status === 'all' || t.status === status) && (type === 'all' || t.type === type)
    && (!s || [t.id, t.sender, t.receiver, t.ref].join(' ').toLowerCase().includes(s.toLowerCase())));
  return (<>
    <PageHeader title="Transactions" sub="Offline payments, top-ups, transfers to bank and opening credits." />
    <ErrorState msg={err} retry={reload} />
    <Panel flush>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
        <SearchInput value={s} onChange={(e) => setS(e.target.value)} placeholder="Search ID, sender, receiver, reference" className="w-72" aria-label="Search transactions" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" options={[['all', 'All statuses'], ['successful', 'Successful'], ['pending', 'Pending'], ['under_review', 'Under review']]} />
        <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type" options={[['all', 'All types'], ['Offline payment', 'Offline payment'], ['Top-up', 'Top-up'], ['Move to bank', 'Move to bank'], ['Opening credit', 'Opening credit'], ['Lost-phone forfeit', 'Lost-phone forfeit']]} />
        <span className="ml-auto text-[12px] text-slate-500">{num(rows.length)} results</span>
      </div>
      <DataTable cols={txCols} rows={d ? rows : null} loading={!d} rowKey={(r: any) => r.id} onRow={setTx} initialSort={['at', 'desc']} empty="No transactions match these filters." />
    </Panel>
    {d?.note && <div className="mt-3"><Note>{d.note}</Note></div>}
    {tx && <TxDrawer t={tx} onClose={() => setTx(null)} />}
  </>);
}

// ---------- Users & Wallets ----------
const userStatus = (u: any) => (u.offline_suspended ? 'suspended' : u.last_activity && Date.now() - new Date(u.last_activity).getTime() < 7 * 864e5 ? 'active' : 'inactive');
function Users({ a, q }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/users', 6000);
  const tx = usePoll<any>(a.call, '/admin/transactions', 0);
  const [s, setS] = useState(q.get('q') ?? ''); const [f, setF] = useState('all'); const [sel, setSel] = useState<any>(null); const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setS(q.get('q') ?? ''); }, [q.get('q')]);
  const rows = (d?.users ?? []).filter((u: any) => (f === 'all' || userStatus(u) === f) && (!s || `${u.name} ${u.phone} ${u.id}`.toLowerCase().includes(s.toLowerCase())));
  const total = rows.reduce((t: number, u: any) => t + u.main_balance, 0);
  const cur = sel && (d?.users ?? []).find((u: any) => u.id === sel.id);
  const suspend = async (u: any) => {
    const reason = prompt(`${u.offline_suspended ? 'Restore' : 'Suspend'} offline use for ${u.name}. Reason (min 3 characters):`); if (!reason) return;
    try { await a.call(`/admin/users/${u.id}/suspend`, { suspended: !u.offline_suspended, reason }); reload(); } catch (e) { setMsg(errText(e)); }
  };
  const cols: Col<any>[] = [
    { key: 'id', label: 'User ID', render: (u) => <span className="font-mono text-[12px] text-slate-600">U-{String(u.id).padStart(4, '0')}</span>, sort: (u) => u.id },
    { key: 'name', label: 'Name', render: (u) => <div><p className="font-medium text-slate-900">{u.name}</p><p className="text-[11px] text-slate-500 font-mono">{u.phone}</p></div>, sort: (u) => u.name.toLowerCase() },
    { key: 'created', label: 'Registered', render: (u) => <span className="text-slate-600 whitespace-nowrap">{dateOnly(u.created_at)}</span>, sort: (u) => u.created_at ?? '' },
    { key: 'status', label: 'Status', render: (u) => <Status s={userStatus(u)} />, sort: (u) => userStatus(u) },
    { key: 'main', label: 'Wallet balance', align: 'right', render: (u) => <span className="font-medium">{inr(u.main_balance)}</span>, sort: (u) => u.main_balance },
    { key: 'send', label: 'Send credits', align: 'right', render: (u) => inr(u.send_bucket), sort: (u) => u.send_bucket },
    { key: 'recv', label: 'Receive credits', align: 'right', render: (u) => inr(u.receive_bucket), sort: (u) => u.receive_bucket },
    { key: 'last', label: 'Last activity', render: (u) => <span className="text-slate-600 whitespace-nowrap">{ago(u.last_activity)}</span>, sort: (u) => u.last_activity ?? '' },
  ];
  const mine = cur ? (tx.data?.transactions ?? []).filter((t: any) => t.sender_id === cur.id || t.receiver_id === cur.id) : [];
  return (<>
    <PageHeader title="Users & Wallets" sub="Registered customers and the balances held in each of their accounts." />
    <ErrorState msg={err ?? msg} retry={reload} />
    <Panel flush>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
        <SearchInput value={s} onChange={(e) => setS(e.target.value)} placeholder="Search name, phone or ID" className="w-64" aria-label="Search users" />
        <Select value={f} onChange={(e) => setF(e.target.value)} aria-label="Status filter" options={[['all', 'All statuses'], ['active', 'Active (7 days)'], ['inactive', 'Inactive'], ['suspended', 'Offline suspended']]} />
        <span className="ml-auto text-[12px] text-slate-500">{num(rows.length)} users · wallet balances {inr(total)}</span>
      </div>
      <DataTable cols={cols} rows={d ? rows : null} loading={!d} rowKey={(r: any) => r.id} onRow={(u) => setSel(u)} initialSort={['id', 'asc']} empty="No users match." />
    </Panel>
    {cur && (
      <Drawer title={cur.name} sub={<span className="font-mono">U-{String(cur.id).padStart(4, '0')} · {cur.phone}</span>} onClose={() => setSel(null)}>
        <div className="flex items-center gap-2"><Status s={userStatus(cur)} />{cur.suspend_reason && <span className="text-[12px] text-slate-500">{cur.suspend_reason}</span>}</div>
        <div className="grid grid-cols-3 gap-2">{([['Wallet', cur.main_balance], ['Send', cur.send_bucket], ['Receive', cur.receive_bucket]] as [string, number][]).map(([k, v]) => <div key={k} className="border border-slate-200 rounded-md px-3 py-2"><p className="text-[11px] text-slate-500">{k}</p><p className="text-[14px] font-semibold tabular-nums">{inr(v)}</p></div>)}</div>
        <DL items={[['KYC', cur.kyc_status.replace(/_/g, ' ')], ['Bank', cur.bank], ['Region', cur.region], ['Trust score', `${cur.trust} / 850`], ['Registered', dt(cur.created_at)], ['Last sync', dt(cur.last_sync_at)], ['Last activity', dt(cur.last_activity)], ['Selfie on file', cur.selfie_on_file ? 'Yes' : 'No']]} />
        <div><p className="text-[12px] font-semibold text-slate-700 mb-2">Devices</p>
          <DL items={cur.devices.map((x: any, i: number) => [x.label || `Device ${i + 1}`, x.active ? <Status s="active" /> : <span className="text-slate-500">Cancelled{x.cancel_reason ? `: ${x.cancel_reason}` : ''}</span>])} /></div>
        <div><p className="text-[12px] font-semibold text-slate-700 mb-2">Recent transactions</p>
          {mine.length ? <ul className="border border-slate-200 rounded-md divide-y divide-slate-100">{mine.slice(0, 8).map((t: any) => (
            <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[12px]"><span className="truncate"><span className="font-mono text-slate-500 mr-1.5">{t.id}</span>{t.type}</span><span className="flex items-center gap-2 shrink-0"><span className="tabular-nums font-medium">{inr(t.amount)}</span><Status s={t.status} /></span></li>))}</ul> : <Empty text="No transactions." />}</div>
        {a.canDecide ? <Button tone={cur.offline_suspended ? 'default' : 'danger'} onClick={() => suspend(cur)}>{cur.offline_suspended ? 'Restore offline use' : 'Suspend offline use'}</Button> : <Note>Your role is read only.</Note>}
      </Drawer>
    )}
  </>);
}

// ---------- Financial Reconciliation ----------
function Reconciliation({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/reconciliation', 5000);
  return (<>
    <PageHeader title="Financial Reconciliation" sub="Each accounting category is checked twice: against current account records and against the sum of every ledger entry." />
    <ErrorState msg={err} retry={reload} />
    {!d ? <Panel><Skeleton /></Panel> : <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Total money issued" value={inr(d.issued)} foot={`${num(d.users)} users × ${inr(d.opening_credit)} opening credit each. Nothing else creates money.`} />
        <Kpi label="Sum of all categories" value={inr(d.total)} foot="Wallet + send + receive + bank-held + fees." />
        <div className="bg-white border border-slate-200 rounded-md px-4 py-3.5"><p className="text-[12px] font-medium text-slate-500">Reconciliation status</p>
          <div className="mt-2 space-y-1.5 text-[13px]">
            <p className="flex items-center justify-between">Issued = categories <Status s={d.balanced ? 'successful' : 'failed'} label={d.balanced ? 'Balanced' : 'Mismatch'} /></p>
            <p className="flex items-center justify-between">Records = ledger <Status s={d.categories.every((c: any) => c.matches) ? 'successful' : 'failed'} label={d.categories.every((c: any) => c.matches) ? 'Agree' : 'Differ'} /></p>
            <p className="flex items-center justify-between">Audit hash chain <Status s={d.audit_chain_intact ? 'successful' : 'failed'} label={d.audit_chain_intact ? 'Intact' : 'Broken'} /></p></div></div>
      </div>
      <Panel title="Accounting categories" flush>
        <DataTable rowKey={(r: any) => r.key} rows={d.categories} pageSize={10} cols={[
          { key: 'label', label: 'Category', render: (c) => <span className="font-medium text-slate-800">{c.label}</span> },
          { key: 'records', label: 'From account records', align: 'right', render: (c) => inr(c.records) },
          { key: 'ledger', label: 'From ledger entries', align: 'right', render: (c) => inr(c.ledger) },
          { key: 'share', label: 'Share of issued', align: 'right', render: (c) => <span className="text-slate-500">{d.issued ? ((c.records / d.issued) * 100).toFixed(2) + '%' : '–'}</span> },
          { key: 'm', label: 'Check', render: (c) => <Status s={c.matches ? 'successful' : 'failed'} label={c.matches ? 'Matches' : 'Differs'} /> },
        ]} />
      </Panel>
      <Panel title="Accounting equation">
        <p className="font-mono text-[13px] text-slate-700 leading-7">{d.categories.map((c: any, i: number) => <span key={c.key}>{i > 0 && ' + '}<span title={c.label}>{inr(c.records)}</span></span>)} = <b className="text-slate-900">{inr(d.total)}</b> {d.balanced ? '=' : '≠'} <b className="text-slate-900">{inr(d.issued)}</b> issued</p>
        <div className="mt-2"><Note>Money only moves between these categories; nothing is created after the opening credit. Wallet balances are never combined with the other categories anywhere in this console.</Note></div>
      </Panel>
    </div>}
  </>);
}

// ---------- remaining modules (same data as before, new presentation) ----------
function Live({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/live', 2000);
  return (<><PageHeader title="Live Monitor" sub="Syncs and payment events as they reach the bank. Refreshes every 2 seconds." /><ErrorState msg={err} retry={reload} />
    <Panel flush><DataTable rows={d?.events} loading={!d} rowKey={(r: any) => r.ts + r.type + r.text} pageSize={25} empty="No events yet." cols={[
      { key: 'ts', label: 'Time', render: (x) => <span className="whitespace-nowrap text-slate-600">{dt(x.ts)}</span> },
      { key: 'type', label: 'Event', render: (x) => x.type.startsWith('PAYMENT_') ? <Status s={x.type.replace('PAYMENT_', '').toLowerCase()} /> : <Tag>{x.type}</Tag> },
      { key: 'who', label: 'User', render: (x) => x.who ?? '-' }, { key: 'text', label: 'Detail', render: (x) => <span className="text-slate-600">{x.text}</span> }]} /></Panel></>);
}

function Review({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/review', 4000); const [msg, setMsg] = useState<string | null>(null);
  const dec = async (id: number, decision: string) => { try { await a.call(`/admin/review/${id}/decide`, { decision, note: '' }); reload(); } catch (e) { setMsg(errText(e)); } };
  return (<><PageHeader title="Review Queue" sub="A flag only sends a case here. It never freezes anyone by itself; a person decides." /><ErrorState msg={err ?? msg} retry={reload} />
    <Panel flush><DataTable rows={d?.items} loading={!d} rowKey={(r: any) => r.id} empty="The queue is empty." cols={[
      { key: 'at', label: 'Raised', render: (i) => <span className="whitespace-nowrap text-slate-600">{dt(i.at)}</span>, sort: (i) => i.at },
      { key: 'type', label: 'Type', render: (i) => <Tag>{i.type}</Tag>, sort: (i) => i.type }, { key: 'user', label: 'Account', render: (i) => <span className="font-medium">{i.user}</span>, sort: (i) => i.user },
      { key: 'summary', label: 'Summary', render: (i) => <span className="text-slate-600 text-[12px]">{i.summary}</span> }, { key: 'status', label: 'Status', render: (i) => <Status s={i.status} />, sort: (i) => i.status },
      { key: 'act', label: '', align: 'right', render: (i) => i.status === 'IN_REVIEW' ? (a.canDecide ? <span className="inline-flex gap-1.5"><Button onClick={() => dec(i.id, 'CLEARED')}>Clear</Button><Button tone="danger" onClick={() => dec(i.id, 'SUSPENDED')}>Suspend offline use</Button></span> : <span className="text-[12px] text-slate-400">Read only</span>) : <span className="text-[12px] text-slate-500">by {i.decided_by}</span> }]} /></Panel></>);
}

function Appeals({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/appeals', 4000); const [msg, setMsg] = useState<string | null>(null);
  const dec = async (id: number, decision: string) => { try { await a.call(`/admin/appeals/${id}/decide`, { decision, note: '' }); reload(); } catch (e) { setMsg(errText(e)); } };
  return (<><PageHeader title="Appeals" sub="Customer reports and appeals. Each must be decided within 48 hours." /><ErrorState msg={err ?? msg} retry={reload} />
    <Panel flush><DataTable rows={d?.appeals} loading={!d} rowKey={(r: any) => r.id} empty="No appeals." cols={[
      { key: 'id', label: 'Case', render: (x) => <span className="font-mono text-[12px]">A-{x.id}</span>, sort: (x) => x.id }, { key: 'user', label: 'Customer', render: (x) => <div><p className="font-medium">{x.user}</p><p className="text-[11px] text-slate-500 font-mono">{x.phone}</p></div>, sort: (x) => x.user },
      { key: 'reason', label: 'Reason', render: (x) => <span className="text-[12px] text-slate-600 line-clamp-2">{x.reason}</span> }, { key: 'sub', label: 'Submitted', render: (x) => <span className="whitespace-nowrap text-slate-600">{dt(x.submitted_at)}</span>, sort: (x) => x.submitted_at },
      { key: 'dl', label: 'Time left', align: 'right', render: (x) => x.status === 'PENDING_DECISION' ? `${x.hours_left} h` : '-', sort: (x) => x.hours_left }, { key: 'status', label: 'Status', render: (x) => <Status s={x.status} />, sort: (x) => x.status },
      { key: 'act', label: '', align: 'right', render: (x) => x.status === 'PENDING_DECISION' ? (a.canDecide ? <span className="inline-flex gap-1.5"><Button data-testid={`approve-${x.id}`} onClick={() => dec(x.id, 'APPROVED')}>Approve</Button><Button tone="danger" onClick={() => dec(x.id, 'REJECTED')}>Reject</Button></span> : <span className="text-[12px] text-slate-400">Read only</span>) : <span className="text-[12px] text-slate-500">by {x.decided_by}</span> }]} /></Panel></>);
}

function Ledger({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/ledger'); const [msg, setMsg] = useState<string | null>(null);
  return (<><PageHeader title="Bank Ledger" sub={d?.note ?? 'Interbank settlement.'} actions={a.canDecide && <Button tone="primary" onClick={async () => { try { await a.call('/admin/ledger/settle', {}); reload(); } catch (e) { setMsg(errText(e)); } }}>Close and settle open batch</Button>} />
    <ErrorState msg={err ?? msg} retry={reload} />
    <Panel flush><DataTable rows={d?.entries} loading={!d} rowKey={(r: any) => r.debtor_bank + r.creditor_bank + r.batch} empty="No interbank payments yet." cols={[
      { key: 'd', label: 'Debtor bank', render: (e) => e.debtor_bank, sort: (e) => e.debtor_bank }, { key: 'c', label: 'Creditor bank', render: (e) => e.creditor_bank, sort: (e) => e.creditor_bank },
      { key: 'b', label: 'Batch', render: (e) => <span className="font-mono text-[12px]">{e.batch}</span> }, { key: 'p', label: 'Points', align: 'right', render: (e) => num(e.points), sort: (e) => e.points },
      { key: 'r', label: 'Amount', align: 'right', render: (e) => inr(e.rupees), sort: (e) => e.rupees }, { key: 's', label: 'Status', render: (e) => <Status s={e.status} /> }]} /></Panel></>);
}

function Analytics({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/analytics', 5000);
  const bars = (o: Record<string, number>) => Object.keys(o).length ? <BarChart data={Object.entries(o).map(([label, value]) => ({ label, value }))} height={120} /> : <Empty text="No data yet." />;
  return (<><PageHeader title="Analytics" sub="Counts are per point (one point = ₹1)." /><ErrorState msg={err} retry={reload} />
    {!d ? <Panel><Skeleton /></Panel> : <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Kpi label="Average time to settle" value={`${num(d.avg_settle_delay_seconds)} s`} /><Kpi label="Kept by bank after lost phones" value={inr(d.kept_by_bank_after_lost_phones)} /><Kpi label="Fees collected" value={inr(d.fees_collected)} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Panel title="Transfers by status">{bars(d.transfers_by_status)}</Panel><Panel title="Transfers by region">{bars(d.transfers_by_region)}</Panel><Panel title="Tripwires by type">{bars(d.tripwires_by_type)}</Panel></div>
    </div>}</>);
}

function Flow({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/flow-map', 5000);
  if (!d) return <><PageHeader title="Flow Map" /><ErrorState msg={err} retry={reload} />{!err && <Panel><Skeleton /></Panel>}</>;
  const users = d.nodes.filter((n: any) => n.kind === 'user'); const W = 720, H = 380, cx = W / 2, cy = H / 2;
  const pos: Record<string, [number, number]> = { BANK: [cx, cy] };
  users.forEach((u: any, i: number) => { const ang = (i / Math.max(1, users.length)) * Math.PI * 2 - Math.PI / 2; pos[u.id] = [cx + Math.cos(ang) * 260, cy + Math.sin(ang) * 140]; });
  const col = (s: string) => (s === 'held' ? '#7c3aed' : s === 'pending' ? '#d97706' : s === 'issued' ? '#94a3b8' : '#059669');
  return (<><PageHeader title="Flow Map" sub={d.note} actions={<a className="inline-flex items-center h-8 px-3 rounded-md border border-slate-300 bg-white text-[13px] text-slate-700 hover:bg-slate-50" href={'data:application/json,' + encodeURIComponent(JSON.stringify(d, null, 1))} download="flow-map-export.json">Export JSON</a>} />
    <div className="space-y-4">
      <Panel><svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {d.edges.map((e: any, i: number) => { const f = pos[e.from], t = pos[e.to]; if (!f || !t) return null; const off = e.kind === 'transfer' ? 8 : 0; return (<g key={i}><line x1={f[0]} y1={f[1] + off} x2={t[0]} y2={t[1] + off} stroke={col(e.status)} strokeWidth={Math.min(5, 1 + e.count / 5)} opacity={0.75} strokeDasharray={e.kind === 'issued' ? '4 3' : undefined} /><text x={(f[0] + t[0]) / 2} y={(f[1] + t[1]) / 2 + off - 3} fontSize="10" fill={col(e.status)} textAnchor="middle">{e.count} {e.status}</text></g>); })}
        {d.nodes.map((n: any) => { const p = pos[n.id]; return p && (<g key={n.id}><circle cx={p[0]} cy={p[1]} r={n.kind === 'bank' ? 30 : 22} fill={n.kind === 'bank' ? '#0f172a' : '#fff'} stroke="#cbd5e1" /><text x={p[0]} y={p[1] + 4} textAnchor="middle" fontSize="11" fill={n.kind === 'bank' ? '#fff' : '#0f172a'}>{n.kind === 'bank' ? 'Bank' : n.label.slice(0, 9)}</text></g>); })}</svg></Panel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Kpi label="IDs not returned" value={num(d.ids_not_returned)} /><Kpi label="Received, not yet moved to wallet" value={num(d.received_not_moved_to_main)} /><Kpi label="Suspicious clusters" value={num(d.suspicious_clusters.length)} /></div>
      <Panel title="Blackout view: region and date" flush><DataTable rows={d.blackout} rowKey={(b: any) => b.region + b.date} empty="No transfers yet." cols={[
        { key: 'r', label: 'Region', render: (b) => b.region, sort: (b) => b.region }, { key: 'd', label: 'Date', render: (b) => b.date, sort: (b) => b.date }, { key: 't', label: 'Transfers', align: 'right', render: (b) => num(b.transfers), sort: (b) => b.transfers },
        { key: 'h', label: 'Held', align: 'right', render: (b) => num(b.held) }, { key: 'p', label: 'Pending', align: 'right', render: (b) => num(b.pending) }]} /></Panel>
    </div></>);
}

function Security({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/security-logs', 4000);
  const x = usePoll<any>(a.call, '/admin/cross-reports', 4000);
  const [sev, setSev] = useState('all');
  return (<><PageHeader title="Security Logs" sub="Read-only. Tripwires fire on the phones; this page records what arrived at sync. Nothing here is resolved or closed by an admin." />
    <ErrorState msg={err} retry={reload} />
    <div className="space-y-4">
      <Panel flush title="Security events" actions={<Select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Severity" options={[['all', 'All severities'], ['CRITICAL', 'Critical'], ['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low']]} />}>
        <DataTable rows={d ? d.events.filter((e: any) => sev === 'all' || e.severity === sev) : null} loading={!d} rowKey={(r: any) => r.id} empty="No security events." cols={[
          { key: 'at', label: 'Time', render: (e) => <span className="whitespace-nowrap text-slate-600">{dt(e.at)}</span>, sort: (e) => e.at }, { key: 'type', label: 'Type', render: (e) => <span className="font-medium">{e.type.replace(/_/g, ' ')}</span>, sort: (e) => e.type },
          { key: 'sev', label: 'Severity', render: (e) => <Status s={e.severity} />, sort: (e) => e.severity }, { key: 'u', label: 'Account', render: (e) => e.user ?? '-', sort: (e) => e.user ?? '' },
          { key: 'r', label: 'Region', render: (e) => e.region ?? '-' }, { key: 'p', label: 'Point', render: (e) => <span className="font-mono text-[11px]">{e.pid ? e.pid.slice(0, 8) + '…' : ''}</span> },
          { key: 'd', label: 'Detail', render: (e) => <span className="text-[12px] text-slate-600">{e.description}</span> }]} /></Panel>
      <Panel flush title="Mutual checks at connection (signed cross-reports)">
        <div className="px-4 pt-3"><Note>Each phone checked the other when they connected and signed the result. These are evidence only; no report suspends or blocks anybody by itself.</Note></div>
        <DataTable rows={x.data?.reports} loading={!x.data} rowKey={(r: any) => r.id} empty="No cross-reports yet." cols={[
          { key: 'at', label: 'Received', render: (r) => <span className="whitespace-nowrap text-slate-600">{dt(r.at)}</span>, sort: (r) => r.at }, { key: 'by', label: 'Checked by', render: (r) => r.reporter },
          { key: 'ph', label: 'Phone checked', render: (r) => <span className="font-mono text-[12px]">{r.subject_phone}</span> }, { key: 'n', label: 'Name', render: (r) => r.subject ?? '-' },
          { key: 'res', label: 'Result', render: (r) => <Status s={r.result} /> }, { key: 'c', label: 'Failed checks', render: (r) => <span className="text-[12px] text-slate-600">{r.codes || '-'}</span> }]} /></Panel>
    </div></>);
}

function SameId({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/same-id', 4000);
  return (<><PageHeader title="Same-ID Log" sub="Read-only. Outcomes are automatic: the first report is paid, later claims are held, and the point is traced to its owner's device. People act only through Appeals." />
    <ErrorState msg={err} retry={reload} />
    {!d ? <Panel><Skeleton /></Panel> : !d.cases.length ? <Panel><Empty text="No point has been claimed twice." /></Panel> : <div className="space-y-4">{d.cases.map((c: any) => (
      <Panel key={c.pid} flush title={<span className="font-mono text-[12px]">{c.pid}</span>} actions={<Status s="held" label={`${c.claimants.length} claimants`} />}>
        <div className="px-4 py-3 border-b border-slate-100 text-[13px] text-slate-700">Traced to owner <b>{c.owner}</b> ({c.owner_phone}), device “{c.owner_device}”. {c.outcome}.</div>
        <DataTable rows={c.claimants} rowKey={(x: any) => x.phone + x.at} cols={[
          { key: 'n', label: 'Claimant', render: (x) => `${x.name} (${x.phone})` }, { key: 's', label: 'Status', render: (x) => <Status s={x.status} /> },
          { key: 'r', label: 'Why', render: (x) => <span className="text-[12px] text-slate-600">{x.reason}</span> }, { key: 'a', label: 'At', render: (x) => dt(x.at) }, { key: 't', label: 'Trust', align: 'right', render: (x) => x.trust }]} /></Panel>))}</div>}
  </>);
}

function Audit({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/audit-log', 5000);
  return (<><PageHeader title="Audit Log" sub="Append-only. Each row carries a hash of the row before it." actions={d && <Status s={d.chain_intact ? 'successful' : 'failed'} label={d.chain_intact ? 'Hash chain intact' : 'Hash chain broken'} />} />
    <ErrorState msg={err} retry={reload} />
    <Panel flush><DataTable rows={d?.entries} loading={!d} rowKey={(r: any) => r.id} pageSize={25} empty="No entries." cols={[
      { key: 'at', label: 'When', render: (e) => <span className="whitespace-nowrap text-slate-600">{dt(e.at)}</span> }, { key: 'actor', label: 'Who', render: (e) => <span className="font-medium">{e.actor}</span> },
      { key: 'role', label: 'Role', render: (e) => <Tag>{ROLE[e.role] ?? e.role}</Tag> }, { key: 'action', label: 'Action', render: (e) => <span className="font-mono text-[12px]">{e.action}</span> },
      { key: 'target', label: 'Target', render: (e) => <span className="text-[12px] text-slate-600">{e.target}</span> }, { key: 'ip', label: 'IP', render: (e) => <span className="font-mono text-[12px] text-slate-500">{e.ip}</span> }]} /></Panel></>);
}

function Rules({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/rules'); const [msg, setMsg] = useState<string | null>(null);
  const rotate = async () => { if (!confirm('Rotate to the next month? Last month goes into the grace period.')) return; try { await a.call('/admin/rules/rotate', {}); reload(); } catch (e) { setMsg(errText(e)); } };
  return (<><PageHeader title="Rules & Months" sub="Monthly ID rules and their grace period." actions={a.isSuper && <Button tone="primary" onClick={rotate} data-testid="rotate">Rotate to next month</Button>} />
    <ErrorState msg={err ?? msg} retry={reload} />
    {!d ? <Panel><Skeleton /></Panel> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Current period"><DL items={[['Current month', d.month], ['Previous month', <span className="inline-flex items-center gap-2">{d.previous_month} {d.previous_in_grace ? <Status s="active" label="In grace" /> : <Tag>Closed</Tag>}</span>], ['Grace period', `${d.grace_days} days`], ['Rotated at', dt(d.rotated_at)], ['Points issued this month', num(d.points_issued_this_month)], ['Bad-ID notices', num(d.bad_id_notices)]]} /></Panel>
      <Panel title="Limits"><DL items={[['Send limit per phone', inr(d.send_limit)], ['Receive limit per phone', inr(d.receive_limit)], ['Top-up fee', inr(d.topup_fee)]]} />
        <div className="mt-3"><p className="text-[12px] text-slate-500">Bank public key</p><p className="font-mono text-[11px] break-all text-slate-700">{d.bank_public_key}</p><div className="mt-2"><Note>{d.secrets}</Note></div></div></Panel>
    </div>}</>);
}

function SystemSettings({ a }: P) {
  const { data: d, err, reload } = usePoll<any>(a.call, '/admin/builds'); const [v, setV] = useState(''); const [msg, setMsg] = useState<string | null>(null);
  const act = async (path: string, digest: string) => { try { await a.call(path, { digest }); setV(''); reload(); } catch (e) { setMsg(errText(e)); } };
  return (<><PageHeader title="System Settings" sub="Official app builds the bank accepts at sync." />
    <ErrorState msg={err ?? msg} retry={reload} />
    <Panel title="Official build digests" flush>
      <div className="px-4 pt-3"><Note>{d?.note}</Note></div>
      <DataTable rows={(d?.digests ?? []).map((x: string) => ({ x }))} loading={!d} rowKey={(r: any) => r.x} empty="No official builds registered." cols={[
        { key: 'x', label: 'Digest', render: (r) => <span className="font-mono text-[12px] break-all">{r.x}</span> },
        { key: 'act', label: '', align: 'right', render: (r) => a.isSuper ? <Button tone="danger" onClick={() => act('/admin/builds/remove', r.x)}>Remove</Button> : null }]} />
      {a.isSuper ? <form className="flex gap-2 px-4 py-3 border-t border-slate-100" onSubmit={(e) => { e.preventDefault(); if (v.trim()) act('/admin/builds', v.trim()); }}>
        <SearchInput value={v} onChange={(e) => setV(e.target.value)} placeholder="Paste a build digest" className="flex-1 font-mono" aria-label="Build digest" /><Button tone="primary" type="submit">Register build</Button></form>
        : <div className="px-4 py-3 border-t border-slate-100"><Note>Only a super admin can change registered builds.</Note></div>}
    </Panel></>);
}

// ---------- projector page (full screen) ----------
function Count({ v }: { v: number }) {
  const [shown, setShown] = useState(v); const [flash, setFlash] = useState(0); const prev = useRef(v);
  useEffect(() => {
    if (prev.current === v) return; const from = prev.current, to = v; prev.current = v; setFlash(to > from ? 1 : -1);
    const t0 = performance.now(); let raf = 0;
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 900); setShown(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); const off = setTimeout(() => setFlash(0), 1800); return () => { cancelAnimationFrame(raf); clearTimeout(off); };
  }, [v]);
  return <span className={`tabular-nums transition-colors duration-700 ${flash > 0 ? 'text-emerald-600' : flash < 0 ? 'text-rose-600' : ''}`}>{shown.toLocaleString('en-IN')}</span>;
}
function LiveLedger({ a }: { a: A }) {
  const { data: d } = usePoll<any>(a.call, '/admin/live-ledger', 1500);
  const people: any[] = d?.people ?? [];
  const sum = (k: string) => people.reduce((t, p) => t + (p[k] ?? 0), 0);
  const Big = ({ label, v, sub }: { label: string; v: number; sub?: string }) => (<div className="bg-white border border-slate-200 rounded-md px-6 py-5"><p className="text-xl text-slate-500">{label}</p><p className="text-5xl whitespace-nowrap font-semibold mt-1" data-testid={`ll-${label}`}>₹<Count v={v} /></p>{sub && <p className="text-lg text-slate-400 mt-1">{sub}</p>}</div>);
  return (
    <div className="min-h-screen bg-[#f6f7f9] p-8 space-y-6">
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Logo /><h1 className="text-4xl font-semibold tracking-tight">Live ledger</h1></div><a href="#/overview" className="text-sm text-blue-700 hover:underline">Back to console</a></div>
      <div className="grid grid-cols-3 gap-6"><Big label="User wallet balances" v={sum('account')} sub={`${people.length} people`} /><Big label="Unspent send credits" v={sum('send_slot')} sub="on phones, not yet spent" /><Big label="Unclaimed receive credits" v={sum('receive_slot')} sub="received, not yet moved to wallet" /></div>
      <div className="bg-white border border-slate-200 rounded-md"><table className="w-full text-2xl"><thead><tr className="text-left text-slate-500 text-lg border-b border-slate-200"><th className="px-5 py-3 font-medium">Person</th><th className="px-5 py-3 text-right font-medium">Wallet balance</th><th className="px-5 py-3 text-right font-medium">Send credits</th><th className="px-5 py-3 text-right font-medium">Receive credits</th></tr></thead>
        <tbody>{people.map((p) => (<tr key={p.id} className="border-t border-slate-100" data-testid={`ll-row-${p.name}`}><td className="px-5 py-3 font-medium">{p.name}</td><td className="px-5 py-3 text-right">₹<Count v={p.account} /></td><td className="px-5 py-3 text-right">₹<Count v={p.send_slot} /></td><td className="px-5 py-3 text-right">₹<Count v={p.receive_slot} /></td></tr>))}</tbody></table>
        {!people.length && <Empty text="No users yet." />}</div>
      <p className="text-xl text-slate-500">These numbers change only when a phone syncs with the bank. While phones are offline and paying each other, they stay exactly as they are. Updated {d ? new Date(d.server_time).toLocaleTimeString('en-IN') : '…'}</p>
      <div className="space-y-2">{d?.entries.map((e: any) => (<div key={e.id} className="bg-white border border-slate-200 rounded-md px-5 py-3 text-xl flex justify-between animate-[fadein_.8s]"><span>{new Date(e.at).toLocaleTimeString('en-IN')} · <b className="font-semibold">{e.kind.replace(/_/g, ' ')}</b> · {e.who}{e.other ? ` → ${e.other}` : ''}</span><span className="text-slate-600 tabular-nums">{[e.d_main && `wallet ${e.d_main > 0 ? '+' : ''}${e.d_main}`, e.d_send && `send ${e.d_send > 0 ? '+' : ''}${e.d_send}`, e.d_recv && `receive ${e.d_recv > 0 ? '+' : ''}${e.d_recv}`].filter(Boolean).join(', ')}</span></div>))}</div>
    </div>
  );
}
