import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBrands, fetchGeoStats } from '../api/client'
import type { BrandSummary, GeoStats } from '../types'
import StatTile from '../components/StatTile'
import ScoreRing from '../components/ScoreRing'
import EChartsBox from '../components/EChartsBox'
import { pct } from '../utils/format'

/** 监测总览：品牌可见性仪表盘（全部真实数据） */
export default function Dashboard() {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [geo, setGeo] = useState<Record<string, GeoStats>>({})
  const [active, setActive] = useState('华为')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchBrands(),
      fetchGeoStats('华为'),
      fetchGeoStats('君乐宝'),
    ])
      .then(([b, g1, g2]) => {
        setBrands(b)
        setGeo({ 华为: g1, 君乐宝: g2 })
      })
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-24 text-center text-slate-400">加载真实监测数据…</div>
  if (error) return <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-600">数据加载失败：{error}（请确认 AI 接入层已启动：npm run dev:server）</div>

  const brand = brands.find((b) => b.name === active)!
  const stats = geo[active]
  const platforms = Object.values(stats?.platforms || {})
  const hasData = platforms.length > 0
  const p = platforms[0]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">监测总览</h1>
        <p className="mt-1 text-sm text-slate-500">
          品牌在生成式 AI 平台中的可见性全景 —— 数据来自 GEO 系统真实运行产物
        </p>
      </header>

      {/* 品牌切换 */}
      <div className="flex gap-3">
        {brands.map((b) => (
          <button
            key={b.name}
            onClick={() => setActive(b.name)}
            className={`rounded-2xl border px-5 py-3 text-left transition-all ${
              active === b.name
                ? 'border-brand-400 bg-white shadow-card ring-2 ring-brand-100'
                : 'border-slate-200 bg-white/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{b.domain === 'electronics' ? '📱' : '🍼'}</span>
              <span className="font-bold text-slate-900">{b.name}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {b.domainName} · 探针问题 {b.totalQuestions} 条
            </div>
          </button>
        ))}
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="品牌提及率" value={hasData ? pct(p.mention_rate) : '—'}
          sub={hasData ? `${p.mentioned}/${p.total_answers} 条回答提及` : '该品牌暂未运行平台分析'}
          tone={hasData && p.mention_rate > 0.8 ? 'good' : 'default'} />
        <StatTile label="平均排名（被提及时）" value={hasData ? `No.${p.avg_rank_when_mentioned}` : '—'}
          sub={hasData ? `第一提及率 ${pct(p.rank1_rate)} · 前三 ${pct(p.top3_rate)}` : ''} />
        <StatTile label="探针问题综合分" value={brand.avgTotalScore.toFixed(1)}
          sub={`客观 ${brand.avgObjectiveScore.toFixed(1)} / 主观 ${brand.avgSubjectiveScore.toFixed(1)}`} />
        <StatTile label="品牌泄露率" value={pct(brand.brandLeakRate, 0)} tone="good"
          sub="探针问题安全护栏（目标 0%）" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 评分环 */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <ScoreRing score={brand.avgTotalScore} label="问题集综合评分" sub={`${brand.totalQuestions} 主问题 · ${brand.totalRewrites} 改写`} />
          <Link to={`/questions/${active}`} className="mt-3 text-xs font-medium text-brand-600 hover:underline">
            查看探针问题库 →
          </Link>
        </div>

        {/* 排名分布 */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">AI 平台回答中的品牌排名分布</h3>
          <p className="mb-2 text-[11px] text-slate-400">
            通义千问 · {hasData ? `${p.total_answers} 条真实回答（Milvus geo_analysis 集合）` : '暂无数据'}
          </p>
          {hasData ? (
            <EChartsBox
              height={224}
              option={{
                tooltip: { trigger: 'axis' },
                grid: { left: 80, right: 24, top: 12, bottom: 24 },
                xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
                yAxis: { type: 'category', data: ['前五之内', '前三之内', '排名第一'] },
                series: [
                  {
                    type: 'bar',
                    data: [
                      +(p.top5_rate * 100).toFixed(1),
                      +(p.top3_rate * 100).toFixed(1),
                      +(p.rank1_rate * 100).toFixed(1),
                    ],
                    itemStyle: { color: '#4f46e5', borderRadius: [0, 6, 6, 0] },
                    barWidth: 20,
                    label: { show: true, position: 'right', formatter: '{c}%' },
                  },
                ],
              }}
            />
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-slate-300">该品牌尚未运行 GEO 追踪分析</div>
          )}
        </div>
      </div>

      {/* 平台矩阵 + 情感 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">监测平台矩阵</h3>
          <div className="space-y-2.5">
            {['deepseek', 'qwen', 'kimi', 'doubao', 'yuanbao'].map((pid) => {
              const s = stats?.platforms?.[pid]
              const names: Record<string, string> = { deepseek: 'DeepSeek', qwen: '通义千问', kimi: 'Kimi', doubao: '豆包', yuanbao: '元宝' }
              return (
                <div key={pid} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-700">{names[pid]}</span>
                  {s ? (
                    <span className="text-xs text-emerald-600">● 提及率 {pct(s.mention_rate)}（{s.total_answers} 条）</span>
                  ) : (
                    <span className="text-xs text-slate-300">○ 待运行（需平台 API 环境）</span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            完整五平台分析需在 GEO 系统环境配置各平台 API Key 后运行 <code className="rounded bg-slate-100 px-1">--include-geo</code> 全链路。
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">情感倾向分布</h3>
          <p className="mb-2 text-[11px] text-slate-400">
            {hasData ? `微调 RoBERTa 情感模型逐条判定（${p.total_answers} 条回答）` : '暂无数据'}
          </p>
          {hasData ? (
            <EChartsBox
              height={224}
              option={{
                tooltip: { trigger: 'item' },
                legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 11, color: '#64748b' } },
                series: [
                  {
                    type: 'pie',
                    radius: ['52%', '74%'],
                    center: ['50%', '44%'],
                    label: { show: false },
                    data: [
                      { value: p.sentiment_pos, name: '正面', itemStyle: { color: '#059669' } },
                      { value: p.sentiment_neu, name: '中性', itemStyle: { color: '#94a3b8' } },
                      { value: p.sentiment_neg, name: '负面', itemStyle: { color: '#e11d48' } },
                    ],
                  },
                ],
              }}
            />
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-slate-300">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}
