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

  const queryString = window.location.search;

  // Obtener el id de l'URL
  const urlParams = new URLSearchParams(queryString);
  const petId = urlParams.get("id");

  // Esperar a que se renueve el accessToken
  const response = await createAccessToken(apiKey, apiSecret, region);
  accessToken = response.access_token;

  // Llamar a loadPet con el id de la mascota
  loadPet(petId);
}

//Función para mostrar la pet y sus datos en el DOM
async function loadPet(petId) {
  const api = `https://${region}.api.blizzard.com/data/wow/pet/${petId}?namespace=static-${region}&locale=en_US`;

  // Hacemos fetch a la API con el token en los headers
  const response = await fetch(api, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  //Conseguimos la id real que será necesaria más adelante
  const realId = await getRealId(formatPetName(data.name), region, accessToken);

  //Hacemos fetch de las templates y generamos una nueva respuesta (response2)
  const response2 = await fetch("templates.html");

  // Si la respuesta es correcta, continuamos
  if (!response2.ok) {
    console.log("Error fetching templates");
    return null;
  }

  // Creamos el template
  const templates = document.createElement("template");
  templates.innerHTML = await response2.text(); // Aquí usamos response2 en vez de la 1

  //Cambiamos el background según el pet type
  document.body.className = "bg-" + data.battle_pet_type.name.toLowerCase();

  //Seleccionar donde se tendrá que colocar el clon del template
  const petList = document.querySelector("#pet-filtered");

  //Seleccionamos el contenido del template (ojo al .content final) correspondiente y lo clonamos
  const petTemplate = templates.content.querySelector("#template-pet").content;
  const clone = petTemplate.cloneNode(true);

  //Dentro del template clonado, añadimos la información desde la API
  clone.querySelector("#card-image").src = await loadCreatureMedia(
    realId,
    region,
    accessToken
  );

  clone.querySelector("#card-image").alt = `Image of pet ${data.name}`;
  clone.querySelector("#pet-name").textContent = data.name;
  clone.querySelector("#invo-pet-icon").src = data.icon;
  clone.querySelector("#pet-type-text").textContent = data.battle_pet_type.name;
  document.querySelector("h1").textContent = `${data.name} Details`;
  clone.querySelector(
    "#pet-type-icon"
  ).src = `images/${data.battle_pet_type.name}-icon.png`;
  clone.querySelector("#description").textContent = data.description;
  clone.querySelector("#is_capturable").textContent = data.is_capturable
    ? "Yes"
    : "No";

  clone.querySelector("#is_tradable").textContent = data.is_tradable
    ? "Yes"
    : "No";
  clone.querySelector("#source").textContent = data.source.name;

  showAliHordeIcon(data, clone);

  //Añadimos la información al DOM
  petList.appendChild(clone);

  //Añadimos las habilidades después de cargar el primer template
  addAbilities(data);
}

//Función para conseguir el icono de cada habilidad
// Función para conseguir el icono de cada habilidad
async function getAbilityIcon(abilityId) {
  const api = `https://${region}.api.blizzard.com/data/wow/media/pet-ability/${abilityId}?namespace=static-${region}&locale=en_US`;

  // Hacemos fetch a la API con el token en los headers
  const response = await fetch(api, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  return data.assets[0].value;
}

//Función para mostrar en que bando se puede conseguir la pet
function showAliHordeIcon(data, clone) {
  if (data.is_alliance_only) {
    clone.querySelector("#is_alliance_only img").src = "images/ali-icon.png";
  } else if (data.is_horde_only) {
    clone.querySelector("#is_horde_only img").src = "images/horde-icon.png";
  } else {
    clone.querySelector("#is_alliance_only img").src = "images/ali-icon.png";
    clone.querySelector("#is_horde_only img").src = "images/horde-icon.png";
  }
}

//Función para añadir las habilidades de la mascota dentro del clon del template
async function addAbilities(data) {
  //Hacemos una nueva respuesta para esperar a templates.html
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
  const petAbilityList = document.querySelector(".ability-container");

  // Seleccionamos el template que queremos (su contenido con .content al final)
  const abilityTemplate =
    templates.content.querySelector("#ability-template").content;

  // Clonamos el template por cada habilidad de la pet y lo agregamos al contenedor
  for (const ability of data.abilities) {
    const clone = abilityTemplate.cloneNode(true);
    clone.querySelector(".ability-list .ability-icon").src =
      await getAbilityIcon(ability.ability.id);
    clone.querySelector(".ability-list .ability-name").textContent =
      ability.ability.name;
    clone.querySelector(".ability-list .slot").textContent = ability.slot;
    clone.querySelector(".ability-list .required_level").textContent =
      ability.required_level;
    petAbilityList.appendChild(clone);
  }
}
