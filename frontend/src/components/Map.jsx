import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

export default function Map({ showExpand = true, drawMode = false, drawColor = "#6B9169", onPolygonCreated, projects = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const polygonHandler = useRef(onPolygonCreated);
  const projectsRef = useRef(projects);
  const drawColorRef = useRef(drawColor);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    polygonHandler.current = onPolygonCreated;
  }, [onPolygonCreated]);

  useEffect(() => {
    projectsRef.current = projects;
    renderProjectLayers();
  }, [projects]);

  useEffect(() => {
    drawColorRef.current = drawColor;
    if (map.current?.isStyleLoaded()) {
      if (map.current.getLayer("project-polygon-fill")) {
        map.current.setPaintProperty("project-polygon-fill", "fill-color", drawColor);
        map.current.setPaintProperty("project-polygon-fill-static", "fill-color", drawColor);
        map.current.setPaintProperty("project-polygon-line", "line-color", drawColor);
      }
    }
  }, [drawColor]);

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

    newMap.on("load", renderProjectLayers);

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
            <span className="rounded-[6px] bg-[var(--cream-100)] px-2 py-1 text-[11px] font-medium text-[var(--ink-soft)]">3 active</span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {projects.map((project, index) => (
              <button
                key={project.name}
                type="button"
                className={`flex items-start gap-3 rounded-[9px] border px-3 py-3 text-left transition ${index === 0 ? "border-[rgba(43,80,57,0.18)] bg-[var(--cream-100)]" : "border-transparent hover:border-[var(--line-soft)] hover:bg-[var(--cream-100)]"}`}
              >
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[var(--forest-900)]">{project.name}</span>
                  <span className="mt-1 block text-[11px] text-[var(--ink-soft)]">{project.sites?.length || 0} sites</span>
                </span>
              </button>
            ))}
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