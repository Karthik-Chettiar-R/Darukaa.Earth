import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { Chart, CategoryScale, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js'

Chart.register(CategoryScale, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip)

function formatCreatedAt(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function ProjectDetails({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [analytics, setAnalytics] = useState([])
  const [error, setError] = useState('')
  const carbonChart = useRef(null)
  const biodiversityChart = useRef(null)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('darukaa_access_token')}` },
    }).then((response) => {
      const match = response.data.find((item) => String(item.id) === String(projectId))
      if (match) setProject(match)
      else setError('Project not found.')
    }).catch(() => setError('Could not load this project.'))
  }, [projectId])

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/projects/${projectId}/analytics`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('darukaa_access_token')}` },
    }).then((response) => setAnalytics(response.data)).catch(() => setAnalytics([]))
  }, [projectId])

  useEffect(() => {
    if (!project || !carbonChart.current || !biodiversityChart.current) return undefined

    const styles = getComputedStyle(document.documentElement)
    const line = styles.getPropertyValue('--line').trim()
    const lineSoft = styles.getPropertyValue('--line-soft').trim()
    const inkSoft = styles.getPropertyValue('--ink-soft').trim()
    const moss = styles.getPropertyValue('--moss-500').trim()

    const charts = [
      [carbonChart, 'Carbon storage', analytics.map((point) => point.carbon_storage)],
      [biodiversityChart, 'Biodiversity index', analytics.map((point) => point.biodiversity_index)],
    ].map(([canvasRef, label, values]) => new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: analytics.map((point) => point.recorded_at),
        datasets: values.length ? [{
          label,
          data: values,
          borderColor: moss,
          backgroundColor: `${moss}33`,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        }] : [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: { display: false, text: label },
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
        elements: {
          line: { borderColor: moss, tension: 0.35 },
          point: { radius: 0 },
        },
      },
    }))

    return () => charts.forEach((chart) => chart.destroy())
  }, [analytics, project])

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--cream-200)] px-5 text-sm text-[var(--forest-800)]"><div className="text-center"><p>{error}</p><button type="button" onClick={onBack} className="mt-4 rounded-[8px] border border-[var(--line)] bg-[var(--white)] px-4 py-2">Back</button></div></main>
  }

  if (!project) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--cream-200)] text-sm text-[var(--ink-soft)]">Loading project...</main>
  }

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
          <span className="hidden text-sm text-[var(--ink-soft)] sm:block">Project details</span>
        </header>

        <section className="mt-6 grid min-h-[calc(100vh-148px)] grid-cols-1 gap-5 rounded-[20px] border border-[var(--line-soft)] bg-[var(--white)] p-5 shadow-[0_10px_30px_rgba(19,42,30,0.06)] sm:p-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:p-8">
          <aside className="flex flex-col border-b border-[var(--line-soft)] pb-6 lg:border-b-0 lg:border-r lg:pr-8">
            <p className="text-xs font-medium text-[var(--moss-500)]">Project</p>
            <h1 className="mt-2 font-display text-[25px] font-medium leading-tight text-[var(--forest-900)]">{project.name}</h1>

            <div className="mt-8">
              <h2 className="font-display text-[17px] font-medium text-[var(--forest-900)]">Sites</h2>
              <div className="mt-3 space-y-2">
                {project.sites.map((site, index) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      window.history.pushState({}, '', `/project/${projectId}/site/${site.id}`)
                      window.dispatchEvent(new PopStateEvent('popstate'))
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] border border-[var(--line-soft)] bg-[var(--cream-100)] px-3 py-2.5 text-left text-[13px] text-[var(--ink-soft)] transition hover:border-[var(--moss-500)] hover:bg-[var(--white)]"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-[var(--leaf-400)]' : 'bg-[var(--moss-500)]'}`} />
                    <span className="truncate">{site.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8">
              <p className="text-xs text-[var(--ink-soft)]">Date created</p>
              <p className="mt-1 text-sm font-medium text-[var(--forest-900)]">{formatCreatedAt(project.created_at)}</p>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--ink-soft)]">Monitoring overview</p>
                <h2 className="mt-1 font-display text-[22px] font-medium text-[var(--forest-900)]">Project performance</h2>
              </div>
              <button type="button" aria-label="Close project details" onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[var(--line-soft)] bg-[var(--white)] text-xl leading-none text-[var(--forest-800)] transition hover:bg-[var(--cream-100)]">×</button>
            </div>

            <div className="space-y-5">
              <ChartPanel title="Carbon storage" description={analytics.length ? 'Project measurements over time.' : 'No carbon measurements recorded yet.'} canvasRef={carbonChart} hasData={analytics.length > 0} />
              <ChartPanel title="Biodiversity index" description={analytics.length ? 'Project measurements over time.' : 'No biodiversity measurements recorded yet.'} canvasRef={biodiversityChart} hasData={analytics.length > 0} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function ChartPanel({ title, description, canvasRef, hasData }) {
  return (
    <section className="rounded-[14px] border border-[var(--line-soft)] bg-[var(--cream-100)] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[17px] font-medium text-[var(--forest-900)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{description}</p>
        </div>
        <span className="rounded-[6px] bg-[var(--cream-300)] px-2 py-1 text-[11px] font-medium text-[var(--ink-soft)]">{hasData ? 'Live data' : 'No data'}</span>
      </div>
      <div className="h-[190px] rounded-[9px] border border-[var(--line-soft)] bg-[var(--white)] p-3 sm:h-[220px]">
        <canvas ref={canvasRef} />
      </div>
    </section>
  )
}
