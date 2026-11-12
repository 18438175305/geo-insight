import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchBrands, fetchQuestions } from '../api/client'
import type { BrandSummary, QuestionSet } from '../types'
import EChartsBox from '../components/EChartsBox'
import { typeColor } from '../utils/format'

/** 探针问题库：真实生成问题对（主问题+改写+评估指标）浏览 */
export default function Questions() {
  const { brand: routeBrand } = useParams()
  const [brand, setBrand] = useState(routeBrand || '华为')
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [data, setData] = useState<QuestionSet | null>(null)
  const [qtype, setQtype] = useState<string>('全部')
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands().then(setBrands).catch(() => {})
  }, [])

  useEffect(() => {
    setData(null)
    fetchQuestions(brand).then(setData).catch(() => setData(null))
  }, [brand])

  const types = useMemo(
    () => (data ? ['全部', ...Object.keys(data.evaluation_summary.questions_by_type)] : ['全部']),
    [data],
  )

  const filtered = useMemo(() => {
    if (!data) return []
    return data.question_pairs.filter(
      (p) =>
        (qtype === '全部' || p.question_type === qtype) &&
        (!keyword || p.primary_question.includes(keyword) || p.target_entity.includes(keyword)),
    )
  }, [data, qtype, keyword])

  const s = data?.evaluation_summary

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">探针问题库</h1>
          <p className="mt-1 text-sm text-slate-500">刻意隐藏品牌名的问题——测试 AI 在无引导状态下是否主动联想到目标品牌</p>
        </div>
        <div className="flex gap-2">
          {brands.map((b) => (
            <button
              key={b.name}
              onClick={() => setBrand(b.name)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                brand === b.name ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </header>

      {s && (
        <div className="grid grid-cols-5 gap-4">
          {[
            ['主问题', `${s.total_questions}`, `覆盖 ${s.total_blocks} 个知识块`],
            ['改写问题', `${s.total_rewritten_questions}`, `平均 ${s.avg_rewrites_per_question} 条/问`],
            ['客观评估', s.avg_objective_score.toFixed(1), '泄露/覆盖/完整性'],
            ['主观评估', s.avg_subjective_score.toFixed(1), '自然度/有意义性'],
            ['品牌泄露率', `${(s.brand_leak_rate * 100).toFixed(0)}%`, '安全护栏'],
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-[11px] text-slate-500">{label}</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
              <div className="mt-1 text-[10px] text-slate-400">{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* 类型分布 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">问题类型分布</h3>
          {data ? (
            <EChartsBox
              height={230}
              option={{
                tooltip: { trigger: 'item' },
                series: [
                  {
                    type: 'pie',
                    radius: ['40%', '68%'],
                    center: ['50%', '46%'],
                    label: { fontSize: 10, color: '#64748b' },
                    data: Object.entries(s!.questions_by_type).map(([name, value], i) => ({
                      name,
                      value,
                      itemStyle: { color: ['#4f46e5', '#0891b2', '#059669', '#d97706', '#e11d48', '#7c3aed'][i % 6] },
                    })),
                  },
                ],
              }}
            />
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-slate-300">加载中…</div>
          )}
        </div>

        {/* 问题列表 */}
        <div className="col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索问题或实体…"
              className="w-52 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setQtype(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  qtype === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-slate-400">{filtered.length} / {data?.question_pairs.length ?? 0} 条</span>
          </div>

          <div className="max-h-[520px] space-y-2.5 overflow-auto pr-1">
            {filtered.map((p) => {
              const m = p.evaluation_metrics
              const open = expanded === p.id
              return (
                <div key={p.id} className="rounded-xl border border-slate-100 transition hover:border-brand-200">
                  <button
                    onClick={() => setExpanded(open ? null : p.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${typeColor(p.question_type)}`}>
                      {p.question_type}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{p.primary_question}</span>
                    <span className="text-xs font-semibold text-brand-600">{m.total_score?.toFixed(1) ?? '—'}</span>
                    <span className="text-slate-300">{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <div className="fade-up space-y-3 border-t border-slate-100 px-4 py-3.5">
                      <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                        {[
                          ['品牌泄露', m.brand_leak_score === 0 ? '✅ 无' : `⚠️ ${m.brand_leak_score}`],
                          ['实体覆盖', m.entity_coverage?.toFixed(2) ?? '—'],
                          ['完整性', m.completeness?.toFixed(2) ?? '—'],
                          ['自然度', `${m.naturalness ?? '—'}/10`],
                          ['有意义性', `${m.meaningfulness ?? '—'}/10`],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-slate-50 py-2">
                            <div className="font-bold text-slate-800">{v}</div>
                            <div className="mt-0.5 text-slate-400">{k}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="mb-1 text-[11px] font-medium text-slate-500">改写问题（模拟真实用户问法）</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.rewritten_questions.map((r, i) => (
                            <span key={i} className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs text-cyan-700">{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        目标实体：{p.target_entity} ｜ KG 实体标签：{p.entity_tags.slice(0, 4).join('、')}
                        {p.entity_tags.length > 4 ? ' 等' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {!filtered.length && (
              <div className="py-16 text-center text-sm text-slate-300">无匹配问题</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
