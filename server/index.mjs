/**
 * GEO Insight —— AI 接入层（Express）
 *
 * 职责（仅作为 AI 能力接入层，不含业务库表）：
 *  1. 静态托管前端构建产物（生产模式）
 *  2. 提供真实产物数据接口（品牌/问题库/GEO分析统计）
 *  3. 探针问题生成：SSE 流式输出
 *     - 配置 LLM Key 时：真实调用 OpenAI 兼容接口（DeepSeek/Qwen/GLM 均可）
 *     - 未配置时：进入「演示回放」模式——逐 token 回放系统真实生成过的问题
 *  4. 品牌泄露护栏：服务端对每条输出做品牌名/别名检测（AI 安全）
 */
import express from 'express'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { streamProbeQuestions } from './llm.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, 'data')
const app = express()
app.use(express.json({ limit: '1mb' }))

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf-8'))

// ---------- 品牌与真实产物数据 ----------
const BRAND_FILES = { '华为': 'questions_华为.json', '君乐宝': 'questions_君乐宝.json' }
const GEO_FILES = { '华为': 'geo_stats_华为.json', '君乐宝': 'geo_stats_君乐宝.json' }

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: process.env.LLM_API_KEY ? 'live' : 'demo' }))

app.get('/api/brands', (_req, res) => {
  const brands = Object.entries(BRAND_FILES).map(([name, file]) => {
    const q = readJson(file)
    const s = q.evaluation_summary || {}
    return {
      name,
      domain: name === '华为' ? 'electronics' : 'food',
      domainName: name === '华为' ? '电子产品' : '食品',
      competitors: q.competitors || [],
      totalQuestions: s.total_questions ?? 0,
      totalRewrites: s.total_rewritten_questions ?? 0,
      avgObjectiveScore: s.avg_objective_score ?? 0,
      avgSubjectiveScore: s.avg_subjective_score ?? 0,
      avgTotalScore: s.avg_total_score ?? 0,
      brandLeakRate: s.brand_leak_rate ?? 0,
      generatedAt: q.generated_at,
    }
  })
  res.json(brands)
})

app.get('/api/questions/:brand', (req, res) => {
  const file = BRAND_FILES[req.params.brand]
  if (!file) return res.status(404).json({ error: '未收录该品牌的问题库' })
  res.json(readJson(file))
})

app.get('/api/geo/:brand', (req, res) => {
  const file = GEO_FILES[req.params.brand]
  if (!file) return res.status(404).json({ error: '未收录该品牌的 GEO 分析数据' })
  res.json(readJson(file))
})

// ---------- 8-Agent 流水线定义（编排可视化数据） ----------
app.get('/api/pipeline', (_req, res) => res.json(readJson('pipeline.json')))

// ---------- 探针问题生成（SSE 流式） ----------
app.get('/api/generate/questions', async (req, res) => {
  const brand = String(req.query.brand || '').trim() || '华为'
  const domain = String(req.query.domain || 'electronics')
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  try {
    await streamProbeQuestions({ brand, domain, send: (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    } })
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: String(err.message || err)})}\n\n`)
  }
  res.write('event: done\ndata: {}\n\n')
  res.end()
})

// ---------- GEO 分析（触发/查询） ----------
app.post('/api/geo/analyze', (req, res) => {
  const { brand } = req.body || {}
  const file = GEO_FILES[brand]
  if (file) {
    const stats = readJson(file)
    return res.json({ status: 'ok', source: 'real', data: stats })
  }
  // 未收录品牌：说明需要完整后端环境（真实调用五大平台 API）
  res.json({
    status: 'requires-backend',
    message: `「${brand}」需在完整 GEO 系统环境（含平台 API Key 与本地模型）下运行爬取→KG→生成→GEO追踪全链路，本演示站点仅收录真实历史运行数据。`,
  })
})

// ---------- 静态托管（生产） ----------
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const PORT = Number(process.env.PORT || 8787)
app.listen(PORT, () => console.log(`[geo-insight] AI 接入层已启动: http://localhost:${PORT}`))
