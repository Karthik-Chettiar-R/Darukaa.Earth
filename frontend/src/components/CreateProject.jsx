import { useState } from 'react'
import axios from 'axios'
import Map from './Map'
import { API_BASE_URL } from '../config/api'

const colors = [
  { name: 'Cream', value: 'var(--cream-300)', mapValue: '#E9DFC6' },
  { name: 'Leaf', value: 'var(--leaf-400)', mapValue: '#B7CD9B' },
  { name: 'Moss', value: 'var(--moss-500)', mapValue: '#6B9169' },
  { name: 'Forest', value: 'var(--forest-700)', mapValue: '#2B5039' },
]

function createDraftId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export default function CreateProject({ onBack }) {
  const [projectName, setProjectName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colors[1].name)
  const [siteName, setSiteName] = useState('')
  const [sites, setSites] = useState([])
  const [activeSiteId, setActiveSiteId] = useState(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedMapColor = colors.find((color) => color.name === selectedColor)?.mapValue || colors[1].mapValue

  function addSite(event) {
    event.preventDefault()
    const name = siteName.trim()
    if (!name) return

    const id = createDraftId()
    setSites((currentSites) => [...currentSites, { id, name, location: null }])
    setActiveSiteId(id)
    setSiteName('')
    setError('')
  }

  function handlePolygonCreated(feature) {
    if (!activeSiteId) {
      setError('Add and select a site before drawing its boundary.')
      return
    }

    setSites((currentSites) => currentSites.map((site) => (
      site.id === activeSiteId ? { ...site, location: feature.geometry } : site
    )))
    setActiveSiteId(null)
    setError('')
  }

  function selectSite(siteId) {
    const site = sites.find((item) => item.id === siteId)
    if (site && !site.location) setActiveSiteId(siteId)
  }

  async function saveProject() {
    const name = projectName.trim()
    const selectedSites = sites.filter((site) => site.location)
    if (!name) return setError('Enter a project name.')
    if (!selectedSites.length) return setError('Add at least one site and draw its polygon.')
    if (sites.some((site) => !site.location)) return setError('Draw a polygon for every added site.')

    setIsSaving(true)
    setError('')
    try {
      await axios.post(`${API_BASE_URL}/api/projects`, {
        name,
        color: selectedMapColor,
        sites: selectedSites.map((site) => ({ name: site.name, location: site.location })),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('darukaa_access_token')}` },
      })
      onBack()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not save the project. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--cream-200)] px-5 py-6 text-[var(--ink)] sm:px-8 lg:px-10 lg:py-8">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between">
        <button type="button" onClick={onBack} className="rounded-[8px] border border-[var(--line)] bg-[var(--white)] px-[18px] py-[9px] text-[13.5px] font-medium text-[var(--forest-800)] transition hover:border-[var(--moss-500)] hover:bg-[var(--cream-100)]">
          Back to overview
        </button>
        <button type="button" onClick={saveProject} disabled={isSaving} className="rounded-[8px] border border-[var(--forest-800)] bg-[var(--forest-800)] px-[18px] py-[9px] text-[13.5px] font-medium text-[var(--cream-100)] transition hover:bg-[var(--forest-700)] disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save project'}
        </button>
      </header>

      <div className="mx-auto mt-7 grid min-h-[calc(100vh-136px)] w-full max-w-[1440px] grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-2xl border border-[var(--line-soft)] bg-[var(--white)] p-5 shadow-[0_8px_24px_rgba(19,42,30,0.05)]">
          <div className="mb-6">
            <p className="mb-1 text-xs font-medium text-[var(--ink-soft)]">Project setup</p>
            <h1 className="font-display text-[22px] font-medium text-[var(--forest-900)]">Create a project</h1>
          </div>

          <label className="text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="project-name">
            Project name
            <input id="project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Western Ghats restoration" className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]" />
          </label>

          <fieldset className="mt-6">
            <legend className="text-[13px] font-medium text-[var(--ink-soft)]">Project colour</legend>
            <div className="mt-3 flex items-center gap-3">
              {colors.map((color) => (
                <button key={color.name} type="button" aria-label={`Use ${color.name} colour`} aria-pressed={selectedColor === color.name} onClick={() => setSelectedColor(color.name)} className={`h-7 w-7 rounded-full border-2 border-[var(--white)] shadow-[0_0_0_1px_var(--line)] transition hover:scale-105 ${selectedColor === color.name ? 'ring-2 ring-[var(--forest-800)] ring-offset-2' : ''}`} style={{ backgroundColor: color.value }} />
              ))}
            </div>
          </fieldset>

          <div className="mt-8 border-t border-[var(--line-soft)] pt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[18px] font-medium text-[var(--forest-900)]">Sites</h2>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Name a site, then draw its boundary.</p>
              </div>
              <span className="rounded-[6px] bg-[var(--cream-300)] px-2 py-1 text-xs font-medium text-[var(--forest-800)]">{sites.length}</span>
            </div>

            <form onSubmit={addSite} className="mt-4 flex gap-2">
              <input aria-label="Site name" placeholder="New site name" value={siteName} onChange={(event) => setSiteName(event.target.value)} className="h-9 min-w-0 flex-1 rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]" />
              <button type="submit" aria-label="Add site" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--forest-800)] text-lg leading-none text-[var(--cream-100)] transition hover:bg-[var(--forest-700)]">+</button>
            </form>

            <div className="mt-4 space-y-2">
              {sites.map((site) => (
                <button key={site.id} type="button" onClick={() => selectSite(site.id)} className={`flex w-full items-center gap-3 rounded-[8px] border px-3 py-2.5 text-left transition ${activeSiteId === site.id ? 'border-[var(--moss-500)] bg-[var(--cream-100)]' : 'border-[var(--line-soft)] bg-[var(--cream-100)] hover:border-[var(--moss-500)]'}`}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${site.location ? 'bg-[var(--moss-500)]' : 'bg-[var(--cream-300)]'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-[var(--forest-900)]">{site.name}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--ink-soft)]">{site.location ? 'Boundary added' : 'Draw boundary on map'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-5 text-xs leading-5 text-[var(--forest-700)]" role="alert">{error}</p>}
          <p className="mt-auto pt-8 text-xs leading-5 text-[var(--ink-soft)]">{activeSiteId ? 'Use the polygon tool on the map to draw this site boundary.' : 'Add a site to enable polygon drawing.'}</p>
        </aside>

        <section className="relative flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--white)] shadow-[0_8px_24px_rgba(19,42,30,0.05)]">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--white)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-[18px] font-medium text-[var(--forest-900)]">Draw site boundaries</h2>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{activeSiteId ? 'Select the polygon tool, then click around the site.' : 'Add a site from the panel to begin drawing.'}</p>
            </div>
            <span className="hidden rounded-[6px] bg-[var(--cream-100)] px-2.5 py-1.5 text-xs text-[var(--ink-soft)] sm:block">{selectedColor} boundary</span>
          </div>
          <div className="relative min-h-0 flex-1">
            <Map showExpand={false} drawMode drawColor={selectedMapColor} onPolygonCreated={handlePolygonCreated} />
          </div>
        </section>
      </div>
    </main>
  )
}
