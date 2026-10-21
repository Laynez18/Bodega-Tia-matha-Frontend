
const URL_DESARROLLO = "http://127.0.0.1:8080";
const URL_PRODUCCION = "https://bodega-tia-matha-backend.onrender.com";

function esEntornoDesarrollo() {
  const host = window.location.hostname;

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  );
}

export const API_BASE = esEntornoDesarrollo()
  ? URL_DESARROLLO
  : URL_PRODUCCION;

