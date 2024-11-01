//const createAccessToken = require("./tokenGenerator");
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

//Índice para poder guardar la posición del array de la pet en la que nos quedamos
let currentPetIndexToSearch = 0;

// Esperar a que el DOM esté completamente cargado y luego llamar a la función setupPage
document.addEventListener("DOMContentLoaded", () => {
  setupPage();
});

// Función asincrona para configurar la página después de cargar el header y el footer
async function setupPage() {
  await addHeaderAndFooter();

  // Obtener el tipo de mascota (petType) de los parámetros de la URL
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const petType = urlParams.get("type");

  //Cambiar Título y Background
  document.querySelector("h1").textContent = `${petType} Battle Pets`;
  document.body.className = "bg-" + petType.toLowerCase();

  // Obtener el accessToken renovado
  const response = await createAccessToken(apiKey, apiSecret, region);
  accessToken = response.access_token;

  // Cargar el índice de mascotas
  await loadPetWithIndex(petType);

  // Obtener el botón "loadMore" y agregar un listener para cargar más mascotas
  const btnLoadMore = document.querySelector("#load-more");
  btnLoadMore.addEventListener("click", async () => {
    await loadPetWithIndex(petType);
  });

  // Recollim els favoritePets
  let favoritePets = localStorage.getItem("favoritePets");
  favoritePets = favoritePets ? JSON.parse(favoritePets) : [];

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
      const currentColor = heart.style.color;
      const petId = heart
        //busca el ancestro común más cercano de ese selector
        .closest(".figure")
        .querySelector("a")
        .href.split("id=")[1];

      if (currentColor === "rgb(97, 92, 92)") {
        heart.style.color = "#fe6262";
        favoritePets.push(petId);
      } else {
        heart.style.color = "rgb(97, 92, 92)";
        favoritePets = favoritePets.filter((id) => id !== petId);
      }

      localStorage.setItem("favoritePets", JSON.stringify(favoritePets));
    });
  });
}

//Función para cargar las pets por tipo gracias a la api que ofrece el índice
async function loadPetWithIndex(petType) {
  const api = `https://${region}.api.blizzard.com/data/wow/pet/index?namespace=static-${region}&locale=en_US`;
  const spinner = document.querySelector(".spinner-border");
  const btnLoadMore = document.querySelector("#load-more");
  
  // Declaramos `data` fuera del try-catch para poderla utilizar en el finally
  let data;

  // Mostramos el spinner mientras esperamos la respuesta de la API
  try {
    spinner.style.display = "inline-block";
    const response = await fetch(api, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    data = await response.json();

    // Crear un nuevo array con las pets a buscar
    const petsToSearch = data.pets.slice(currentPetIndexToSearch);
    let counter = 1;

    // Iterar sobre las pets en el índice y cargar cada una
    for (const [i, pet] of petsToSearch.entries()) {
      currentPetIndexToSearch++;
      const petName = formatPetName(pet.name);
      const realId = await getRealId(petName, region, accessToken);

      // Cargar la información de la API con loadTypePets
      const isRendered = await loadTypePets(pet.id, realId, petType);
      if (isRendered) {
        counter++;
      }
      if (counter > 8) {
        break;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    spinner.style.display = "none";
    if (currentPetIndexToSearch >= data.pets.length) {
      btnLoadMore.style.display = "none";
    } else {
      btnLoadMore.style.display = "inline-block";
    }
  }
}


// Función para cargar en el DOM las pets que coincidan con el tipo deseado
async function loadTypePets(petId, realId, petType) {
  const api = `https://${region}.api.blizzard.com/data/wow/pet/${petId}?namespace=static-${region}&locale=en_US`;
  
  // Hacemos fetch a la API con el token en los headers
  const response = await fetch(api, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();

  // Miramos si la propiedad "battle_pet_type" existe para ese ID
  if (data.battle_pet_type && data.battle_pet_type.name === petType) {
    // Buscamos el documento templates.html
    const response = await fetch("templates.html");

    // Si la respuesta es correcta, continuamos
    if (!response.ok) {
      console.log("Error fetching templates");
      return null;
    }

    // Creamos el template
    const templates = document.createElement("template");
    templates.innerHTML = await response.text();

    // Seleccionar donde se tendrá que colocar el clon del template
    const petList = document.getElementById("pet-list-filtered");

    // Seleccionamos el template correspondiente y lo clonamos
    const petTemplate = templates.content.querySelector("#template-type-pet").content;
    const clone = petTemplate.cloneNode(true);

    // Añadimos la información a los elementos clonados desde la API
    clone.querySelector(".image").src = await loadCreatureMedia(realId, region, accessToken);
    clone.querySelector(".image").alt = `Image of pet ${data.name}`;
    clone.querySelector(".invo-icon").src = data.icon;
    clone.querySelector(".name").textContent = data.name;
    clone.querySelector(".page").href = "pet.html?id=" + petId;

    // Agregamos al DOM
    petList.appendChild(clone);

    // Retornamos true para contar las respuestas exitosas
    return true;
  }
  return false;
}
