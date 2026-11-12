/** AI 接入层客户端：REST + SSE 流式消费 */
import type { BrandSummary, GeoStats, QuestionSet, PipelineNode, StreamEvent } from '../types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const resp = await fetch(`${BASE}${path}`)
  if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || `请求失败 ${resp.status}`)
  return resp.json()
}

export const fetchBrands = () => get<BrandSummary[]>('/brands')
export const fetchQuestions = (brand: string) => get<QuestionSet>(`/questions/${encodeURIComponent(brand)}`)
export const fetchGeoStats = (brand: string) => get<GeoStats>(`/geo/${encodeURIComponent(brand)}`)
export const fetchPipeline = () => get<{ name: string; nodes: PipelineNode[]; edges: [string, string, string?][] }>('/pipeline')

export async function analyzeGeo(brand: string): Promise<{ status: string; data?: GeoStats; message?: string }> {
  const resp = await fetch(`${BASE}/geo/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand }),
  })
  return resp.json()
}

/** 消费探针问题生成的 SSE 流（EventSource 不支持自定义头，这里用 fetch+reader 通用实现） */
export async function streamQuestionGeneration(
  brand: string,
  domain: string,
  onEvent: (evt: StreamEvent) => void,
  signal?: AbortSignal,
) {
  const resp = await fetch(`${BASE}/generate/questions?brand=${encodeURIComponent(brand)}&domain=${domain}`, { signal })
  if (!resp.body) throw new Error('当前环境不支持流式响应')
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    // SSE 帧以空行分隔
    const frames = buf.split('\n\n')
    buf = frames.pop() || ''
    for (const frame of frames) {
      let event = 'message'
      let data = '{}'
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data = line.slice(5).trim()
      }
      try {
        onEvent({ event, data: JSON.parse(data) } as StreamEvent)
      } catch {
        /* 跳过不完整帧 */
      }
    }
  }
}
