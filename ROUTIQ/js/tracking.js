function buscar() {

  const code = document.getElementById("code").value.trim();
  const cont = document.getElementById("trackingInfo");

  const data = localStorage.getItem("routiq_tracking_" + code);

  if (!data) {
      cont.innerHTML = "<p style='color:red;'>Código no encontrado.</p>";
      return;
  }

  const info = JSON.parse(data);

  cont.innerHTML = `
      <div class="routeBox">
          <p><b>Estado:</b> ${info.estado}</p>
          <p><b>Origen:</b> ${info.origen}</p>
          <p><b>Destino:</b> ${info.destino}</p>
          <p><b>Distancia:</b> ${info.distancia}</p>
          <p><b>Duración estimada:</b> ${info.duracion}</p>
      </div>
  `;

  if (!info.ruta || info.ruta.length === 0) {
      cont.innerHTML += "<p>El repartidor no ha confirmado la ruta todavía.</p>";
      return;
  }

  iniciarMapaSeguimiento(info.ruta);
}

let trackingMap;
let trackingMarker;
let rutaIndex = 0;

function iniciarMapaSeguimiento(ruta) {

  trackingMap = new google.maps.Map(document.getElementById("mapTracking"), {
      center: ruta[0],
      zoom: 15
  });

  trackingMarker = new google.maps.Marker({
      position: ruta[0],
      map: trackingMap,
      icon: {
          url: "https://maps.google.com/mapfiles/kml/shapes/truck.png",
          scaledSize: new google.maps.Size(40, 40)
      }
  });

  rutaIndex = 0;

  setInterval(() => moverEnRuta(ruta), 800);
}

function moverEnRuta(ruta) {
  if (rutaIndex >= ruta.length) return;

  trackingMarker.setPosition(ruta[rutaIndex]);
  trackingMap.panTo(ruta[rutaIndex]);

  rutaIndex++;
}
