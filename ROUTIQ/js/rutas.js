//------------------------------------------------------
// CONTROL DE VOZ
//------------------------------------------------------
let muted = false;

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("muteBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      muted = !muted;
      if (muted) {
        btn.textContent = "🔇 Voz desactivada";
        window.speechSynthesis.cancel();
      } else {
        btn.textContent = "🔊 Voz activada";
      }
    });
  }
});

// Función para hablar
function hablar(texto) {
  if (!muted) {
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = "es-CL";
    window.speechSynthesis.speak(msg);
  }
}

//------------------------------------------------------
// VARIABLES GLOBALES
//------------------------------------------------------
let map;
let directionsService;
let renderer;
let directionsResult = null;
let activePolyline = [];
let markerNavegacion = null;

//------------------------------------------------------
// INICIO
//------------------------------------------------------
window.addEventListener("load", () => {
  initMap();
  calcularRutas();
});

//------------------------------------------------------
// INICIAR MAPA
//------------------------------------------------------
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.45, lng: -70.67 },
    zoom: 13
  });

  directionsService = new google.maps.DirectionsService();
  renderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: false
  });
}

//------------------------------------------------------
// CALCULAR RUTAS
//------------------------------------------------------
function calcularRutas() {
  const origin = localStorage.getItem("routiq_origen");
  const destination = localStorage.getItem("routiq_destino");

  directionsService.route(
    {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    },
    (result, status) => {
      if (status === "OK") {
        directionsResult = result;
        mostrarPanelRutas(result.routes);
        mostrarRuta(0);
      }
    }
  );
}

//------------------------------------------------------
// MOSTRAR LISTA DE RUTAS (INCLUYE MATEMÁTICAS)
//------------------------------------------------------
function mostrarPanelRutas(rutas) {
  const panel = document.getElementById("routesPanel");
  panel.innerHTML = "";

  rutas.forEach((r, i) => {
    const leg = r.legs[0];

    const distanciaKM = leg.distance.value / 1000;
    const velocidad = 40;
    const tiempoHoras = distanciaKM / velocidad;
    const tiempoMin = Math.round(tiempoHoras * 60);

    panel.innerHTML += `
      <div class="routeBox">
        <h3>Ruta ${i + 1}</h3>
        <p><b>Distancia:</b> ${leg.distance.text}</p>
        <p><b>Duración tráfico:</b> ${leg.duration_in_traffic.text}</p>

        <h4>Cálculo matemático:</h4>
        <p>
          d = ${distanciaKM.toFixed(2)} km<br>
          t = d / v = ${distanciaKM.toFixed(2)} / ${velocidad} =
          ${tiempoHoras.toFixed(2)} h ≈ ${tiempoMin} min
        </p>

        <button onclick="mostrarPopup(${distanciaKM}, ${velocidad}, ${tiempoMin})">
          Ver cálculo detallado
        </button>

        <button onclick="mostrarRuta(${i})">Seleccionar ruta</button>
        <button onclick="iniciarNavegacion(${i})">Ir al destino</button>
        <button onclick="guardarRutaFinal(${i})">Confirmar y usar en seguimiento</button>
      </div>
    `;
  });
}

//------------------------------------------------------
// POPUP MATEMÁTICO
//------------------------------------------------------
function mostrarPopup(d, v, min) {
  const box = document.createElement("div");
  box.id = "mathPopup";

  box.innerHTML = `
    <div class="popup-container">
      <div class="popup-box">
        <h2>Cálculo detallado</h2>
        <p><b>Distancia:</b> ${d} km</p>
        <p><b>Velocidad:</b> ${v} km/h</p>
        <p><b>Fórmula:</b> t = d / v</p>
        <p><b>Resultado:</b> ${(d / v).toFixed(2)} h</p>
        <p><b>Aproximado:</b> ${min} min</p>
        <button onclick="cerrarPopup()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
}

function cerrarPopup() {
  const box = document.getElementById("mathPopup");
  if (box) box.remove();
}

//------------------------------------------------------
// MOSTRAR RUTA EN MAPA
//------------------------------------------------------
function mostrarRuta(index) {
  activePolyline.forEach(p => p.setMap(null));
  activePolyline = [];

  renderer.setDirections(directionsResult);
  renderer.setRouteIndex(index);

  const route = directionsResult.routes[index];
  const bounds = new google.maps.LatLngBounds();

  route.overview_path.forEach(p => bounds.extend(p));
  map.fitBounds(bounds);
}

//------------------------------------------------------
// GUARDAR RUTA REAL PARA SEGUIMIENTO
//------------------------------------------------------
function guardarRutaFinal(index) {
  const code = localStorage.getItem("routiq_last_tracking");

  if (!code) {
    alert("Debe generar un código primero.");
    return;
  }

  const route = directionsResult.routes[index];
  const leg = route.legs[0];

  const rutaReal = route.overview_path.map(p => ({
    lat: p.lat(),
    lng: p.lng()
  }));

  const info = {
    estado: "En camino",
    origen: localStorage.getItem("routiq_origen"),
    destino: localStorage.getItem("routiq_destino"),
    distancia: leg.distance.text,
    duracion: leg.duration_in_traffic.text,
    ruta: rutaReal
  };

  localStorage.setItem("routiq_tracking_" + code, JSON.stringify(info));

  alert("Ruta guardada.");
}

//------------------------------------------------------
// NAVEGACIÓN REAL (MODO WAZE + VOZ)
//------------------------------------------------------
function iniciarNavegacion(index) {

  const pasos = directionsResult.routes[index].overview_path;

  map.setOptions({
    zoom: 18,
    tilt: 45,
    heading: 0
  });

  hablar("Iniciando navegación hacia el destino.");

  if (markerNavegacion) markerNavegacion.setMap(null);

  markerNavegacion = new google.maps.Marker({
    position: pasos[0],
    map,
    icon: {
      url: "https://maps.google.com/mapfiles/kml/shapes/truck.png",
      scaledSize: new google.maps.Size(45, 45)
    }
  });

  let i = 0;
  const velocidad = 35 * 1000 / 3600;
  const intervalo = 70;

  mostrarPanelNavegacion();

  function mover() {
    if (i >= pasos.length - 1) {
      hablar("Has llegado a tu destino.");
      return;
    }

    const inicio = pasos[i];
    const fin = pasos[i + 1];
    const dist = google.maps.geometry.spherical.computeDistanceBetween(inicio, fin);

    let progreso = 0;

    function avanzar() {
      if (progreso >= dist) {
        i++;
        mover();
        return;
      }

      const t = progreso / dist;
      const pos = new google.maps.LatLng(
        inicio.lat() + (fin.lat() - inicio.lat()) * t,
        inicio.lng() + (fin.lng() - inicio.lng()) * t
      );

      markerNavegacion.setPosition(pos);
      map.panTo(pos);

      progreso += velocidad * (intervalo / 1000);
      setTimeout(avanzar, intervalo);
    }

    avanzar();
  }

  mover();
}

//------------------------------------------------------
// PANEL SUPERIOR — FINALIZAR VIAJE
//------------------------------------------------------
function mostrarPanelNavegacion() {

  const box = document.createElement("div");
  box.id = "panelNavegacion";
  box.className = "panel-waze show";

  box.innerHTML = `
    Navegando...
    <br>
    <button onclick="finalizarViaje()" class="backBtn" style="margin-top:8px;">
      Finalizar viaje
    </button>
  `;

  document.body.appendChild(box);
}

function finalizarViaje() {
  const box = document.getElementById("panelNavegacion");
  if (box) box.remove();

  hablar("Viaje finalizado.");
  location.href = "repartidor.html";
}
