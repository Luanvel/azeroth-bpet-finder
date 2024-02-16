export async function addHeaderAndFooter() {
  const response = await fetch("templates.html");

  if (!response.ok) {
    console.log("Error fetching templates");
    return null;
  }

  const templates = document.createElement("template");
  templates.innerHTML = await response.text();

  const headerTemplate =
    templates.content.querySelector("#template-header").content;
  document.querySelector("#header").appendChild(headerTemplate);

  const footerTemplate =
    templates.content.querySelector("#template-footer").content;
  document.querySelector("#footer").appendChild(footerTemplate);
}

export async function addFilterButtons() {
  const response = await fetch("templates.html");

  if (!response.ok) {
    console.log("Error fetching templates");
    return null;
  }

  const templates = document.createElement("template");
  templates.innerHTML = await response.text();

  const TypeFilterTemplate = templates.content.querySelector(
    "#template-type-filter"
  ).content;
  document.querySelector("#type-filter").appendChild(TypeFilterTemplate);
}

//Función para obtener el nombre de la mascota en buen formato para la URL aún y los espacios
export function formatPetName(petName) {
  // Convertir a minúsculas y reemplazar espacios por guiones bajos
  return petName.toLowerCase().replace(" ", "-");
}

//Función para conseguir la Id de Criatura, no la id de BattlePet
export async function getRealId(petName, region, accessToken) {
  const api = `https://${region}.api.blizzard.com/data/wow/search/creature?namespace=static-${region}&name.en_US=${petName}&orderby=id&_page=1&access_token=${accessToken}`;
  const response = await fetch(api);
  const data = await response.json();

  return data.results[0].data.creature_displays[0].id; //Retornamos la id de creatures (id Real, no la específica de BattlePets)
}

//Función para recuperar la imagen de la pet
export async function loadCreatureMedia(realId, region, accessToken) {
  const api = `https://${region}.api.blizzard.com/data/wow/media/creature-display/${realId}?namespace=static-${region}&locale=en_US&access_token=${accessToken}`;

  const response = await fetch(api);
  const data = await response.json();

  return data.assets[0].value;
}
