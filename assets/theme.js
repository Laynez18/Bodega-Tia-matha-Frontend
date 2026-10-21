document.querySelectorAll("[data-theme-option]").forEach(function (b) {
  b.addEventListener("click", function () {
    setTema(b.getAttribute("data-theme-option"));
    console.log(b.getAttribute("data-theme-option"));
  });
});

function setTema(nombre) {
  document.documentElement.setAttribute("data-theme", nombre);

  localStorage.setItem("mm-theme", nombre);

  document.querySelectorAll("[data-theme-option]").forEach(function (b) {
    let activo = b.getAttribute("data-theme-option") === nombre;
    b.classList.toggle("border-primary", activo);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  let tema = localStorage.getItem("mm-theme") || "claro";

  setTema(tema);
});
