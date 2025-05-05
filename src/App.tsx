import mapboxgl from "mapbox-gl";
import MapboxMatrix from "@mapbox/mapbox-sdk/services/matrix";
import { SearchBox } from "@mapbox/search-js-react";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const accessToken =
  "pk.eyJ1IjoibGFtYmRhdGFsbGMiLCJhIjoiY20yODUyNXZ0MHJ1cDJqcHZsam9qNWh1NSJ9.XXfij76q9d89cmrsYKBAFg";
//process.env.REACT_APP_MAPBOX_API_TOKEN!;
mapboxgl.accessToken = accessToken;

type LatLon = {
  lat: number;
  lon: number;
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

type PointOfInterest = {
  //name: string;
  location: Location;
};

type PlaceToStay = {
  location: Location;
};

type Location = {
  coordinates: LatLon;
  address: string;
};

function App() {
  const mapContainerRef = useRef<any>();
  const mapInstanceRef = useRef<any>();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchedLocation, setSearchedLocation] = useState<Location | null>(
    null
  );

  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(
    []
  );
  const [placesToStay, setPlacesToStay] = useState<PlaceToStay[]>([]);

  function AddPointOfInterestControl() {
    return (
      <div>
        <button
          disabled={!searchedLocation}
          onClick={() => {
            if (searchedLocation) {
              setPointsOfInterest((prevPoints) => [
                ...prevPoints,
                {
                  location: searchedLocation,
                },
              ]);
            }
          }}
        >
          Add Point of Interest
        </button>
      </div>
    );
  }

  function AddPlaceToStayControl() {
    return (
      <div>
        <button
          disabled={!searchedLocation}
          onClick={() => {
            if (searchedLocation) {
              setPlacesToStay((prevPoints) => [
                ...prevPoints,
                {
                  location: searchedLocation,
                },
              ]);
            }
          }}
        >
          Add Place to Stay
        </button>
      </div>
    );
  }

  function PointsOfInterestDisplay() {
    return (
      <div>
        <h2>Points of Interest</h2>
        <ul>
          {pointsOfInterest.map((poi, index) => (
            <li key={index}>
              {`Address: ${poi.location.address}, (lat: ${poi.location.coordinates.lat}, lon: ${poi.location.coordinates.lon})`}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function PlacesToStayDisplay() {
    return (
      <div>
        <h2>Places to Stay</h2>
        <ul>
          {placesToStay.map((poi, index) => (
            <li key={index}>
              {`Address: ${poi.location.address}, (lat: ${poi.location.coordinates.lat}, lon: ${poi.location.coordinates.lon})`}
            </li>
          ))}
        </ul>
      </div>
    );
  }

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
    return () => {
      // Clean up the map instance on component unmount
      mapInstanceRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (searchedLocation && mapInstanceRef.current) {
      // Create a new marker
      const marker = new mapboxgl.Marker()
        .setLngLat([
          searchedLocation.coordinates.lon,
          searchedLocation.coordinates.lat,
        ])
        .addTo(mapInstanceRef.current);

      // Add a click event listener to the marker
      marker.getElement().addEventListener("click", () => {
        console.log("********* marker clicked", {
          marker,
          markerPosition: searchedLocation,
        });
        // Alternatively, you can update state to show a custom UI
        // setSelectedMarker(markerPosition);
      });

      // Cleanup the marker on unmount
      // return () => {
      //   marker.remove();
      // };
    }
  }, [searchedLocation]);

  return (
    <>
      {/* @ts-ignore */}
      <SearchBox
        accessToken={accessToken}
        map={mapInstanceRef.current}
        mapboxgl={mapboxgl}
        value={searchInputValue}
        onChange={(d) => {
          setSearchInputValue(d);
        }}
        onRetrieve={(result) => {
          console.log("********* search result", result);
          const coordinates = result.features[0]?.geometry?.coordinates;
          if (coordinates) {
            setSearchedLocation({
              address: result.features[0]?.properties?.full_address,
              coordinates: { lon: coordinates[0], lat: coordinates[1] },
            });
          }
        }}
      />
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ height: 800, width: "80%" }}
      />
      {/* TODO show average distance from points of interest for each place to stay */}
      <AddPointOfInterestControl />
      <AddPlaceToStayControl />
      <PointsOfInterestDisplay />
      <PlacesToStayDisplay />
    </>
  );
}

export default App;
