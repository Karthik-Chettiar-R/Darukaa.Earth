import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

export default function Map({ showExpand = true, drawMode = false, drawColor = "#6B9169", onPolygonCreated, projects = [], focusGeometry = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const polygonHandler = useRef(onPolygonCreated);
  const projectsRef = useRef(projects);
  const drawColorRef = useRef(drawColor);
  const focusGeometryRef = useRef(focusGeometry);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const effectiveSelectedProjectId = projects.some((project) => String(project.id) === String(selectedProjectId))
    ? selectedProjectId
    : projects[0]?.id;
  const selectedProject = projects.find((project) => String(project.id) === String(effectiveSelectedProjectId));
  const selectedSite = selectedProject?.sites?.find((site) => String(site.id) === String(selectedSiteId));
  const activeFocusGeometry = selectedSite?.location || focusGeometry;

  useEffect(() => {
    polygonHandler.current = onPolygonCreated;
  }, [onPolygonCreated]);

  useEffect(() => {
    projectsRef.current = projects;
    renderProjectLayers();
  }, [projects]);

  useEffect(() => {
    focusGeometryRef.current = activeFocusGeometry;
    if (!map.current || !activeFocusGeometry || !mapContainer.current) return;

    const refit = () => {
      requestAnimationFrame(() => {
        map.current?.resize();
        fitToFocusGeometry();
      });
    };
    const observer = new ResizeObserver(refit);
    observer.observe(mapContainer.current);
    const frame = requestAnimationFrame(refit);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [activeFocusGeometry]);

  function selectProject(projectId) {
    setSelectedProjectId(projectId);
    setSelectedSiteId(null);
  }

  function selectSite(siteId) {
    setSelectedSiteId(siteId);
  }

  useEffect(() => {
    drawColorRef.current = drawColor;
    applyDrawColor();
  }, [drawColor]);

  function applyDrawColor() {
    if (!map.current?.isStyleLoaded()) return;

    const layers = map.current.getStyle().layers || [];
    layers.forEach((layer) => {
      const isProjectPolygon = layer.id.startsWith("project-polygon-");
      const isDrawPolygon = layer.id.includes("gl-draw-polygon");
      if (!isProjectPolygon && !isDrawPolygon) return;

      if (layer.type === "fill") {
        map.current.setPaintProperty(layer.id, "fill-color", drawColorRef.current);
      }
      if (layer.type === "line") {
        map.current.setPaintProperty(layer.id, "line-color", drawColorRef.current);
      }
    });
  }

  function renderProjectLayers() {
    if (!map.current?.isStyleLoaded()) return;

    const features = projectsRef.current.flatMap((project) => (
      (project.sites || []).map((site) => ({
        type: "Feature",
        geometry: site.location,
        properties: { color: project.color, projectId: project.id },
      }))
    ));
    const sourceData = { type: "FeatureCollection", features };
    const source = map.current.getSource("persisted-project-sites");

    if (source) {
      source.setData(sourceData);
      return;
    }

    map.current.addSource("persisted-project-sites", { type: "geojson", data: sourceData });
    map.current.addLayer({
      id: "persisted-project-sites-fill",
      type: "fill",
      source: "persisted-project-sites",
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.28 },
    });
    map.current.addLayer({
      id: "persisted-project-sites-line",
      type: "line",
      source: "persisted-project-sites",
      paint: { "line-color": ["get", "color"], "line-width": 2 },
    });
  }

  function fitToFocusGeometry() {
    if (!map.current?.isStyleLoaded() || !focusGeometryRef.current?.coordinates) return;

    const container = map.current.getContainer();
    if (!container.clientWidth || !container.clientHeight) return;

    const coordinates = [];
    collectCoordinatePairs(focusGeometryRef.current.coordinates, coordinates);
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach((coordinate) => bounds.extend(coordinate));

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 42, right: 42, bottom: 42, left: 42 },
        maxZoom: 14,
        duration: 0,
      });
    }
  }

  function collectCoordinatePairs(value, coordinates) {
    if (!Array.isArray(value)) return;

    if (
      value.length >= 2
      && Number.isFinite(value[0])
      && Number.isFinite(value[1])
    ) {
      coordinates.push([value[0], value[1]]);
      return;
    }

    value.forEach((item) => collectCoordinatePairs(item, coordinates));
  }

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!mapContainer.current) return;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [72.8777, 19.076],
      zoom: 9,
    });

    map.current = newMap;

    newMap.on("load", () => {
      newMap.resize();
      renderProjectLayers();
      requestAnimationFrame(() => {
        newMap.resize();
        requestAnimationFrame(() => fitToFocusGeometry());
      });
    });

    if (drawMode) {
      const drawControl = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        styles: [
          {
            id: "project-polygon-fill",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
            paint: { "fill-color": drawColorRef.current, "fill-opacity": 0.32 },
          },
          {
            id: "project-polygon-fill-static",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
            paint: { "fill-color": drawColorRef.current, "fill-opacity": 0.24 },
          },
          {
            id: "project-polygon-line",
            type: "line",
            filter: ["==", "$type", "Polygon"],
            paint: { "line-color": drawColorRef.current, "line-width": 2 },
          },
        ],
      });

      draw.current = drawControl;
      newMap.addControl(drawControl, "top-left");
      newMap.on("styledata", applyDrawColor);
      newMap.on("idle", applyDrawColor);
      newMap.on("draw.create", (event) => polygonHandler.current?.(event.features[0]));
    }

    return () => {
      newMap.remove();
      map.current = null;
      draw.current = null;
    };
  }, [drawMode]);

  useEffect(() => {
    map.current?.resize();
  }, [isExpanded]);

  return (
    <div className={isExpanded ? "fixed inset-4 z-50 overflow-hidden border border-[var(--line-soft)] bg-[var(--white)] shadow-[0_16px_48px_rgba(19,42,30,0.18)] sm:inset-8" : "absolute inset-0"}>
      <div ref={mapContainer} className="h-full w-full" />
      {isExpanded && (
        <aside className="absolute left-4 top-4 bottom-4 z-10 flex w-[min(272px,calc(100%-32px))] flex-col rounded-[14px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.96)] p-4 shadow-[0_8px_24px_rgba(19,42,30,0.12)] backdrop-blur-sm sm:left-6 sm:top-6 sm:bottom-6 sm:w-[280px]">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--line-soft)] pb-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--moss-500)]">Map workspace</p>
              <h2 className="mt-1 font-display text-[20px] font-medium text-[var(--forest-900)]">Projects</h2>
            </div>
            <span className="rounded-[6px] bg-[var(--cream-100)] px-2 py-1 text-[11px] font-medium text-[var(--ink-soft)]">{projects.length} active</span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="relative text-xs font-medium text-[var(--ink-soft)]">
              <span>Project</span>
              <button
                type="button"
                aria-expanded={isProjectMenuOpen}
                aria-haspopup="listbox"
                onClick={() => setIsProjectMenuOpen((open) => !open)}
                className="mt-2 flex h-10 w-full items-center justify-between rounded-[8px] border border-[var(--line-soft)] bg-[var(--cream-100)] px-3 text-left text-sm font-normal text-[var(--forest-900)] outline-none transition hover:border-[var(--forest-700)] focus:border-[var(--forest-700)] focus:ring-2 focus:ring-[var(--leaf-400)]"
              >
                <span className="truncate">{selectedProject?.name || 'Select a project'}</span>
                <span className="ml-3 text-[var(--forest-700)]" aria-hidden="true">{isProjectMenuOpen ? '⌃' : '⌄'}</span>
              </button>
              {isProjectMenuOpen && (
                <div role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[8px] border border-[var(--line-soft)] bg-[var(--white)] p-1 shadow-[0_8px_20px_rgba(19,42,30,0.14)]">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      role="option"
                      aria-selected={String(selectedProjectId) === String(project.id)}
                      onClick={() => {
                        selectProject(project.id)
                        setIsProjectMenuOpen(false)
                      }}
                      className={`block w-full rounded-[6px] px-3 py-2.5 text-left text-[13px] font-medium transition ${String(selectedProjectId) === String(project.id) ? 'bg-[var(--forest-700)] text-[var(--cream-100)]' : 'text-[var(--forest-900)] hover:bg-[var(--forest-700)] hover:text-[var(--cream-100)]'}`}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {selectedProject?.sites?.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => selectSite(site.id)}
                  className={`flex w-full items-center gap-3 rounded-[9px] border px-3 py-3 text-left transition ${String(selectedSiteId) === String(site.id) ? "border-[var(--moss-500)] bg-[var(--cream-100)]" : "border-transparent hover:border-[var(--line-soft)] hover:bg-[var(--cream-100)]"}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                  <span className="min-w-0 truncate text-[13px] font-medium text-[var(--forest-900)]">{site.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-[var(--line-soft)] pt-4">
            <p className="text-xs leading-5 text-[var(--ink-soft)]">Select a project to focus its monitored sites on the map.</p>
          </div>
        </aside>
      )}
      {showExpand && <button
        type="button"
        aria-label={isExpanded ? "Collapse map" : "Expand map"}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-[9px] border border-[var(--line-soft)] bg-[var(--white)] text-[var(--forest-800)] shadow-[0_2px_6px_rgba(19,42,30,0.08)] transition hover:bg-[var(--cream-100)]"
      >
        {isExpanded ? '×' : '↗'}
      </button>}
    </div>
  );
}