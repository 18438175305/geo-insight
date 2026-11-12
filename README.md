# GEO Insight · AI 品牌可见性监测平台

> 当用户在 DeepSeek、通义千问、Kimi、豆包、元宝问"什么手机拍照好"时，AI 的回答里会不会提到你的品牌？
> GEO Insight 把这个问题的答案变成可度量的仪表盘。

**队伍信息**：队伍名：慧见 ｜ 成员：陈园方、张伊婕 ｜ 学校：西安交通大学 ｜ 组别：研究生组

## 项目简介

GEO（Generative Engine Optimization，生成式引擎优化）时代，品牌方需要量化自身在 AI 平台回答中的"可见性"。本项目是 **GEO 品牌监测系统的 Web 前端应用**：

- **探针问题生成**：基于品牌知识图谱生成"刻意隐藏品牌名"的问题（SSE 流式输出，配品牌泄露双重安全护栏）；
- **可见性仪表盘**：提及率 / 排名分布 / 情感倾向 / 五平台矩阵，全部来自真实运行数据；
- **AI 回答洞察**：平台回答原文 + 品牌与竞品同场排名解剖；
- **智能体编排可视化**：LangGraph 8-Agent 流水线交互图。

页面中展示的华为/君乐宝数据均为 GEO 系统真实运行产物（2026-05，Milvus `geo_analysis` 集合 367+26 条分析记录、50 条探针问题对），**无一条人工编造**。

## 技术架构

```
┌──────────────────────────────────────────────────┐
│  前端 React 18 + TypeScript + Vite + Tailwind     │
│  react-router 路由 · ECharts 懒加载代码分割        │
│  SSE 流式渲染 · SVG 组件 · 响应式布局              │
├──────────────────────────────────────────────────┤
│  AI 接入层 Express（server/index.mjs）            │
│  · LLM 双模式：直连 OpenAI 兼容 API ⇄ 演示回放     │
│  · SSE 流式下发 + 服务端品牌泄露护栏               │
│  · 真实产物数据接口（问题库/GEO统计/流水线定义）     │
├──────────────────────────────────────────────────┤
│  数据层 真实运行产物 JSON（GEO 品牌监测系统产出）    │
│  探针问题对 · 平台可见性统计 · AI回答样本           │
└──────────────────────────────────────────────────┘
```

后端仅作为 AI 能力接入层（比赛要求），业务数据来自 GEO 品牌监测系统真实产物。

## 安装运行

```bash
# 1. 安装依赖（Node 18+）
npm install

# 2. 一键启动（前端 5173 + AI接入层 8787）
npm run dev
# 浏览器访问 http://localhost:5173

# 或者仅启动 AI 接入层（生产模式，托管构建产物）
npm run build && npm start   # http://localhost:8787
```

**AI 双模式说明**：
- 未配置任何 Key：自动运行于「演示回放」模式——SSE 逐 token 回放真实生成过的问题，交互体验与直连完全一致（页面明确标注模式来源）；
- 配置 `.env`（复制 `.env.example`）：`LLM_API_KEY / LLM_BASE_URL / LLM_MODEL` 任意 OpenAI 兼容接口（DeepSeek / 通义千问 / GLM），切换为实时生成，失败自动回退演示模式。

## 目录结构

```
geo-insight/
├── server/                  # AI 接入层
│   ├── index.mjs            #   Express 路由 + SSE + 静态托管
│   ├── llm.mjs              #   LLM 直连 / 演示回放双模式 + 泄露护栏
│   └── data/                #   真实产物数据（问题库/GEO统计/流水线）
├── src/
│   ├── pages/               # 5 个页面
│   │   ├── Dashboard.tsx    #   监测总览（真实GEO数据可视化）
│   │   ├── Audit.tsx        #   品牌体检（SSE流式生成+护栏+分析联动）
│   │   ├── Questions.tsx    #   探针问题库（筛选/分布/指标展开）
│   │   ├── Answers.tsx      #   AI回答洞察（原文+竞品排名）
│   │   └── Pipeline.tsx     #   智能体编排可视化（8-Agent）
│   ├── components/          # ScoreRing/StatTile/EChartsBox
│   ├── api/client.ts        # REST + SSE 客户端
│   └── types.ts             # 与接入层约定的类型
└── docs/                    # 技术文档
```

## 环境变量

见 `.env.example`：`LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` / `PORT`。**密钥只通过环境变量注入，绝不入库入仓。**

## 与 GEO 品牌监测系统的关系

本仓库是 GEO 品牌监测系统（自研：LangGraph Multi-Agent + Qwen2.5-7B SFT/GRPO 微调 + Milvus + 5 平台 API）的 Web 前端呈现层，数据接口直连其真实运行产物。系统级测试方案见《AI 智能体测试挑战赛》参赛作品 AgentGuard（81 个可复现测试用例）。
