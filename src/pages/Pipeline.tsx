import { useEffect, useState } from 'react'
import { fetchPipeline } from '../api/client'
import type { PipelineNode } from '../types'

/** 智能体编排可视化：LangGraph 8-Agent 流水线交互图 */
export default function Pipeline() {
  const [nodes, setNodes] = useState<PipelineNode[]>([])
  const [edges, setEdges] = useState<[string, string, string?][]>([])
  const [active, setActive] = useState<PipelineNode | null>(null)

  useEffect(() => {
    fetchPipeline()
      .then((p) => {
        setNodes(p.nodes)
        setEdges(p.edges as [string, string, string?][])
        setActive(p.nodes[0])
      })
      .catch(() => {})
  }, [])

  const layers = ['数据层', '生成层', '分析层']
  const layerColor: Record<string, string> = {
    数据层: 'from-cyan-500 to-cyan-600',
    生成层: 'from-brand-500 to-brand-600',
    分析层: 'from-rose-500 to-rose-600',
  }
  const typeLabel: Record<string, string> = {
    tool: '工具', agent: 'Agent', hybrid: 'NER+LLM', 'agent-loop': '循环Agent',
    oracle: '评估门禁', output: '产出',
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">智能体编排</h1>
        <p className="mt-1 text-sm text-slate-500">
          LangGraph 状态机驱动的 8-Agent 流水线 —— 点击节点查看职责、真实产物与实现文件
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        {layers.map((layer) => {
          const layerNodes = nodes.filter((n) => n.layer === layer)
          return (
            <div key={layer} className="mb-5 last:mb-0">
              <div className="mb-2.5 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${layerColor[layer]}`} />
                <span className="text-xs font-bold tracking-widest text-slate-500">{layer}</span>
                <span className="text-[10px] text-slate-300">{layerNodes.length} 个节点</span>
              </div>
              <div className="flex flex-wrap items-stretch gap-3">
                {layerNodes.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-3">
                    <button
                      onClick={() => setActive(n)}
                      className={`w-44 rounded-2xl border-2 p-4 text-left transition-all ${
                        active?.id === n.id
                          ? 'border-brand-400 bg-brand-50 shadow-card'
                          : 'border-slate-200 bg-white hover:border-brand-200 hover:shadow-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{icon(n.type)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                          {typeLabel[n.type] || n.type}
                        </span>
                      </div>
                      <div className="mt-2 text-[13px] font-bold leading-snug text-slate-800">{n.label}</div>
                      <div className="mt-1 truncate text-[10px] text-slate-400">{n.artifact}</div>
                    </button>
                    {i < layerNodes.length - 1 && <span className="text-slate-300">→</span>}
                  </div>
                ))}
                {layer === '数据层' && layerNodes.length > 0 && <span className="self-center text-slate-300">↘</span>}
              </div>
            </div>
          )
        })}
        {/* 循环提示 */}
        <div className="mt-1 rounded-xl bg-slate-50 px-4 py-2.5 text-[11px] leading-relaxed text-slate-500">
          ⟳ 客观评估未通过的问题被过滤，通过者进入改写；「问题生成 → 客观评估」之间为 LangGraph
          <code className="mx-1 rounded bg-white px-1.5 py-0.5">block_router</code>
          条件循环——逐知识块推进直至全部处理完成。
        </div>
      </div>

      {/* 节点详情 */}
      {active && (
        <div className="fade-up grid grid-cols-3 gap-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon(active.type)}</span>
              <h2 className="text-lg font-bold text-slate-900">{active.label}</h2>
              <span className={`rounded-full bg-gradient-to-r ${layerColor[active.layer]} px-2.5 py-0.5 text-[10px] font-semibold text-white`}>
                {active.layer}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{active.desc}</p>
          </div>
          <div className="space-y-3 border-l border-slate-100 pl-6">
            <div>
              <div className="text-[11px] font-medium text-slate-400">真实产物</div>
              <div className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700">{active.artifact}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">实现位置</div>
              <div className="mt-1 rounded-lg bg-slate-900 px-3 py-2 font-mono text-[11px] text-emerald-300">{active.file}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function icon(type: string) {
  const map: Record<string, string> = {
    tool: '🛠️', agent: '🤖', hybrid: '🧬', 'agent-loop': '🔄', oracle: '🛡️', output: '📤',
  }
  return map[type] || '⚙️'
}
