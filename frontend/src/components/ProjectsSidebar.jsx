

const projects = [
  { name: 'Kaziranga Buffer Restoration', slug: 'kaziranga-buffer-restoration' },
  { name: 'Western Ghats Agroforestry', slug: 'western-ghats-agroforestry' },
]

export default function ProjectsSidebar() {
  function openCreateProject() {
    window.history.pushState({}, '', '/create-project')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  function openProject(slug) {
    window.history.pushState({}, '', `/project/${slug}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <aside className="flex flex-col border-b border-[var(--forest-900)] bg-[var(--forest-800)] px-5 pb-6 pt-7 lg:row-start-2 lg:border-b-0 lg:border-r lg:px-5">
      <div className="mb-[18px] flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-[var(--cream-100)]">Projects</h2>
        <button
          type="button"
          aria-label="Create project"
          onClick={openCreateProject}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[rgba(250,246,236,0.3)] bg-[var(--forest-700)] font-body text-[17px] leading-none text-[var(--leaf-400)] transition hover:bg-[var(--moss-500)] hover:text-[var(--forest-900)]"
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {projects.slice(0, 2).map((project, index) => (
          <button
            key={project.name}
            type="button"
            onClick={() => project.slug && openProject(project.slug)}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-[11px] text-left text-sm transition ${index === 0 ? 'border-[rgba(250,246,236,0.12)] bg-[var(--forest-700)] font-medium text-[var(--cream-100)]' : 'border-transparent text-[var(--cream-200)] hover:bg-[rgba(250,246,236,0.05)]'}`}
          >
            <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${index === 0 ? 'bg-[var(--leaf-400)]' : 'bg-[var(--moss-300)]'}`} />
            {project.name}
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <p className="mt-4 border-t border-[rgba(250,246,236,0.1)] pt-4 text-[12.5px] leading-[1.5] text-[var(--moss-300)]">
        Last synced 6 minutes ago from field sensors.
      </p>
    </aside>
  )
}