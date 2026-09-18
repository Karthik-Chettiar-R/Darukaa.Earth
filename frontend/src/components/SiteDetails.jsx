import { useEffect, useRef } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import Map from './Map'
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

function formatCreatedAt(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function SiteDetails({ siteId, onBack }) {
  const [site, setSite] = useState(null)
  const [analytics, setAnalytics] = useState([])
  const [error, setError] = useState('')
  const carbonChart = useRef(null)
  const biodiversityChart = useRef(null)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/sites/${siteId}/analytics`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('darukaa_access_token')}` },
    }).then((response) => {
      setSite(response.data)
      setAnalytics(response.data.analytics)
    }).catch(() => setError('Could not load this site.'))
  }, [siteId])

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const line = styles.getPropertyValue('--line').trim()
    const lineSoft = styles.getPropertyValue('--line-soft').trim()
    const inkSoft = styles.getPropertyValue('--ink-soft').trim()

    if (!site || !carbonChart.current || !biodiversityChart.current) return undefined

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
          borderColor: styles.getPropertyValue('--moss-500').trim(),
          backgroundColor: `${styles.getPropertyValue('--moss-500').trim()}33`,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        }] : [],
      },
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
  }, [analytics, site])

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--cream-200)] text-sm text-[var(--forest-800)]"><div className="text-center"><p>{error}</p><button type="button" onClick={onBack} className="mt-4 rounded-[8px] border border-[var(--line)] bg-[var(--white)] px-4 py-2">Back</button></div></main>
  }

  if (!site) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--cream-200)] text-sm text-[var(--ink-soft)]">Loading site...</main>
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
            <h1 className="mt-3 font-display text-[25px] font-medium leading-tight text-[var(--forest-900)]">{site.site.name}</h1>

            <div className="relative mt-8 h-[180px] overflow-hidden rounded-[14px] border border-[var(--line-soft)] bg-[var(--cream-100)]">
              <Map showExpand={false} projects={[{ id: site.project_name, name: site.project_name, color: site.project_color, sites: [site.site] }]} focusGeometry={site.site.location} />
            </div>

            <dl className="mt-7 space-y-4">
              <Detail label="Site ID" value={site.site.id} />
              <Detail label="Project" value={site.project_name} />
              <Detail label="Date created" value={formatCreatedAt(site.site.created_at)} />
            </dl>
          </aside>

          <div className="min-w-0">
            <div className="mb-6">
              <p className="text-xs font-medium text-[var(--ink-soft)]">Environmental monitoring</p>
              <h2 className="mt-1 font-display text-[22px] font-medium text-[var(--forest-900)]">Site performance</h2>
            </div>
            <div className="space-y-5">
              <ChartPanel title="Carbon storage" description={analytics.length ? 'Site measurements over time.' : 'No carbon measurements recorded yet.'} canvasRef={carbonChart} hasData={analytics.length > 0} />
              <ChartPanel title="Biodiversity index" description={analytics.length ? 'Site measurements over time.' : 'No biodiversity measurements recorded yet.'} canvasRef={biodiversityChart} hasData={analytics.length > 0} />
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
