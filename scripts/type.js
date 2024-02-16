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
  const api = `https://${region}.api.blizzard.com/data/wow/pet/index?namespace=static-${region}&locale=en_US&access_token=${accessToken}`;
  const spinner = document.querySelector(".spinner-border");
  const btnLoadMore = document.querySelector("#load-more");
  //Declarem data fora del try-catch per poder-la utilitzar al finally
  let data;

  //Mostramos el spinner mientras esperamos la respuesta completa de la api
  try {
    spinner.style.display = "inline-block";
    const response = await fetch(api);
    data = await response.json();

    // Crear un nuevo array con las pets a buscar (subselección para comenzar a buscar a partir de la pet (index) donde nos quedamos).
    const petsToSearch = data.pets.slice(currentPetIndexToSearch);
    //Declaramos un counter para poder obtener las respuestas exitosas más adelante
    let counter = 1;

    // Iterar sobre las pets en el índice y cargar cada una
    for (const [i, pet] of petsToSearch.entries()) {
      //Necesario para saber el número exacto donde tendremos que hacer el slice
      currentPetIndexToSearch++;
      const petName = formatPetName(pet.name); //Obtener nombre de la mascota
      // Esperamos a que se haya decidido qué pet cargar (await):
      //Obtenemos la id Real
      const realId = await getRealId(petName, region, accessToken);
      // Cargamos la info de la API con loadTypePets correspondiente
      // La función loadTypePets devuelve un booleano, que aprovechamos para llevar un contador del número de pets que se están cargando
      const isRendered = await loadTypePets(pet.id, realId, petType);
      if (isRendered) {
        //Necesario ya que muchos numeros(id) no tienen pet asignada (por ejemplo: del 1 al 31 no hay coincidencias)
        counter++;
      }
      if (counter > 8) {
        break;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    //Dejar de mostrar el spinner cuando la tandada de pets se haya cargado
    spinner.style.display = "none";
    // Mostrar el botón para cargar más pets al terminar de cargar, y si no hay más pets para cargar, no mostrarlo.
    if (currentPetIndexToSearch >= data.pets.length) {
      btnLoadMore.style.display = "none";
    } else {
      btnLoadMore.style.display = "inline-block";
    }
  }
}

//Función para cargar en el DOM las pets que coincidan con el tipo deseado
async function loadTypePets(petId, realId, petType) {
  const api = `https://${region}.api.blizzard.com/data/wow/pet/${petId}?namespace=static-${region}&locale=en_US&access_token=${accessToken}`;
  const response = await fetch(api);
  const data = await response.json();

  // Miramos si la propiedad "battle_pet_type" existe para ese ID, ya que en algunos casos no hay y da error.
  if (data.battle_pet_type && data.battle_pet_type.name === petType) {
    //Buscamos el documento templates.html
    const response = await fetch("templates.html");

    //Si la respuesta es correcta, continuamos
    if (!response.ok) {
      console.log("Error fetching templates");
      return null;
    }

    //Creamos el template
    const templates = document.createElement("template");
    templates.innerHTML = await response.text();

    //Seleccionar donde se tendrá que colocar el clon del template
    const petList = document.getElementById("pet-list-filtered");

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
    clone.querySelector(".image").alt = `Image of pet ${data.name}`;
    clone.querySelector(".invo-icon").src = data.icon;
    clone.querySelector(".name").textContent = data.name;
    clone.querySelector(".page").href = "pet.html?id=" + petId;

    //Agreguem al DOM
    petList.appendChild(clone);
    //importante devolver un booleano para poder contabilizar las respuestas exitosas
    return true;
  }
  return false;
}
