// Admin design system: small, dense, neutral. Navy text, one blue accent, hairline borders, 6px radius.
import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox, X } from 'lucide-react';

export const inr = (v: number | null | undefined) => (v == null ? '-' : '₹' + Number(v).toLocaleString('en-IN'));
export const num = (v: number | null | undefined) => (v == null ? '-' : Number(v).toLocaleString('en-IN'));
export const dt = (s?: string | null) => (s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const dateOnly = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const ago = (s?: string | null) => {
  if (!s) return '-';
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; return `${Math.round(h / 24)} d ago`;
};

export const PageHeader: React.FC<{ title: string; sub?: React.ReactNode; actions?: React.ReactNode }> = ({ title, sub, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div><h1 className="text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>{sub && <p className="text-[13px] text-slate-500 mt-0.5">{sub}</p>}</div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const Panel: React.FC<React.PropsWithChildren<{ title?: React.ReactNode; actions?: React.ReactNode; className?: string; flush?: boolean }>> = ({ title, actions, className = '', flush, children }) => (
  <section className={`bg-white border border-slate-200 rounded-md shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
    {(title || actions) && <header className="flex items-center justify-between gap-3 px-4 h-11 border-b border-slate-100"><h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>{actions && <div className="flex items-center gap-2 text-[12px]">{actions}</div>}</header>}
    <div className={flush ? '' : 'p-4'}>{children}</div>
  </section>
);

export const Kpi: React.FC<{ label: string; value: React.ReactNode; rows?: [string, React.ReactNode][]; foot?: React.ReactNode; testid?: string }> = ({ label, value, rows, foot, testid }) => (
  <div className="bg-white border border-slate-200 rounded-md px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <p className="text-[12px] font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-[24px] leading-8 font-semibold tabular-nums text-slate-900" data-testid={testid}>{value}</p>
    {rows && <dl className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2">{rows.map(([k, v]) => <div key={k}><dt className="text-[11px] text-slate-500">{k}</dt><dd className="text-[13px] font-medium tabular-nums text-slate-800">{v}</dd></div>)}</dl>}
    {foot && <p className="mt-2 text-[11px] text-slate-400">{foot}</p>}
  </div>
);

const PILL: Record<string, [string, string, string]> = {
  successful: ['Successful', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  paid: ['Successful', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  pending: ['Pending', 'bg-amber-50 text-amber-800 ring-amber-600/20', 'bg-amber-500'],
  under_review: ['Under review', 'bg-violet-50 text-violet-700 ring-violet-600/15', 'bg-violet-500'],
  held: ['Under review', 'bg-violet-50 text-violet-700 ring-violet-600/15', 'bg-violet-500'],
  failed: ['Failed', 'bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
  active: ['Active', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  inactive: ['Inactive', 'bg-slate-50 text-slate-600 ring-slate-500/15', 'bg-slate-400'],
  suspended: ['Offline suspended', 'bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
  IN_REVIEW: ['In review', 'bg-amber-50 text-amber-800 ring-amber-600/20', 'bg-amber-500'],
  CLEARED: ['Cleared', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  SUSPENDED: ['Suspended', 'bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
  PENDING_DECISION: ['Awaiting decision', 'bg-amber-50 text-amber-800 ring-amber-600/20', 'bg-amber-500'],
  APPROVED: ['Approved', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  REJECTED: ['Rejected', 'bg-slate-100 text-slate-700 ring-slate-500/15', 'bg-slate-500'],
  CRITICAL: ['Critical', 'bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
  HIGH: ['High', 'bg-orange-50 text-orange-700 ring-orange-600/15', 'bg-orange-500'],
  MEDIUM: ['Medium', 'bg-amber-50 text-amber-800 ring-amber-600/20', 'bg-amber-500'],
  LOW: ['Low', 'bg-slate-50 text-slate-600 ring-slate-500/15', 'bg-slate-400'],
  SETTLED: ['Settled', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  OPEN: ['Open', 'bg-amber-50 text-amber-800 ring-amber-600/20', 'bg-amber-500'],
  pass: ['Pass', 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  fail: ['Fail', 'bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
};
export const Status: React.FC<{ s: string; label?: string }> = ({ s, label }) => {
  const [l, c, dot] = PILL[s] ?? [s.replace(/_/g, ' ').toLowerCase(), 'bg-slate-50 text-slate-600 ring-slate-500/15', 'bg-slate-400'];
  return <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap ${c}`}><span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label ?? l}</span>;
};
export const Tag: React.FC<React.PropsWithChildren> = ({ children }) => <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 whitespace-nowrap">{children}</span>;

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'default' | 'danger' | 'link' }> = ({ tone = 'default', className = '', ...p }) => (
  <button {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
    tone === 'primary' ? 'bg-slate-900 text-white hover:bg-slate-800 h-8 px-3' : tone === 'danger' ? 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 h-8 px-3' : tone === 'link' ? 'text-blue-700 hover:text-blue-900 hover:underline px-0' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 h-8 px-3'} ${className}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: [string, string][] }> = ({ options, className = '', ...p }) => (
  <select {...p} className={`h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${className}`}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
);
export const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...p }) => (
  <input {...p} type="search" className={`h-8 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${className}`} />
);

