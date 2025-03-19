import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { Icon } from "leaflet";
import mapboxgl from "mapbox-gl";
import MapboxMatrix from "@mapbox/mapbox-sdk/services/matrix";
import { SearchBox } from "@mapbox/search-js-react";
import { useEffect, useRef, useState } from "react";

const accessToken =
  "pk.eyJ1IjoibGFtYmRhdGFsbGMiLCJhIjoiY20yODUyNXZ0MHJ1cDJqcHZsam9qNWh1NSJ9.XXfij76q9d89cmrsYKBAFg";
//process.env.REACT_APP_MAPBOX_API_TOKEN!;
mapboxgl.accessToken = accessToken;

type LatLon = {
  lat: number;
  lon: number;
};

type MapMarkerProps = {
  position: LatLon;
  description: string; // might should be react element instead
};

const markers: MapMarkerProps[] = [
  {
    description: "Central and carlisle",
    position: { lat: 35.079753, lon: -106.604488 },
  },
  {
    description: "Q Station",
    position: { lat: 35.080415, lon: -106.608691 },
  },
  {
    description: "Ruths Chris Steakhouse",
    position: { lat: 35.101404, lon: -106.570409 },
  },
];

const MapMarker = ({ description, position }: MapMarkerProps) => {
  return (
    <Marker
      position={[position.lat, position.lon]}
      icon={
        new Icon({
          iconUrl: markerIconPng,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }
    >
      <Popup>{description}</Popup>
    </Marker>
  );
};

function toMapBoxUrlCoordinates(coordinates: LatLon[]) {
  // note: mapbox is lon/lat, not lat/lon.
  return coordinates.map((c) => `${c.lon},${c.lat}`).join(";");
}

const matrixClient = MapboxMatrix({ accessToken: mapboxgl.accessToken });

const fetchMapBoxDirectionsMatrix = async () => {
  const matrixResponse = await matrixClient
    .getMatrix({
      profile: "driving-traffic",
      points: [
        { coordinates: [-77.0365, 38.8977] }, // Washington, DC
        { coordinates: [-74.0059, 40.7128] }, // New York City
        { coordinates: [-118.2437, 34.0522] }, // Los Angeles
      ],
    })
    .send();
  if (matrixResponse.statusCode !== 200) {
    throw new Error(
      `HTTP error from MapBox! status: ${matrixResponse.statusCode}`
    );
  }
  return matrixResponse.body;
};

const onClickCalculate = () => {
  fetchMapBoxDirectionsMatrix()
    // TODO set state and display matrix as a table
    // update map to show lines between things with travel times on them
    .then((data) => console.log("*********** directions matrix data", data))
    .catch((error) => console.error("Error:", error));
};

function App() {
  const mapContainerRef = useRef<any>();
  const mapInstanceRef = useRef<any>();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  useEffect(() => {
    mapboxgl.accessToken = accessToken;

    mapInstanceRef.current = new mapboxgl.Map({
      container: mapContainerRef.current, // container ID
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });

    mapInstanceRef.current.on("load", () => {
      setMapLoaded(true);
    });
  }, []);

  return (
    <>
      {/* @ts-ignore */}
      <SearchBox
        accessToken={accessToken}
        map={mapInstanceRef.current}
        mapboxgl={mapboxgl}
        value={inputValue}
        onChange={(d) => {
          setInputValue(d);
        }}
        marker
      />
      <div id="map-container" ref={mapContainerRef} style={{ height: 300 }} />
    </>
  );
}

export default App;
