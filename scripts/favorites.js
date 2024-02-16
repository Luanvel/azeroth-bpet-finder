import {
  apiKey,
  apiSecret,
  region,
  createAccessToken,
} from "./tokenGenerator.js";

import {
  addHeaderAndFooter,
  formatPetName,
  getRealId,
  loadCreatureMedia,
} from "./controller.js";

let accessToken = "";

// Esperar a que el DOM esté completamente cargado y luego llamar a la función setupPage
document.addEventListener("DOMContentLoaded", () => {
  setupPage();
});

// Función asincrona para configurar la página después de cargar el encabezado y el pie de página
async function setupPage() {
  // Esperar a que se complete la carga del encabezado y el pie de página
  await addHeaderAndFooter();

  // Esperar a que se renueve el accessToken
  const response = await createAccessToken(apiKey, apiSecret, region);
  accessToken = response.access_token;

  //Recuperamos el array de favoritePets
  let favoritePets = localStorage.getItem("favoritePets");
  favoritePets = JSON.parse(favoritePets);

  if (favoritePets.length == 0 || !favoritePets) {
    document.querySelector("#favorite_warning").style.display = "inline-block";
  } else {
    // Iterar sobre cada petId y cargar la mascota favorita
    for (const petId of favoritePets) {
      await loadFavoritePet(petId);
    }
  }

  // Event Listener para controlar el click a los corazones y agregar a favoritos
  let hearts = document.querySelectorAll(".fa-heart");

  //Para cambiar los favoritos a color
  hearts.forEach((heart) => {
    const petId = heart
      //busca el ancestro común más cercano de ese selector
      .closest(".figure")
      .querySelector("a")
      .href.split("id=")[1];

    if (favoritePets.includes(petId)) {
      heart.style.color = "#fe6262";
    }
  });

  hearts.forEach((heart) => {
    heart.addEventListener("click", () => {
      const petId = heart
        //busca el ancestro común más cercano de ese selector
        .closest(".figure")
        .querySelector("a")
        .href.split("id=")[1];

      heart.style.color = "rgb(97, 92, 92)";
      favoritePets = favoritePets.filter((id) => id !== petId);

      localStorage.setItem("favoritePets", JSON.stringify(favoritePets));

      //Recargar la pagina automáticamente para aplicar los cambios en la página al hacer click
      window.location.reload();
    });
  });
}

//Función para mostrar la pet y sus datos en el DOM
async function loadFavoritePet(petId) {
  const api = `https://${region}.api.blizzard.com/data/wow/pet/${petId}?namespace=static-${region}&locale=en_US&access_token=${accessToken}`;

  //Hacemos fetch a la API
  const response = await fetch(api);
  const data = await response.json();

  //Conseguimos la id real que será necesaria más adelante
  const realId = await getRealId(formatPetName(data.name), region, accessToken);

  //Buscamos el documento templates.html
  const response2 = await fetch("templates.html");

  //Si la respuesta es correcta, continuamos
  if (!response2.ok) {
    console.log("Error fetching templates");
    return null;
  }

  //Creamos el template
  const templates = document.createElement("template");
  templates.innerHTML = await response2.text();

  //Seleccionar donde se tendrá que colocar el clon del template
  const petList = document.getElementById("favorite_pets");

  //Seleccionamos el template correspondiente y lo clonamos
  const petTemplate =
    templates.content.querySelector("#template-type-pet").content;
  const clone = petTemplate.cloneNode(true); //Ponemos true para que se importen también los hijos de template, no solo template.

  //Añadimos la información a los elementos clonados desde la API (accedemos a clone declarado anteriormente)
  clone.querySelector(".image").src = await loadCreatureMedia(
    realId,
    region,
    accessToken
  ); //Accedemos a source para darle la dirección de la imagen obtenida de loadCreatureMedia
  document.querySelector("h1").textContent = `Your locally saved Favorite Pets`;
  clone.querySelector(".image").alt = `Image of pet ${data.name}`;
  clone.querySelector(".invo-icon").src = data.icon;
  clone.querySelector(".name").textContent = data.name;
  clone.querySelector(".page").href = "pet.html?id=" + petId;

  //Agreguem al DOM
  petList.appendChild(clone);
}
