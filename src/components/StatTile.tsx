interface Props {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
}

const tones: Record<string, string> = {
  default: 'text-slate-900',
  good: 'text-emerald-600',
  warn: 'text-amber-600',
  bad: 'text-rose-600',
}

/** 指标卡：数字大而醒目，附口径说明 */
export default function StatTile({ label, value, sub, tone = 'default' }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1.5 text-[26px] font-bold leading-none tracking-tight ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-2 text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}
