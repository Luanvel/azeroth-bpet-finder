import { addHeaderAndFooter, addFilterButtons } from "./controller.js";

// Función asincrona para configurar la página después de cargar el encabezado y el pie de página
async function setupPage() {
  // Esperar a que se complete la carga del encabezado y el pie de página
  await addHeaderAndFooter();
  await addFilterButtons();

  // Obtener todos los botones de "type"
  const btnTypeElements = document.querySelectorAll(".btn-type");

  // Iterar sobre todos los botones de "type"
  for (const btnTypeElement of btnTypeElements) {
    // Agregamos evento al click donde se acceda al texto del botón, se guarde y se use como variable en loadPetWithIndex
    btnTypeElement.addEventListener("click", function () {
      const petType = this.textContent.trim();
      // Modificar la clase del body referida al background para cambiarlo según la pet
      document.body.className = "bg-" + petType.toLowerCase();
      // Construir la URL específica según el tipo
      const typeUrl = `type.html?type=${petType}`;
      // Redirigir a la página type.html con el tipo de mascota
      window.location.href = typeUrl;
      console.log("Button clicked:", this.textContent.trim());
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupPage();
});
