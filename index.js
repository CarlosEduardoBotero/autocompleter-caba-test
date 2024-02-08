import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Autocompleter } from "autocompleter-caba/dist/src/services/Autocompleter";
import autoComplete from "@tarekraafat/autocomplete.js";

const CUSTOM_ICON_URL = "https://cdn-icons-png.flaticon.com/512/447/447031.png";
const GEOSERVER_MAP_BASE_PROD_WMS_URL =
  "https://geoserver.buenosaires.gob.ar/geoserver/mapa_base_prod/wms";
const GEOSERVER_SEGURIDAD_WMS_URL =
  "https://geoserver.buenosaires.gob.ar/geoserver/seguridad/wms";

const errorDiv = document.getElementById("errorDiv");

const customIcon = new L.icon({
  iconUrl: CUSTOM_ICON_URL,
  iconSize: [30, 30],
});

var map = L.map("map").setView([-34.6195, -58.3816], 12);
let marker = null;

const autocompleter = new Autocompleter();

const autoCompleteJS = new autoComplete({
  selector: "#autoComplete",
  placeHolder: "Buscar una dirección",
  debounce: 500,
  threshold: 3,
  submit: true,
  data: {
    src: async (query) => {
      try {
        // Fetch Data from external Source
        const res = await autocompleter.getSuggestions(query);
        return res[0].suggestions;
      } catch (error) {
        console.log({ error });
      }
    },
    keys: ["direccion"],
  },
  resultsList: {
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
        console.log(event);
        const direccion = event.detail.selection.value.direccion;
        autoCompleteJS.input.value = direccion;

        autocompleter.suggesters.AddressSuggester.search(direccion)
          .then((resultados) => {
            if (resultados.status_code !== 200) {
              console.log(resultados.status_code);
              return Promise.reject(resultados.error);
            }
            console.log("Resultados2: ", resultados);
            if (marker == null) {
              marker = L.marker(
                {
                  lat: resultados.data.coordenada_y,
                  lng: resultados.data.coordenada_x,
                },
                { icon: customIcon }
              ).addTo(map);
              map.flyTo(
                {
                  lat: resultados.data.coordenada_y,
                  lng: resultados.data.coordenada_x,
                },
                15
              );
            } else {
              marker.setLatLng({
                lat: resultados.data.coordenada_y,
                lng: resultados.data.coordenada_x,
              });
              map.flyTo(
                {
                  lat: resultados.data.coordenada_y,
                  lng: resultados.data.coordenada_x,
                },
                15
              );
            }
          })
          .catch((error) => {
            console.log(error);
            errorDiv.innerHTML = `Error: ${error}`;
          });
      },
    },
  },
});

// });

// Agregar la capa de GeoServer (WFS)
var geoServerLayer = L.tileLayer
  .wms(GEOSERVER_MAP_BASE_PROD_WMS_URL, {
    layers: "mapa_base",
    format: "image/png",
    transparent: true,
    attribution: "Generado por el Gobierno de la Ciudad de Buenos Aires",
  })
  .addTo(map);

// Agregar la nueva capa desde GeoServer (WFS) y ocultarla inicialmente
var newLayer = L.tileLayer
  .wms(GEOSERVER_SEGURIDAD_WMS_URL, {
    layers: "policia",
    format: "image/png",
    transparent: true,
    attribution: "Generado por el Gobierno de la Ciudad de Buenos Aires",
    visible: false,
  })
  .addTo(map);

// Asociar un evento 'mousemove' al mapa para actualizar las coordenadas
map.on("mousemove", function (e) {
  var latLng = e.latlng;
  document.getElementById("coordinates").innerText =
    "Coordenadas: " + latLng.lat + ", " + latLng.lng;
});

// Asociar un evento de clic al botón para cambiar la visibilidad de la nueva capa
document
  .getElementById("toggleLayerButton")
  .addEventListener("click", function () {
    newLayer.setParams({
      layers: newLayer.options.layers,
      transparent: !newLayer.options.transparent,
    });
    newLayer.options.transparent = !newLayer.options.transparent;

    if (newLayer.options.transparent) {
      // Capa visible
      map.addLayer(newLayer);
    } else {
      // Capa oculta
      map.removeLayer(newLayer);
    }
  });
