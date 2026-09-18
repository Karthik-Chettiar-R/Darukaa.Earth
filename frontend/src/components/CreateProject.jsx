import { useState } from 'react'
import Map from './Map'

const colors = [
  { name: 'Cream', value: 'var(--cream-300)' },
  { name: 'Leaf', value: 'var(--leaf-400)' },
  { name: 'Moss', value: 'var(--moss-500)' },
  { name: 'Forest', value: 'var(--forest-700)' },
]

const initialSites = [
  { name: 'North restoration plot', type: 'Restoration site' },
  { name: 'Creekside nursery', type: 'Agroforestry site' },
]

export default function CreateProject({ onBack }) {
  const [projectName, setProjectName] = useState('New conservation project')
  const [selectedColor, setSelectedColor] = useState(colors[1].name)
  const [siteName, setSiteName] = useState('')
  const [sites, setSites] = useState(initialSites)

  function addSite(event) {
    event.preventDefault()
    const name = siteName.trim()
    if (!name) return
    setSites((currentSites) => [...currentSites, { name, type: 'Restoration site' }])
    setSiteName('')
  }

  return (
    <main className="min-h-screen bg-[var(--cream-200)] px-5 py-6 text-[var(--ink)] sm:px-8 lg:px-10 lg:py-8">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[8px] border border-[var(--line)] bg-[var(--white)] px-[18px] py-[9px] text-[13.5px] font-medium text-[var(--forest-800)] transition hover:border-[var(--moss-500)] hover:bg-[var(--cream-100)]"
        >
          Back to overview
        </button>
        <button
          type="button"
          className="rounded-[8px] border border-[var(--forest-800)] bg-[var(--forest-800)] px-[18px] py-[9px] text-[13.5px] font-medium text-[var(--cream-100)] transition hover:bg-[var(--forest-700)]"
        >
          Save project
        </button>
      </header>

      <div className="mx-auto mt-7 grid min-h-[calc(100vh-136px)] w-full max-w-[1440px] grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-2xl border border-[var(--line-soft)] bg-[var(--white)] p-5 shadow-[0_8px_24px_rgba(19,42,30,0.05)]">
          <div className="mb-6">
            <p className="mb-1 text-xs font-medium text-[var(--ink-soft)]">Project setup</p>
            <h1 className="font-display text-[22px] font-medium text-[var(--forest-900)]">Create a project</h1>
          </div>

          <label className="text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm outline-none transition focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
          />

          <fieldset className="mt-6">
            <legend className="text-[13px] font-medium text-[var(--ink-soft)]">Project colour</legend>
            <div className="mt-3 flex items-center gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  aria-label={`Use ${color.name} colour`}
                  aria-pressed={selectedColor === color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`h-7 w-7 rounded-full border-2 border-[var(--white)] shadow-[0_0_0_1px_var(--line)] transition hover:scale-105 ${selectedColor === color.name ? 'ring-2 ring-[var(--forest-800)] ring-offset-2' : ''}`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-8 border-t border-[var(--line-soft)] pt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[18px] font-medium text-[var(--forest-900)]">Sites</h2>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Add locations to this project.</p>
              </div>
              <span className="rounded-[6px] bg-[var(--cream-300)] px-2 py-1 text-xs font-medium text-[var(--forest-800)]">{sites.length}</span>
            </div>

            <form onSubmit={addSite} className="mt-4 flex gap-2">
              <input
                aria-label="Site name"
                placeholder="Site name"
                value={siteName}
                onChange={(event) => setSiteName(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
              />
              <button
                type="submit"
                aria-label="Add site"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--forest-800)] text-lg leading-none text-[var(--cream-100)] transition hover:bg-[var(--forest-700)]"
              >
                +
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {sites.map((site) => (
                <div key={site.name} className="flex items-center gap-3 rounded-[8px] border border-[var(--line-soft)] bg-[var(--cream-100)] px-3 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--moss-500)]" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--forest-900)]">{site.name}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">{site.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-auto pt-8 text-xs leading-5 text-[var(--ink-soft)]">Select a point on the map to place a site. You can refine its details later.</p>
        </aside>

        <section className="relative flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--white)] shadow-[0_8px_24px_rgba(19,42,30,0.05)]">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--white)] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-[18px] font-medium text-[var(--forest-900)]">Choose project location</h2>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Explore the map to find the area you want to monitor.</p>
            </div>
            <span className="hidden rounded-[6px] bg-[var(--cream-100)] px-2.5 py-1.5 text-xs text-[var(--ink-soft)] sm:block">Map view</span>
          </div>
          <div className="relative min-h-0 flex-1">
            <Map />
          </div>
        </section>
      </div>
    </main>
  )
}