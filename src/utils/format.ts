export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

export const num = (v: number, digits = 2) => Number(v).toFixed(digits)

export const typeColor = (t: string): string => {
  const map: Record<string, string> = {
    参数问询: 'bg-indigo-50 text-indigo-600',
    场景问询: 'bg-cyan-50 text-cyan-600',
    功能问询: 'bg-emerald-50 text-emerald-600',
    对比问询: 'bg-amber-50 text-amber-600',
    推荐问询: 'bg-rose-50 text-rose-600',
    成分问询: 'bg-teal-50 text-teal-600',
    营养问询: 'bg-lime-50 text-lime-600',
  }
  return map[t] || 'bg-slate-100 text-slate-600'
}

export const platformColor = (p: string): string => {
  const map: Record<string, string> = {
    deepseek: '#4f46e5', qwen: '#6366f1', kimi: '#0891b2',
    doubao: '#d97706', yuanbao: '#059669',
  }
  return map[p] || '#94a3b8'
}
