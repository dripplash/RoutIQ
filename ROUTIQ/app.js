// ---------------------------
// LOGIN
// ---------------------------
const loginBtn = document.getElementById("loginBtn");
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginError = document.getElementById("login-error");

loginBtn.addEventListener("click", () => {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "admin21") {
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
  } else {
    loginError.classList.remove("hidden");
    setTimeout(() => loginError.classList.add("hidden"), 2000);
  }
});

// --------------------------------
// VARIABLES GLOBALES GOOGLE MAPS
// --------------------------------
let map, directionsService, directionsRenderer, trafficLayer;
let rutasAlternativas = [];
let marker;

// ---------------------------
// INIT MAP
// ---------------------------
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.45, lng: -70.67 },
    zoom: 13
  });

  trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true
  });

  console.log("MAPA LISTO");
}

window.initMap = initMap;

// ---------------------------
// CALCULAR RUTA + ALTERNATIVAS
// ---------------------------
document.getElementById("routeBtn").addEventListener("click", () => {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;

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
        rutasAlternativas = result.routes;

        mostrarRutasAlternativas(result.routes);
        mostrarRuta(0); // Mostrar recomendada
      } else {
        alert("Error: " + status);
      }
    }
  );
});

// ---------------------------
// PANEL RUTAS ALTERNATIVAS
// ---------------------------
function mostrarRutasAlternativas(rutas) {
  const panel = document.getElementById("rutasPanel");
  panel.innerHTML = "";

  rutas.forEach((ruta, i) => {
    const leg = ruta.legs[0];

    panel.innerHTML += `
      <div class="rutaBox">
        <h3>Ruta ${i + 1} ${i === 0 ? "(Rápida)" : ""}</h3>
        <p><b>Distancia:</b> ${leg.distance.text}</p>
        <p><b>Duración:</b> ${leg.duration.text}</p>
        <p><b>Tráfico:</b> ${leg.duration_in_traffic ? leg.duration_in_traffic.text : "Normal"}</p>
        <button onclick="mostrarRuta(${i})">Ver en el mapa</button>
      </div>
    `;
  });
}

function mostrarRuta(i) {
  directionsRenderer.setDirections({
    routes: [rutasAlternativas[i]]
  });

  const leg = rutasAlternativas[i].legs[0];
  document.getElementById("distance").innerText = leg.distance.text;
  document.getElementById("duration").innerText = leg.duration.text;
  document.getElementById("trafico").innerText =
    leg.duration_in_traffic ? leg.duration_in_traffic.text : "Normal";
}

// ---------------------------
// SIMULACIÓN
// ---------------------------
document.getElementById("simulateBtn").addEventListener("click", () => {
  if (!rutasAlternativas.length) return alert("Primero calcula la ruta");

  const path = rutasAlternativas[0].overview_path;
  let index = 0;

  if (marker) marker.setMap(null);

  marker = new google.maps.Marker({
    position: path[0],
    map,
    icon: {
      url: "https://maps.google.com/mapfiles/kml/shapes/truck.png",
      scaledSize: new google.maps.Size(40, 40)
    }
  });

  function move() {
    index++;
    if (index >= path.length) return;

    marker.setPosition(path[index]);
    map.panTo(path[index]);
    requestAnimationFrame(move);
  }

  move();
});

// ---------------------------
// GENERAR CÓDIGO DE SEGUIMIENTO
// ---------------------------
document.getElementById("trackingCodeBtn").addEventListener("click", () => {
  if (!rutasAlternativas.length) return alert("Calcula una ruta primero");

  const codigo = Math.floor(Math.random() * 900000 + 100000);

  document.getElementById("trackingCode").innerText =
    "Código de seguimiento: " + codigo;

  localStorage.setItem("routiq_tracking", JSON.stringify({
    codigo,
    ruta: rutasAlternativas[0]
  }));
});

// ---------------------------
// PANEL CLIENTE
// ---------------------------
document.getElementById("verTrackingBtn").addEventListener("click", () => {
  const inputCodigo = document.getElementById("codigoCliente").value;
  const data = JSON.parse(localStorage.getItem("routiq_tracking"));

  if (!data || data.codigo != inputCodigo) {
    return alert("Código no válido");
  }

  document.getElementById("clientePanel").classList.remove("hidden");

  iniciarMapaCliente(data.ruta);
});

function iniciarMapaCliente(ruta) {
  const route = ruta.legs[0];

  const mapC = new google.maps.Map(document.getElementById("mapTracking"), {
    center: route.start_location,
    zoom: 14
  });

  const trafficC = new google.maps.TrafficLayer();
  trafficC.setMap(mapC);

  const markerC = new google.maps.Marker({
    position: route.start_location,
    map: mapC,
    icon: "https://maps.google.com/mapfiles/kml/shapes/truck.png"
  });

  const pasos = ruta.overview_path;
  let i = 0;

  function avanzar() {
    i++;
    if (i >= pasos.length) return;

    markerC.setPosition(pasos[i]);
    mapC.panTo(pasos[i]);

    document.getElementById("clienteETA").innerText = route.duration.text;

    setTimeout(avanzar, 1000);
  }

  avanzar();
}
