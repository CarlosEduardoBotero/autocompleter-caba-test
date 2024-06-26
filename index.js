import "mapa-gcba/dist/assets/css/main.css";
import MapaInteractivo from "mapa-gcba/dist/models/MapaInteractivo";
import { Autocompleter } from "autocompleter-caba/dist/src/services/Autocompleter";
import autoComplete from "@tarekraafat/autocomplete.js";

const map = new MapaInteractivo("mapa");
const switchPlaces = document.querySelector("#switchPlaces");

async function handleClick(e) {
  const { lat, lng } = e.latlng;
  if (!switchPlaces.checked) map.map.flyTo({ lat, lng }, 16);
  map.reverseGeocoding(e);
}

function handleChangeSwitchPlaces(e) {
  if (e.target.checked) {
    map.setReverseOptions({ active: true, type: "places", radius: 1000 });
  } else {
    map.setReverseOptions({ active: true, type: "address", radius: 0 });
  }
}

map.map.addEventListener("click", (e) => handleClick(e));
switchPlaces.addEventListener("change", handleChangeSwitchPlaces);

const autocompleter = new Autocompleter();

const autoCompleteJS = new autoComplete({
  selector: "#autoComplete",
  placeHolder: "Buscar una dirección",
  debounce: 500,
  threshold: 3,
  submit: true,
  searchEngine: (_, record) => record,
  data: {
    src: async (query) => {
      try {
        // Fetch Data from external Source
        const res = await autocompleter.getSuggestions(query);
        return res.filter((data) => !data.error);
      } catch (error) {
        console.log({ error });
      }
    },
    keys: ["value"],
  },
  resultsList: {
    maxResults: undefined,
    element: (list, data) => {
      console.log({ list, data });
      if (!data.results.length) {
        // Create "No Results" message element
        const message = document.createElement("div");
        // Add class to the created element
        message.setAttribute("class", "no_result");
        // Add message text content
        message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
        // Append message element to the results list
        list.prepend(message);
      }
    },
    noResults: true,
  },
  resultItem: {
    highlight: true,
  },
  events: {
    input: {
      selection: (event) => {
        const direccion = event.detail.selection.value.value;
        autoCompleteJS.input.value = direccion;
        autocompleter
          .getSearch(direccion)
          .then((resultados) => {
            if (resultados.status_code !== 200) {
              console.log(resultados.status_code);
              return Promise.reject(resultados.error);
            }

            if (
              resultados.data?.coordenadas?.x &&
              resultados.data?.coordenadas?.y
            ) {
              map.setMarkerView(
                resultados.data.coordenadas.y,
                resultados.data.coordenadas.x
              );
              return;
            }
            map.setMarkerView(
              resultados.data.coordenada_y,
              resultados.data.coordenada_x
            );
          })
          .catch((error) => {
            console.log(error);
          });
      },
    },
  },
});
