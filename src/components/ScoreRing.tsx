interface Props {
  /** 0~100 */
  score: number
  size?: number
  label?: string
  sub?: string
}

/** SVG 环形评分图（无第三方依赖） */
export default function ScoreRing({ score, size = 132, label = '综合评分', sub }: Props) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(100, score)) / 100
  const color = score >= 85 ? '#059669' : score >= 70 ? '#4f46e5' : '#d97706'
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - ratio)}
            style={{ transition: 'stroke-dashoffset .8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[26px] font-extrabold leading-none" style={{ color }}>
            {score.toFixed(1)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">{label}</div>
        </div>
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}
