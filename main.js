// --- Capa base ---
const baseLayer = new ol.layer.Tile({
  source: new ol.source.OSM()
});

// --- Fuente y capa vectorial inicial ---
let vectorSource = new ol.source.Vector({
  url: "CobSalud2022Dptos.geojson",
  format: new ol.format.GeoJSON()
});

let vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: feature => new ol.style.Style({
    fill: new ol.style.Fill({ color: "#6c63ff55" }),
    stroke: new ol.style.Stroke({ color: "#6c63ff", width: 1.5 })
  })
});

// --- Crear mapa ---
const map = new ol.Map({
  target: "map",
  layers: [baseLayer, vectorLayer],
  view: new ol.View({
    center: ol.proj.fromLonLat([-59.0, -27.3]),
    zoom: 7.3
  })
});

// --- Función para ajustar vista ---
function ajustarVista(source) {
  source.once("change", () => {
    if (source.getState() === "ready") {
      const extent = source.getExtent();
      map.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: 1000,
        maxZoom: 8
      });
    }
  });
}

ajustarVista(vectorSource);

// --- Popup ---
const container = document.getElementById("popup");
const overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: { duration: 250 }
});
map.addOverlay(overlay);

// --- Mostrar popup al hacer clic en una feature ---
map.on("singleclick", evt => {
  overlay.setPosition(undefined);
  const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);

  if (feature) {
    const props = feature.getProperties();
    let info = "";

    // Detectar la capa activa
    const capaActiva = document.querySelector(".filter-btn.active").dataset.layer;

    // --- Población por edades ---
    if (capaActiva.includes("poblacion")) {
      const nombre = props.departamento || "Desconocido";
      info = `<h3>${nombre}</h3>`;
      info += `<p><b>Hasta 14 años:</b> ${props["Hasta 14 años"] ?? "-"} personas</p>`;
      info += `<p><b>15 a 64 años:</b> ${props["15 a 64 años"] ?? "-"} personas</p>`;
      info += `<p><b>65 y más años:</b> ${props["65 y más años"] ?? "-"} personas</p>`;
    }

    // --- Cobertura de salud ---
    else if (capaActiva.includes("CobSalud")) {
      const nombre = props.departamento || "Desconocido";
      info = `<h3>${nombre}</h3>`;
      info += `<p><b>Con Obra Social:</b> ${props["Con Obra Social"] ?? "-"} personas</p>`;
      info += `<p><b>Cobertura del Estado:</b> ${props["Cobertura del Estado"] ?? "-"} personas</p>`;
      info += `<p><b>Sin Beneficios:</b> ${props["Sin Beneficios"] ?? "-"} personas</p>`;
    } 
    // --- Empleabilidad ---
        else if (capaActiva.includes("empleabilidad")) {
            const nombre = props.departamento || "Desconocido";
            info = `<h3>Departamento: ${nombre}</h3>`;
            info += `<p><b>Trabajando:</b> ${props["Trabajando"] ?? "-"} personas</p>`;
            info += `<p><b>Desocupado:</b> ${props["Desocupado"] ?? "-"} personas</p>`;
            info += `<p><b>Inactivo:</b> ${props["Inactivo"] ?? "-"} personas</p>`;
        }

   // --- Nivel de instrucción ---
else if (capaActiva.includes("max_nivel_instruccion")) {
  const nombre = props.nombre_departamento || "Desconocido";
  info = `<h3>Departamento: ${nombre}</h3>`;
  info += `<p><b>Primario incompleto:</b> ${props.primario_incompleto_pct ?? "-"}</p>`;
  info += `<p><b>Primario completo:</b> ${props.primario_completo_pct ?? "-"}</p>`;
  info += `<p><b>Secundario completo:</b> ${props.secundario_completo_pct ?? "-"}</p>`;
  info += `<p><b>Terciario completo:</b> ${props.terciario_completo_pct ?? "-"}</p>`;
  info += `<p><b>Universitario completo:</b> ${props.universitario_completo_pct ?? "-"}</p>`;
  info += `<p><b>Postgrado completo:</b> ${props.postgrado_completo_pct ?? "-"}</p>`;
  info += `<p><b>No contesta:</b> ${props.no_contesta_pct ?? "-"}</p>`;
}


    container.innerHTML = info;
    overlay.setPosition(evt.coordinate);
  } else {
    overlay.setPosition(undefined);
  }
});


// --- Filtros para cambiar capa ---
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const file = btn.getAttribute("data-layer");
    vectorSource = new ol.source.Vector({
      url: file,
      format: new ol.format.GeoJSON()
    });
    vectorLayer.setSource(vectorSource);
    ajustarVista(vectorSource);

    // 🔹 Cierra popup al cambiar de capa
    overlay.setPosition(undefined);
  });
});

// --- Cerrar popup si se hace clic en cualquier parte fuera del mapa ---
document.addEventListener("click", evt => {
  const esEnPopup = container.contains(evt.target);
  const esEnMapa = evt.target.closest("#map");
  if (!esEnPopup && !esEnMapa) {
    overlay.setPosition(undefined);
  }
});
