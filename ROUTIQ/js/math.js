window.addEventListener("load", () => {
    const data = JSON.parse(localStorage.getItem("routiq_last_route"));

    if (!data) {
        document.getElementById("exa_distancia").innerText = "No disponible";
        document.getElementById("exa_normal").innerText = "No disponible";
        document.getElementById("exa_trafico").innerText = "No disponible";
        document.getElementById("exa_estado").innerText = "No disponible";
        return;
    }

    document.getElementById("exa_distancia").innerText = data.distance;
    document.getElementById("exa_normal").innerText = data.normal;
    document.getElementById("exa_trafico").innerText = data.traffic;
    document.getElementById("exa_estado").innerText = data.state;
});
