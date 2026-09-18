import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'
import Map from './components/Map'
import ProjectsSidebar from './components/ProjectsSidebar'
import CreateProject from './components/CreateProject'
import ProjectDetails from './components/ProjectDetails'
import SiteDetails from './components/SiteDetails'
import Login from './components/Login'
import Register from './components/Register'
import { API_BASE_URL } from './config/api'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('darukaa_access_token')))
  const [projects, setProjects] = useState([])
  const [carbonStorage, setCarbonStorage] = useState(0)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const requestConfig = {
      headers: { Authorization: `Bearer ${localStorage.getItem('darukaa_access_token')}` },
    }

    Promise.all([
      axios.get(`${API_BASE_URL}/api/projects`, requestConfig),
      axios.get(`${API_BASE_URL}/api/analytics/summary`, requestConfig),
    ]).then(([projectsResponse, summaryResponse]) => {
      setProjects(projectsResponse.data)
      setCarbonStorage(summaryResponse.data.carbon_storage)
    }).catch(() => {
      setProjects([])
      setCarbonStorage(0)
    })
  }, [isAuthenticated, path])

  const navigate = (destination) => {
    window.history.pushState({}, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const logout = () => {
    localStorage.removeItem('darukaa_access_token')
    setIsAuthenticated(false)
    navigate('/login')
  }

  if (path === '/login') {
    return <Login onNavigate={navigate} onAuthenticated={() => setIsAuthenticated(true)} />
  }

  if (path === '/register') {
    return <Register onNavigate={navigate} />
  }

  if (!isAuthenticated) {
    window.history.replaceState({}, '', '/login')
    return <Login onNavigate={navigate} onAuthenticated={() => setIsAuthenticated(true)} />
  }

  if (path === '/create-project') {
    return <CreateProject onBack={() => window.history.back()} />
  }

  const siteMatch = path.match(/^\/project\/([^/]+)\/site\/([^/]+)$/)
  if (siteMatch) {
    return <SiteDetails siteId={siteMatch[2]} onBack={() => window.history.back()} />
  }

  const projectMatch = path.match(/^\/project\/([^/]+)$/)
  if (projectMatch) {
    return <ProjectDetails projectId={projectMatch[1]} onBack={() => window.history.back()} />
  }

  return (
    <main className="min-h-screen bg-[var(--cream-200)] text-[var(--ink)]">
      <div className="grid min-h-screen grid-cols-1 grid-rows-[68px_auto_1fr] lg:grid-cols-[272px_1fr] lg:grid-rows-[68px_1fr]">
        <header className="col-span-full flex items-center justify-between border-b border-[var(--forest-800)] bg-[var(--forest-900)] px-5 sm:px-7">
          <div className="flex items-center gap-2.5 font-display text-[19px] font-semibold text-[var(--cream-100)]">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[var(--leaf-400)] text-sm text-[var(--forest-900)]">D</span>
            darukaa.earth
          </div>
          <button onClick={logout} className="rounded-[8px] border border-[rgba(250,246,236,0.25)] bg-transparent px-[18px] py-[9px] text-[13.5px] font-medium text-[var(--cream-100)] transition hover:border-[rgba(250,246,236,0.45)] hover:bg-[rgba(250,246,236,0.08)]">Log out</button>
        </header>

        <ProjectsSidebar projects={projects} />

        <section className="min-w-0 overflow-y-auto px-5 pb-12 pt-8 sm:px-8 lg:px-10">
          <div className="mb-[26px] flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="font-display text-[28px] font-medium leading-tight text-[var(--forest-900)]">Projects overview</h1>
            
          </div>

          <div className="mb-6 grid grid-cols-1 gap-[18px] sm:grid-cols-3">
            <Metric label="No. of projects" value={projects.length} />
            <Metric label="No. of sites" value={projects.reduce((total, project) => total + (project.sites?.length || 0), 0)} />
            <Metric label="Carbon reduced" value={carbonStorage.toLocaleString()} unit="tCO2e" accent />
          </div>

          <section className="overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--white)]">
            <div className="flex flex-col gap-3 border-b border-[var(--line-soft)] px-[22px] py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-base font-medium text-[var(--forest-900)]">Site map</h2>
              
            </div>
            <div className="relative h-[400px] bg-[var(--cream-100)]">
              <Map projects={projects} />
              </div>
          </section>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value, unit, trend, accent = false }) {
  return (
    <div className="relative flex min-h-[132px] flex-col gap-1.5 overflow-hidden rounded-[14px] border border-[var(--line-soft)] bg-[var(--white)] px-[22px] py-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent ? 'bg-[var(--leaf-400)]' : 'bg-[var(--moss-500)]'}`} />
      <span className="text-[13px] font-medium text-[var(--ink-soft)]">{label}</span>
      <span className="font-display text-[34px] font-medium leading-[1.1] text-[var(--forest-900)]">
        {value}
        {unit && <span className="ml-1 font-[var(--font-body)] text-[15px] font-medium text-[var(--ink-soft)]">{unit}</span>}
      </span>
      {trend && <span className="text-[12.5px] font-medium text-[var(--moss-500)]">{trend}</span>}
    </div>
  )
}

export default App
