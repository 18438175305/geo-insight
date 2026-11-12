/** 与 AI 接入层约定的数据结构 */

export interface BrandSummary {
  name: string
  domain: string
  domainName: string
  competitors: string[]
  totalQuestions: number
  totalRewrites: number
  avgObjectiveScore: number
  avgSubjectiveScore: number
  avgTotalScore: number
  brandLeakRate: number
  generatedAt: string
}

export interface EvaluationMetrics {
  brand_leak_score: number
  entity_coverage: number
  completeness: number
  competitor_relevance: number
  objective_score: number
  naturalness: number
  meaningfulness: number
  subjective_score: number
  total_score: number
}

export interface QuestionPair {
  id: string
  brand_name: string
  competitors: string[]
  primary_question: string
  question_type: string
  target_entity: string
  rewritten_questions: string[]
  entity_tags: string[]
  evaluation_metrics: EvaluationMetrics
}

export interface QuestionSet {
  brand_name: string
  competitors: string[]
  generated_at: string
  question_pairs: QuestionPair[]
  evaluation_summary: {
    total_blocks: number
    total_questions: number
    total_rewritten_questions: number
    avg_questions_per_block: number
    avg_rewrites_per_question: number
    avg_objective_score: number
    avg_subjective_score: number
    avg_total_score: number
    brand_leak_rate: number
    questions_by_type: Record<string, number>
  }
}

export interface PlatformStat {
  platform: string
  platform_name: string
  total_answers: number
  mentioned: number
  mention_rate: number
  avg_rank_when_mentioned: number
  rank1_rate: number
  top3_rate: number
  top5_rate: number
  sentiment_pos: number
  sentiment_neg: number
  sentiment_neu: number
  avg_citation_score: number
  avg_mentions_per_answer: number
}

export interface AnswerSample {
  question: string
  platform: string
  platform_name: string
  mentioned: boolean
  rank: number
  mention_count: number
  competitors_found: string[]
  competitor_ranks: Record<string, number>
  brand_website_cited: boolean
  answer_excerpt: string
  category: string
}

export interface GeoStats {
  brand: string
  total_analysis_rows: number
  platforms: Record<string, PlatformStat>
  answer_samples: AnswerSample[]
}

export type PipelineNode = {
  id: string
  label: string
  layer: string
  type: string
  desc: string
  artifact: string
  file: string
}

export type StreamEvent =
  | { event: 'meta'; data: { mode: string; model?: string; note?: string; fallback?: boolean; reason?: string } }
  | { event: 'token'; data: { text: string } }
  | { event: 'guard'; data: { question: string; leaked: boolean; matched: string[] } }
  | { event: 'complete'; data: { mode: string; count?: number } }
  | { event: 'error'; data: { message: string } }
