import { useEffect, useRef } from 'react'
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

Chart.register(CategoryScale, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip)

const siteData = {
  'mumbai-coast': {
    name: 'Mumbai coast',
    siteId: 'MUM-001',
    projectName: 'Mangrove restoration',
    dateCreated: '12 February 2026',
    color: 'var(--leaf-400)',
  },
  'thane-creek': {
    name: 'Thane creek',
    siteId: 'MUM-002',
    projectName: 'Mangrove restoration',
    dateCreated: '12 February 2026',
    color: 'var(--moss-500)',
  },
  'north-restoration-plot': {
    name: 'North restoration plot',
    siteId: 'MUM-003',
    projectName: 'Mangrove restoration',
    dateCreated: '12 February 2026',
    color: 'var(--forest-700)',
  },
  'pune-district': {
    name: 'Pune district',
    siteId: 'PUN-001',
    projectName: 'Urban forest initiative',
    dateCreated: '04 March 2026',
    color: 'var(--leaf-400)',
  },
  'aundh-community-grove': {
    name: 'Aundh community grove',
    siteId: 'PUN-002',
    projectName: 'Urban forest initiative',
    dateCreated: '04 March 2026',
    color: 'var(--moss-500)',
  },
}

const fallbackSite = {
  name: 'New monitoring site',
  siteId: 'SITE-000',
  projectName: 'New conservation project',
  dateCreated: '18 September 2026',
  color: 'var(--leaf-400)',
}

export default function SiteDetails({ siteId, onBack }) {
  const site = siteData[siteId] ?? fallbackSite
  const carbonChart = useRef(null)
  const biodiversityChart = useRef(null)

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const line = styles.getPropertyValue('--line').trim()
    const lineSoft = styles.getPropertyValue('--line-soft').trim()
    const inkSoft = styles.getPropertyValue('--ink-soft').trim()

    const charts = [carbonChart, biodiversityChart].map((canvasRef) => new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            border: { color: line },
            grid: { color: lineSoft },
            ticks: { color: inkSoft, maxTicksLimit: 6 },
          },
          y: {
            beginAtZero: true,
            border: { color: line },
            grid: { color: lineSoft },
            ticks: { color: inkSoft, maxTicksLimit: 5 },
          },
        },
      },
    }))

    return () => charts.forEach((chart) => chart.destroy())
  }, [])

  return (
    <main className="min-h-screen bg-[var(--cream-200)] px-5 py-5 text-[var(--ink)] sm:px-8 sm:py-7 lg:px-10">
      <div className="mx-auto w-full max-w-[1320px]">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--white)] px-4 py-2 text-sm font-medium text-[var(--forest-800)] transition hover:border-[var(--moss-500)] hover:bg-[var(--cream-100)]"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
          <span className="hidden text-sm text-[var(--ink-soft)] sm:block">Site details</span>
        </header>

        <section className="mt-6 grid min-h-[calc(100vh-148px)] grid-cols-1 gap-5 rounded-[20px] border border-[var(--line-soft)] bg-[var(--white)] p-5 shadow-[0_10px_30px_rgba(19,42,30,0.06)] sm:p-7 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:p-8">
          <aside className="flex flex-col border-b border-[var(--line-soft)] pb-6 lg:border-b-0 lg:border-r lg:pr-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium text-[var(--moss-500)]">Site overview</p>
              <button
                type="button"
                aria-label="Close site details"
                onClick={onBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[var(--line-soft)] bg-[var(--white)] text-xl leading-none text-[var(--forest-800)] transition hover:bg-[var(--cream-100)]"
              >
                ×
              </button>
            </div>
            <h1 className="mt-3 font-display text-[25px] font-medium leading-tight text-[var(--forest-900)]">{site.name}</h1>

            <div className="mt-8 flex justify-center rounded-[14px] border border-[var(--line-soft)] bg-[var(--cream-100)] py-8">
              <span className="h-28 w-36 [clip-path:polygon(8%_15%,88%_27%,100%_82%,38%_100%)]" style={{ backgroundColor: site.color }} />
            </div>

            <dl className="mt-7 space-y-4">
              <Detail label="Site ID" value={site.siteId} />
              <Detail label="Project" value={site.projectName} />
              <Detail label="Date created" value={site.dateCreated} />
            </dl>
          </aside>

          <div className="min-w-0">
            <div className="mb-6">
              <p className="text-xs font-medium text-[var(--ink-soft)]">Environmental monitoring</p>
              <h2 className="mt-1 font-display text-[22px] font-medium text-[var(--forest-900)]">Site performance</h2>
            </div>
            <div className="space-y-5">
              <ChartPanel title="Carbon storage" description="Data will appear as field measurements are collected." canvasRef={carbonChart} />
              <ChartPanel title="Biodiversity index" description="Data will appear as field measurements are collected." canvasRef={biodiversityChart} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-[var(--ink-soft)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--forest-900)]">{value}</dd>
    </div>
  )
}

function ChartPanel({ title, description, canvasRef }) {
  return (
    <section className="rounded-[14px] border border-[var(--line-soft)] bg-[var(--cream-100)] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[17px] font-medium text-[var(--forest-900)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{description}</p>
        </div>
        <span className="rounded-[6px] bg-[var(--cream-300)] px-2 py-1 text-[11px] font-medium text-[var(--ink-soft)]">No data</span>
      </div>
      <div className="h-[190px] rounded-[9px] border border-[var(--line-soft)] bg-[var(--white)] p-3 sm:h-[220px]">
        <canvas ref={canvasRef} />
      </div>
    </section>
  )
}
