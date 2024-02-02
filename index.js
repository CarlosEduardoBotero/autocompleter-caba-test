import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Autocompleter } from "autocompleter-caba/dist/src/services/Autocompleter";

var map = L.map("map").setView([-34.6195, -58.3816], 12);

const CUSTOM_ICON_URL = "https://cdn-icons-png.flaticon.com/512/447/447031.png";
const GEOSERVER_MAP_BASE_PROD_WMS_URL =
  "https://geoserver.buenosaires.gob.ar/geoserver/mapa_base_prod/wms";
const GEOSERVER_SEGURIDAD_WMS_URL =
  "https://geoserver.buenosaires.gob.ar/geoserver/seguridad/wms";

const customIcon = new L.icon({
  iconUrl: CUSTOM_ICON_URL,
  iconSize: [30, 30],
});

document.addEventListener("DOMContentLoaded", function () {
  const direccionInput = document.getElementById("dirrecionInput");
  const buscarBtn = document.getElementById("buscarBtn");
  const errorDiv = document.getElementById("errorDiv");
  const autocompleter = new Autocompleter();

  buscarBtn.addEventListener("click", function () {
    const inputValue = direccionInput.value;

    autocompleter.suggesters.AddressSuggester.search(inputValue)
      .then((resultados) => {
        if (resultados.status_code !== 200) {
          console.log(resultados.status_code);
          return Promise.reject(resultados.error);
        }
        console.log("Resultados2: ", resultados);
        L.marker(
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
      })
      .catch((error) => {
        console.log(error);
        errorDiv.innerHTML = `Error: ${error}`;
      });
  });
});

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
