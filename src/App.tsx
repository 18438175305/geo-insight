import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: '监测总览', icon: '📊' },
  { to: '/audit', label: '品牌体检', icon: '🔍' },
  { to: '/questions', label: '探针问题库', icon: '❓' },
  { to: '/answers', label: 'AI 回答洞察', icon: '💬' },
  { to: '/pipeline', label: '智能体编排', icon: '🤖' },
]

export default function App() {
  return (
    <div className="flex min-h-screen">
      {/* 侧边导航 */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg text-white shadow-md">
            ◎
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight text-slate-900">GEO Insight</div>
            <div className="text-[11px] text-slate-400">AI品牌可见性监测</div>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 text-[11px] leading-relaxed text-slate-400">
          数据来源：GEO 品牌监测系统
          <br />
          真实运行产物（2026-05）
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="ml-56 flex-1">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
