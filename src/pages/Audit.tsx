import { useRef, useState } from 'react'
import { streamQuestionGeneration, analyzeGeo } from '../api/client'
import type { GeoStats } from '../types'
import { pct } from '../utils/format'

interface GeneratedQuestion {
  question: string
  question_type?: string
  target_entity?: string
  leaked?: boolean
  matched?: string[]
}

/** 品牌体检：SSE 流式生成探针问题 → 安全护栏 → GEO 可见性分析 */
export default function Audit() {
  const [brand, setBrand] = useState('华为')
  const [domain, setDomain] = useState('electronics')
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('')
  const [note, setNote] = useState('')
  const [raw, setRaw] = useState('')
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [geo, setGeo] = useState<GeoStats | null>(null)
  const [geoMsg, setGeoMsg] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  /** 前端品牌泄露护栏（与服务端双重校验） */
  const clientLeakCheck = (text: string, b: string) => {
    const lower = text.toLowerCase()
    const pinyinMap: Record<string, string[]> = { 华为: ['huawei'], 君乐宝: ['junlebao'] }
    return [b.toLowerCase(), ...(pinyinMap[b] || [])].some((v) => v.length >= 2 && lower.includes(v))
  }

  const start = async () => {
    setRunning(true)
    setRaw('')
    setQuestions([])
    setGeo(null)
    setGeoMsg('')
    const controller = new AbortController()
    abortRef.current = controller
    let buffer = ''
    try {
      await streamQuestionGeneration(brand, domain, (evt) => {
        if (evt.event === 'meta') {
          setMode(evt.data.mode === 'live' ? `实时生成 · ${evt.data.model}` : '演示回放模式')
          setNote(evt.data.note || '')
        } else if (evt.event === 'token') {
          buffer += evt.data.text
          setRaw(buffer)
          // 尝试从缓冲中增量提取完整 JSON 对象行
          const objs = extractJsonObjects(buffer)
          setQuestions(
            objs.map((q) => ({
              ...q,
              leaked: clientLeakCheck(q.question || '', brand),
            })),
          )
        } else if (evt.event === 'guard') {
          setQuestions((prev) =>
            prev.map((q) =>
              q.question === evt.data.question ? { ...q, leaked: evt.data.leaked, matched: evt.data.matched } : q,
            ),
          )
        }
      }, controller.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setNote(`生成中断：${(e as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  const runGeo = async () => {
    setGeoMsg('分析中…')
    const r = await analyzeGeo(brand)
    if (r.status === 'ok' && r.data) {
      setGeo(r.data)
      setGeoMsg('')
    } else {
      setGeo(null)
      setGeoMsg(r.message || '分析不可用')
    }
  }

  const platforms = Object.values(geo?.platforms || {})

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">品牌体检</h1>
        <p className="mt-1 text-sm text-slate-500">
          生成「品牌匿名」探针问题 → 安全护栏检测 → 触发五大平台 GEO 可见性分析
        </p>
      </header>

      {/* 输入区 */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">品牌名称</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-44 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="如：华为"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">所属领域</span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1 w-40 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="electronics">电子产品</option>
            <option value="food">食品</option>
            <option value="medicine">药品</option>
            <option value="fashion">服装</option>
          </select>
        </label>
        <button
          onClick={start}
          disabled={running}
          className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
        >
          {running ? '生成中…' : '⚡ 生成探针问题'}
        </button>
        {running && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            停止
          </button>
        )}
        {mode && (
          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${mode.includes('演示') ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {mode}
          </span>
        )}
      </div>
      {note && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-relaxed text-amber-700">{note}</div>}

      <div className="grid grid-cols-5 gap-4">
        {/* 流式输出面板 */}
        <div className="col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">流式生成输出</h3>
            <span className="text-[11px] text-slate-400">SSE · token by token</span>
          </div>
          <pre className={`max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-[12px] leading-relaxed text-emerald-300 ${running ? 'stream-cursor' : ''}`}>
            {raw || '点击「生成探针问题」开始…'}
          </pre>

          <div className="mt-4 space-y-2.5">
            {questions.map((q, i) => (
              <div key={i} className="fade-up flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${q.leaked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {q.leaked ? '泄露' : '安全'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-800">{q.question}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {q.question_type || '—'} · 实体：{q.target_entity || '—'}
                    {q.matched?.length ? ` · 命中变体：${q.matched.join('/')}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GEO 分析结果 */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">GEO 可见性分析</h3>
            <button onClick={runGeo} disabled={running || !questions.length}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-slate-700 disabled:opacity-40">
              运行分析
            </button>
          </div>
          {geoMsg && !geo && <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-xs leading-relaxed text-slate-400">{geoMsg}</div>}
          {geo && (
            <div className="space-y-3">
              {platforms.map((p) => (
                <div key={p.platform} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{p.platform_name}</span>
                    <span className="text-[11px] text-slate-400">{p.total_answers} 条真实回答</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-brand-50 py-2">
                      <div className="text-lg font-bold text-brand-700">{pct(p.mention_rate)}</div>
                      <div className="text-[10px] text-slate-500">提及率</div>
                    </div>
                    <div className="rounded-lg bg-cyan-50 py-2">
                      <div className="text-lg font-bold text-cyan-700">No.{p.avg_rank_when_mentioned}</div>
                      <div className="text-[10px] text-slate-500">平均排名</div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 py-2">
                      <div className="text-lg font-bold text-emerald-700">{pct(p.rank1_rate)}</div>
                      <div className="text-[10px] text-slate-500">第一提及率</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
                统计自 Milvus <code>geo_analysis_{geo.brand}</code> 集合 {geo.total_analysis_rows} 行真实分析记录。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** 从流式缓冲中提取完整 JSON 对象（容忍截断） */
function extractJsonObjects(buffer: string): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = []
  const re = /\{"question":\s*"([^"]+)"(?:,\s*"question_type":\s*"([^"]*)")?(?:,\s*"target_entity":\s*"([^"]*)")?\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(buffer))) {
    out.push({ question: m[1], question_type: m[2] || undefined, target_entity: m[3] || undefined })
  }
  return out
}
