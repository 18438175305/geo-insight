/**
 * LLM 接入与「演示回放」双模式探针问题生成器。
 *
 * 直连模式（配置环境变量）：
 *   LLM_API_KEY / LLM_BASE_URL / LLM_MODEL —— 任意 OpenAI 兼容接口
 *   （DeepSeek / 通义千问 / GLM / Kimi 均可，性价比高）
 *
 * 演示回放模式（默认，无需任何 Key）：
 *   从 server/data 真实历史产物中选取该品牌的问题，按 token 切片流式回放，
 *   每条消息都经过服务端品牌泄露护栏检测 —— 前端交互与直连模式完全一致。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, 'data')

const QUESTION_PROMPT = (brand, domain) => `你是专业的品牌相关问题生成专家，需根据以下信息生成不包含品牌名称的问题，目的是测试用户是否会根据问题描述联想到该品牌。
品牌名称:${brand}
领域:${domain}
【生成要求】
1. 问题中绝对不能出现品牌名称或其任何别名，只能用特征描述代替
2. 问题应该能引导用户联想到该品牌的产品特征、功效、使用场景等
3. 问题类型要多样化，每个文本块生成2-4个不同角度的问题
4. 问题要自然流畅，像真实用户提问
【输出格式】请以JSON数组格式输出：
[{"question":"问题内容","question_type":"问题类型名称","target_entity":"问题针对的核心实体"}]`

/** 品牌泄露护栏：检测品牌名及其常见变体（AI 安全，服务端强制） */
export function detectLeak(text, brand) {
  const low = String(text).toLowerCase()
  const pinyin = { 华为: ['huawei'], 君乐宝: ['junlebao'], 小米: ['xiaomi'], 云南白药: ['yunnanbaiyao'] }
  const variants = new Set([brand.toLowerCase(), ...(pinyin[brand] || [])])
  const hit = [...variants].filter((v) => v.length >= 2 && low.includes(v))
  return { leaked: hit.length > 0, matched: hit }
}

/** 直连模式：调用 OpenAI 兼容接口，逐 token 产出 */
async function streamFromLLM({ brand, domain, send }) {
  const base = process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1'
  const model = process.env.LLM_MODEL || 'deepseek-chat'
  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'user', content: QUESTION_PROMPT(brand, domain) }],
    }),
  })
  if (!resp.ok) throw new Error(`LLM 接口返回 ${resp.status}`)
  send('meta', { mode: 'live', model, brand })
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content || ''
        if (delta) send('token', { text: delta })
      } catch { /* 忽略心跳行 */ }
    }
  }
  send('complete', { mode: 'live' })
}

/** 演示回放模式：回放真实历史生成结果（标注来源） */
async function replayFromCorpus({ brand, domain, send }) {
  const file = brand === '君乐宝' ? 'questions_君乐宝.json' : 'questions_华为.json'
  const corpus = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf-8'))
  const pairs = (corpus.question_pairs || []).slice(0, 6)
  send('meta', {
    mode: 'demo-replay',
    brand,
    domain,
    note: '演示模式：逐字回放 GEO 系统 2026-05-22 真实生成并通过双重评估的问题（接入 LLM_API_KEY 后切换为实时生成）',
  })
  for (const p of pairs) {
    const line = JSON.stringify({
      question: p.primary_question,
      question_type: p.question_type,
      target_entity: p.target_entity,
    })
    // 按 6~10 字符切片流式回放，模拟真实生成节奏
    for (let i = 0; i < line.length; i += 7) {
      send('token', { text: line.slice(i, i + 7) })
      await sleep(18)
    }
    // 服务端安全护栏：逐条品牌泄露检测
    const guard = detectLeak(p.primary_question, brand)
    send('guard', { question: p.primary_question, ...guard })
    await sleep(120)
  }
  send('complete', { mode: 'demo-replay', count: pairs.length })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function streamProbeQuestions(opts) {
  if (process.env.LLM_API_KEY) {
    try {
      return await streamFromLLM(opts)
    } catch (err) {
      opts.send('meta', { mode: 'demo-replay', fallback: true, reason: String(err.message || err) })
      return await replayFromCorpus(opts)
    }
  }
  return await replayFromCorpus(opts)
}
