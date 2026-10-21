const URL_DESARROLLO = "http://127.0.0.1:8080";
const URL_PRODUCCION = "https://bodeguita-backend.onrender.com";

function esEntornoDesarrollo() {
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.indexOf("192.168.") === 0 ||
    host.indexOf("10.") === 0
  );
}

export const API_BASE = esEntornoDesarrollo() ? URL_DESARROLLO : URL_PRODUCCION;
