import { API_BASE } from "../assets/config.js";

let CSRF_HEADER = "X-CSRF-TOKEN";

let csrfToken = null;

export function getApiBase() {
  return API_BASE;
}

export function getCsrfHeader() {
  return CSRF_HEADER;
}

export function tieneCsrf() {
  return csrfToken !== null;
}

export function setCsrf(token, header) {
  csrfToken = token || null;
  if (header) {
    CSRF_HEADER = header;
  }
}

export function limpiarSesion() {
  setCsrf(null);
}

async function parse(res) {
  const texto = await res.text();
  if (!texto) {
    return null;
  }
  try {
    return JSON.parse(texto);
  } catch (e) {
    return { mensaje: texto };
  }
}

function esFalloCsrf(metodo, res, datos) {
  return (
    metodo !== "GET" &&
    res.status === 403 &&
    String((datos && datos.mensaje) || "")
      .toUpperCase()
      .indexOf("CSRF") !== -1
  );
}

function errorDeRed() {
  const err = new Error("No se pudo conectar con el servidor.");
  err.status = 0;
  err.codigo = 0;
  err.mensaje = err.message;
  return err;
}

function errorDeRespuesta(res, datos) {
  const err = new Error(
    (datos && datos.mensaje) || "Error inesperado (" + res.status + ").",
  );
  err.status = res.status;
  err.codigo = datos && datos.codigo;
  err.mensaje = datos && datos.mensaje;
  return err;
}

async function ejecutar(metodo, ruta, cuerpo, opciones) {
  const headers = { Accept: "application/json" };
  if (cuerpo !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (csrfToken && metodo !== "GET") {
    headers[CSRF_HEADER] = csrfToken;
  }

  let res;
  try {
    res = await fetch(API_BASE + ruta, {
      method: metodo,
      headers: headers,
      credentials: "include",
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      ...opciones,
    });
  } catch (e) {
    throw errorDeRed();
  }

  const datos = await parse(res);
  if (!res.ok) {
    const err = errorDeRespuesta(res, datos);
    err.esCsrf = esFalloCsrf(metodo, res, datos);
    throw err;
  }
  return datos;
}

async function renovarCsrf() {
  const res = await fetch(API_BASE + "/api/auth/me", {
    credentials: "include",
  });
  if (!res.ok) {
    return false;
  }
  const datos = await parse(res);
  if (!datos || !datos.csrfToken) {
    return false;
  }
  setCsrf(datos.csrfToken, datos.csrfHeader);
  return true;
}

export async function api(metodo, ruta, cuerpo, opciones) {
  try {
    return await ejecutar(metodo, ruta, cuerpo, opciones);
  } catch (err) {
    if (!err.esCsrf) {
      throw err;
    }
    const renovado = await renovarCsrf();
    if (!renovado) {
      const errSesion = errorDeRespuesta({ status: 401 }, null);
      errSesion.mensaje = "No hay sesion activa.";
      errSesion.message = errSesion.mensaje;
      errSesion.status = 401;
      throw errSesion;
    }
    return await ejecutar(metodo, ruta, cuerpo, opciones);
  }
}

export async function login(logeo, clave) {
  const data = await api("POST", "/api/auth/login", {
    logeo: logeo,
    clave: clave,
  });
  setCsrf(data.csrfToken, data.csrfHeader);
  return data;
}

export async function yo() {
  const data = await api("GET", "/api/auth/me");
  setCsrf(data.csrfToken, data.csrfHeader);
  return data;
}

export async function logout() {
  try {
    await api("POST", "/api/auth/logout");
  } finally {
    limpiarSesion();
  }
}

export function puede(permiso, permisos) {
  if (!permisos || !permisos.length) {
    return false;
  }
  return permisos.indexOf(permiso) !== -1 || permisos.indexOf("*") !== -1;
}