export const Skeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-4 rounded bg-slate-100" style={{ width: `${90 - i * 12}%` }} />)}</div>
);
export const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400"><Inbox className="w-5 h-5 mb-2" /><p className="text-[13px]">{text}</p></div>
);
export const ErrorState: React.FC<{ msg: string | null; retry?: () => void }> = ({ msg, retry }) => (msg ? (
  <div role="alert" className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800"><AlertTriangle className="w-4 h-4 shrink-0" /><span className="flex-1">{msg}</span>{retry && <Button tone="link" onClick={retry}>Retry</Button>}</div>
) : null);
export const Note: React.FC<React.PropsWithChildren> = ({ children }) => <p className="text-[12px] text-slate-500 leading-relaxed">{children}</p>;

// ---------- table: sorting, pagination, row click ----------
export type Col<T> = { key: string; label: string; align?: 'right' | 'left'; sort?: (r: T) => string | number; render: (r: T) => React.ReactNode; className?: string };
export function DataTable<T>({ cols, rows, loading, empty = 'No records.', pageSize = 15, onRow, rowKey, initialSort }: {
  cols: Col<T>[]; rows: T[] | null | undefined; loading?: boolean; empty?: string; pageSize?: number; onRow?: (r: T) => void; rowKey: (r: T) => string | number; initialSort?: [string, 'asc' | 'desc'];
}) {
  const [sort, setSort] = useState<[string, 'asc' | 'desc'] | null>(initialSort ?? null);
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    const list = [...(rows ?? [])];
    const c = sort && cols.find((x) => x.key === sort[0]);
    if (c?.sort) list.sort((a, b) => { const x = c.sort!(a), y = c.sort!(b); const r = x < y ? -1 : x > y ? 1 : 0; return sort![1] === 'asc' ? r : -r; });
    return list;
  }, [rows, sort, cols]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const p = Math.min(page, pages - 1);
  const view = sorted.slice(p * pageSize, (p + 1) * pageSize);
  if (loading && !rows) return <div className="p-4"><Skeleton /></div>;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead><tr className="bg-slate-50/70 border-b border-slate-200">{cols.map((c) => (
            <th key={c.key} scope="col" className={`h-9 px-4 font-medium text-[12px] text-slate-500 whitespace-nowrap ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
              {c.sort ? <button className="inline-flex items-center gap-1 hover:text-slate-800 cursor-pointer" onClick={() => setSort(sort?.[0] === c.key ? [c.key, sort[1] === 'asc' ? 'desc' : 'asc'] : [c.key, 'desc'])}>
                {c.label}{sort?.[0] === c.key ? (sort[1] === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronDown className="w-3 h-3 opacity-25" />}</button> : c.label}
            </th>))}</tr></thead>
          <tbody>{view.map((r) => (
            <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined} className={`border-b border-slate-100 last:border-0 ${onRow ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
              {cols.map((c) => <td key={c.key} className={`h-10 px-4 align-middle ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.className ?? ''}`}>{c.render(r)}</td>)}
            </tr>))}</tbody>
        </table>
      </div>
      {!sorted.length && <Empty text={empty} />}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 h-10 border-t border-slate-100 text-[12px] text-slate-500">
          <span>{p * pageSize + 1}–{Math.min(sorted.length, (p + 1) * pageSize)} of {sorted.length}</span>
          <div className="flex items-center gap-1">
            <button aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-1">Page {p + 1} of {pages}</span>
            <button aria-label="Next page" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export const Drawer: React.FC<React.PropsWithChildren<{ title: React.ReactNode; onClose: () => void; sub?: React.ReactNode }>> = ({ title, sub, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
    <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />
    <aside className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
      <header className="sticky top-0 bg-white flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
        <div><h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>{sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}</div>
        <button aria-label="Close" onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
      </header>
      <div className="p-5 space-y-5">{children}</div>
    </aside>
  </div>
);
export const DL: React.FC<{ items: [string, React.ReactNode][] }> = ({ items }) => (
  <dl className="divide-y divide-slate-100 border border-slate-200 rounded-md">{items.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-3 py-2 text-[13px]"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-800 break-all">{v}</dd></div>)}</dl>
);

// ---------- charts (plain SVG, no library) ----------
export const BarChart: React.FC<{ data: { label: string; value: number }[]; format?: (v: number) => string; height?: number }> = ({ data, format = num, height = 150 }) => {
  const W = 380, H = height, pad = 26, max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad) / Math.max(1, data.length);
  const ticks = [0, 0.5, 1].map((k) => Math.round(max * k));
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full h-auto" role="img" aria-label="bar chart">
      {ticks.map((t) => { const y = H - (t / max) * (H - 10); return <g key={t}><line x1={pad} x2={W} y1={y} y2={y} stroke="#eef2f6" /><text x={pad - 4} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text></g>; })}
      {data.map((d, i) => { const h = (d.value / max) * (H - 10); return (
        <g key={d.label}><rect x={pad + i * bw + bw * 0.2} y={H - h} width={bw * 0.6} height={Math.max(0, h)} rx="1.5" fill={d.value ? '#2563eb' : '#e2e8f0'}><title>{`${d.label}: ${format(d.value)}`}</title></rect>
          {(i % 2 === 0 || data.length <= 8) && <text x={pad + i * bw + bw / 2} y={H + 13} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text>}</g>); })}
    </svg>
  );
};
export const LineChart: React.FC<{ data: { label: string; value: number }[]; height?: number }> = ({ data, height = 150 }) => {
  const W = 380, H = height, pad = 26, max = Math.max(1, ...data.map((d) => d.value));
  const step = (W - pad) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * step, H - (d.value / max) * (H - 10)] as const);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full h-auto" role="img" aria-label="line chart">
      {[0, 0.5, 1].map((k) => { const v = Math.round(max * k), y = H - (v / max) * (H - 10); return <g key={k}><line x1={pad} x2={W} y1={y} y2={y} stroke="#eef2f6" /><text x={pad - 4} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text></g>; })}
      {pts.length > 0 && <path d={`${path} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`} fill="#2563eb" opacity="0.06" />}
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="1.75" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.25" fill="#fff" stroke="#2563eb" strokeWidth="1.5"><title>{`${data[i].label}: ${data[i].value}`}</title></circle>)}
      {data.map((d, i) => (i % 2 === 0 ? <text key={d.label} x={pad + i * step} y={H + 13} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text> : null))}
    </svg>
  );
};
export const Distribution: React.FC<{ parts: { label: string; value: number; color: string }[] }> = ({ parts }) => {
  const total = parts.reduce((t, p) => t + p.value, 0);
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-slate-100">{total > 0 && parts.map((p) => p.value > 0 && <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label}: ${p.value}`} />)}</div>
      <ul className="space-y-1.5">{parts.map((p) => (
        <li key={p.label} className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 text-slate-600"><span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />{p.label}</span>
          <span className="tabular-nums font-medium text-slate-800">{num(p.value)} <span className="text-slate-400 font-normal">{total ? `${Math.round((p.value / total) * 100)}%` : '–'}</span></span></li>))}</ul>
    </div>
  );
};
