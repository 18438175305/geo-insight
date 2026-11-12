import { useEffect, useState } from 'react'
import { fetchGeoStats } from '../api/client'
import type { GeoStats } from '../types'

/** AI 回答洞察：真实平台回答 + 竞品排名解剖 */
export default function Answers() {
  const [brand, setBrand] = useState('华为')
  const [stats, setStats] = useState<GeoStats | null>(null)

  useEffect(() => {
    fetchGeoStats(brand).then(setStats).catch(() => setStats(null))
  }, [brand])

  const samples = stats?.answer_samples || []

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI 回答洞察</h1>
          <p className="mt-1 text-sm text-slate-500">
            探针问题投放到 AI 平台后的真实回答原文 · 品牌与竞品的排名解剖（数据：Milvus geo_analysis 集合）
          </p>
        </div>
        <div className="flex gap-2">
          {['华为', '君乐宝'].map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                brand === b ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </header>

      {!samples.length && (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-300 shadow-card">
          该品牌暂无回答样本（未运行平台分析）
        </div>
      )}

      <div className="space-y-4">
        {samples.map((s, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card fade-up">
            {/* 问题条 */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5">
              <span className="text-lg">❓</span>
              <span className="flex-1 text-sm font-semibold text-slate-800">{s.question}</span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                s.mentioned
                  ? s.rank === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-600'}`}>
                {s.mentioned ? (s.rank === 1 ? `✓ 提及 · 排名第1` : `✓ 提及 · 排名第${s.rank}`) : '✗ 未提及'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-0">
              {/* 回答原文 */}
              <div className="col-span-2 border-r border-slate-100 px-6 py-4">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 font-medium text-brand-600">{s.platform_name} · 真实回答</span>
                  <span>提及 {s.mention_count} 次</span>
                  {s.brand_website_cited && <span className="text-emerald-500">引用了品牌官网</span>}
                </div>
                <p className="text-[13px] leading-relaxed text-slate-600">{s.answer_excerpt}…</p>
              </div>

              {/* 竞品排名 */}
              <div className="px-6 py-4">
                <div className="mb-2 text-[11px] font-medium text-slate-500">同场竞品排名</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5">
                    <span className="w-5 text-center text-[11px] font-bold text-brand-600">{s.rank || '—'}</span>
                    <span className="text-xs font-semibold text-brand-800">{stats?.brand}（目标品牌）</span>
                  </div>
                  {Object.entries(s.competitor_ranks).map(([name, rank]) => (
                    <div key={name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                      <span className="w-5 text-center text-[11px] font-bold text-slate-400">{rank}</span>
                      <span className="text-xs text-slate-600">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
