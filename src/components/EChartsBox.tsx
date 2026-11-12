import { useEffect, useRef, useState } from 'react'
import type { EChartsOption } from 'echarts'

/**
 * ECharts 懒加载容器：echarts 体积较大（~1MB），
 * 通过 dynamic import 做代码分割，首屏不加载图表库；窗口尺寸变化自适应。
 */
export default function EChartsBox({ option, height = 300 }: { option: EChartsOption; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<{ setOption: (o: EChartsOption) => void; resize: () => void; dispose: () => void } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let disposed = false
    let onResize: (() => void) | null = null
    import('echarts').then((mod) => {
      if (disposed || !ref.current) return
      const chart = mod.init(ref.current)
      chart.setOption(option)
      chartRef.current = chart
      setReady(true)
      onResize = () => chart.resize()
      window.addEventListener('resize', onResize)
    })
    return () => {
      disposed = true
      if (onResize) window.removeEventListener('resize', onResize)
      chartRef.current?.dispose()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option)
  }, [option])

  return (
    <div style={{ height }} className="relative w-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">图表加载中…</div>
      )}
      <div ref={ref} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
