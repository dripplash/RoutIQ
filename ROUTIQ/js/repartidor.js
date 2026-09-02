//------------------------------------------------------
// BOTÓN VER RUTAS
//------------------------------------------------------
document.getElementById("btnVerRutas").addEventListener("click", () => {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;

  if (!origin || !destination) {
      alert("Ingrese origen y destino.");
      return;
  }

  localStorage.setItem("routiq_origen", origin);
  localStorage.setItem("routiq_destino", destination);

  location.href = "rutas.html";
});

//------------------------------------------------------
// GENERAR CÓDIGO DE SEGUIMIENTO
//------------------------------------------------------
document.getElementById("btnGenerarCodigo").addEventListener("click", () => {

  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;

  if (!origin || !destination) {
      alert("Debe ingresar origen y destino antes de generar un código.");
      return;
  }

  const code = Math.floor(100000 + Math.random() * 900000);

  document.getElementById("trackingCode").innerHTML =
      `<b>Código de seguimiento:</b> ${code}`;

  // Guardar el código para usarlo en rutas.js
  localStorage.setItem("routiq_last_tracking", code);

  // Guardar información base antes de calcular la ruta
  const info = {
      estado: "Ruta pendiente",
      origen: origin,
      destino: destination,
      ruta: [] // se llenará en rutas.js
  };

  localStorage.setItem("routiq_tracking_" + code, JSON.stringify(info));
});
