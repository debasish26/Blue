import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Navigation, AlertTriangle, Droplets, ArrowRight, Thermometer, Droplet, Wind, CloudRain, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default markers
delete (L.Icon.Default.prototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom purple icon for clicked location
const purpleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Interfaces
interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_code: number;
}

interface FloodZone {
  id: number;
  severity: 'severe' | 'moderate' | 'safe';
  center: [number, number];
  radius: number;
  waterLevel: number;
}

interface EscapeRoute {
  id: number;
  name: string;
  risk: 'low' | 'medium' | 'high';
  duration: string;
  description: string;
  path: [number, number][];
}

interface Update {
  message: string;
  type: 'cyclone' | 'rainfall' | 'flood' | 'safe';
  timestamp: string;
}

const ToggleButton = ({ useFakeData, setUseFakeData }: { useFakeData: boolean; setUseFakeData: (value: boolean) => void }) => (
  <div
    style={{
      position: "absolute",
      top: "10px",
      left: "10px",
      zIndex: 1000,
      padding: "8px 12px",
      background: "white",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
    }}
    onClick={() => setUseFakeData(!useFakeData)}
  >
    {useFakeData ? "Switch to Real Data" : "Switch to Fake Data"}
  </div>
);

function DynamicCircle({ center, baseRadius, color }: { center: [number, number]; baseRadius: number; color: string }) {
  const map = useMap();
  const [radius, setRadius] = useState(baseRadius);

  if (!center || isNaN(center[0]) || isNaN(center[1])) {
    console.error('Invalid center coordinates:', center);
    return null;
  }

  useEffect(() => {
    const updateRadius = () => {
      if (!map) return;
      const zoom = map.getZoom();
      const scaleFactor = Math.pow(2, 15 - zoom) * 0.5;
      setRadius(baseRadius / scaleFactor);
    };

    updateRadius();
    map.on('zoomend', updateRadius);

    return () => {
      map.off('zoomend', updateRadius);
    };
  }, [map, baseRadius]);

  return (
    <Circle center={center} radius={radius} color={color}>
      <Popup>Radius: {Math.round(radius)}m</Popup>
    </Circle>
  );
}

function LocationMarker({ setClickedLocation, setWeatherData, setIsFetchingWeather, useFakeData, fallbackWeatherData }: {
  setClickedLocation: (loc: [number, number] | null) => void;
  setWeatherData: (data: WeatherData | null) => void;
  setIsFetchingWeather: (value: boolean) => void;
  useFakeData: boolean;
  fallbackWeatherData: WeatherData;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setClickedLocation([lat, lng]);
      setIsFetchingWeather(true);

      const fetchWeatherData = async () => {
        try {
          if (!useFakeData) {
            const weatherRes = await axios.get(`http://127.0.0.1:5000/api/weather?lat=${lat}&lon=${lng}`);
            console.log('Fetched weather data for clicked location:', weatherRes.data);
            setWeatherData(weatherRes.data);
          } else {
            console.log('Using fake weather data for clicked location:', fallbackWeatherData);
            setWeatherData(fallbackWeatherData);
          }
        } catch (error) {
          console.error('Error fetching weather data for clicked location:', error);
          setWeatherData(fallbackWeatherData);
        } finally {
          setIsFetchingWeather(false);
        }
      };
      fetchWeatherData();
    },
  });
  return null;
}

function MapController({ userLocation, onRecenter }: { userLocation: [number, number]; onRecenter: () => void }) {
  const map = useMap();
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    mapRef.current = map;
    console.log('MapController: Map ref set');
  }, [map]);

  useEffect(() => {
    onRecenter(() => {
      if (mapRef.current) {
        console.log('MapController: Recentering to:', userLocation);
        mapRef.current.flyTo(userLocation, 13.5, { duration: 1.5 });
      } else {
        console.error('MapController: Map ref not available');
      }
    });
  }, [userLocation, onRecenter]);

  return null;
}

const dummyRoutes: EscapeRoute[] = [
  { id: 1, name: "Route to Safe Point 1", risk: "low", duration: "15 mins", description: "Path to Safe Point 1 (10.5km)", path: [[18.9691, 72.8193], [18.9750, 72.8300], [19.0760, 72.8777]] },
  { id: 2, name: "Route to Safe Point 2", risk: "medium", duration: "20 mins", description: "Path to Safe Point 2 (12.3km)", path: [[18.9691, 72.8193], [18.9800, 72.8500], [19.0825, 72.8900]] }
];

function FloodMap() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [floodZones, setFloodZones] = useState<FloodZone[]>([]);
  const [routes, setRoutes] = useState<EscapeRoute[]>(dummyRoutes);
  const [selectedRoute, setSelectedRoute] = useState<EscapeRoute | null>(dummyRoutes[0]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [useFakeData, setUseFakeData] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([18.9691, 72.8193]);
  const [clickedLocation, setClickedLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(true);
  const [recenterMap, setRecenterMap] = useState<(() => void) | null>(null);

  const fallbackWeatherData: WeatherData = {
    temperature: 25,
    humidity: 70,
    precipitation: 5,
    wind_speed: 10,
    weather_code: 0,
  };

  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 10000,
  };

  // Fetch initial weather and flood zone data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetchingWeather(true);
        if (!useFakeData) {
          const weatherRes = await axios.get(`http://127.0.0.1:5000/api/weather?lat=${userLocation[0]}&lon=${userLocation[1]}`);
          console.log('Initial weather data:', weatherRes.data);
          setWeatherData(weatherRes.data);
        } else {
          console.log('Initial fake weather data:', fallbackWeatherData);
          setWeatherData(fallbackWeatherData);
        }

        const zonesResponse = await fetch('http://127.0.0.1:5000/api/flood-zones');
        if (!zonesResponse.ok) throw new Error("Failed to fetch flood zones");
        const zonesData = await zonesResponse.json();
        setFloodZones(zonesData);

        setRoutes(dummyRoutes);
        setSelectedRoute(dummyRoutes[0] || null);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setWeatherData(fallbackWeatherData);
        setRoutes(dummyRoutes);
        setSelectedRoute(dummyRoutes[0] || null);
      } finally {
        setIsFetchingWeather(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [useFakeData, userLocation]);

  // Fetch live updates
  useEffect(() => {
    const fetchLiveUpdates = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/live-updates?lat=${userLocation[0]}&lon=${userLocation[1]}`);
        setUpdates(response.data);
      } catch (error) {
        console.error('Error fetching live updates:', error);
        setUpdates([{ message: "Unable to fetch updates", type: "error", timestamp: new Date().toISOString() }]);
      }
    };

    fetchLiveUpdates();
    const interval = setInterval(fetchLiveUpdates, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, [userLocation]);

  // Geolocation effect
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLoadingLocation(false);
          console.log('Initial user location set:', [latitude, longitude]);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          setLocationError(error.message);
          setIsLoadingLocation(false);
        },
        geolocationOptions
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          console.log('Updated user location:', [latitude, longitude]);
        },
        (error) => console.warn("Location tracking error:", error.message),
        geolocationOptions
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  }, []);

  const handleRecenter = () => {
    if (recenterMap) {
      recenterMap();
    } else {
      console.error('Recenter function not available yet');
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            if (recenterMap) {
              recenterMap();
            }
          },
          (error) => console.warn("Failed to get location on recenter:", error.message),
          geolocationOptions
        );
      }
    }
  };

  if (isLoadingLocation) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Using default location: {locationError}</p>
        </div>
      </div>
    );
  }

  const validFloodZones = floodZones.filter(zone =>
    zone.center && !isNaN(zone.center[0]) && !isNaN(zone.center[1])
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Weather Metrics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                {clickedLocation ? `Clicked Location Weather (${clickedLocation[0].toFixed(2)}, ${clickedLocation[1].toFixed(2)})` : "Current Weather Conditions"}
              </h2>
              {isFetchingWeather ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                  <p className="text-gray-600">Fetching weather data...</p>
                </div>
              ) : weatherData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center"><Thermometer className="mr-2 h-5 w-5" /> Temperature</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {weatherData.temperature} °C
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center"><Droplet className="mr-2 h-5 w-5" /> Humidity</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {weatherData.humidity} %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center"><Droplets className="mr-2 h-5 w-5" /> Precipitation</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {weatherData.precipitation} mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 flex items-center"><Wind className="mr-2 h-5 w-5" /> Wind Speed</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {weatherData.wind_speed} km/h
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No weather data available</p>
              )}
            </div>

            {/* Updated Live Updates Section */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <AlertCircle className="mr-2 h-6 w-6 text-blue-500" /> Live Updates
              </h2>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {updates.length > 0 ? (
                  updates.map((update, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg shadow-md flex items-start space-x-3 transition-all duration-300 ${update.type === 'cyclone'
                        ? 'bg-red-100 border-l-4 border-red-500'
                        : update.type === 'flood'
                          ? 'bg-yellow-100 border-l-4 border-yellow-500'
                          : update.type === 'rainfall'
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'bg-green-100 border-l-4 border-green-500'
                        }`}
                    >
                      {update.type === 'cyclone' && <Wind className="h-6 w-6 text-red-500" />}
                      {update.type === 'flood' && <Droplets className="h-6 w-6 text-yellow-500" />}
                      {update.type === 'rainfall' && <CloudRain className="h-6 w-6 text-blue-500" />}
                      {update.type === 'safe' && <AlertCircle className="h-6 w-6 text-green-500" />}
                      <div>
                        <p className="text-gray-800 font-medium">{update.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-600">Fetching updates...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Column - Map Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <div className="relative h-[500px] rounded-lg overflow-hidden">
                <MapContainer
                  center={userLocation}
                  zoom={13.5}
                  style={{ height: '500px', width: '100%' }}
                >
                  <TileLayer
                    url={isSatelliteView ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                    attribution={isSatelliteView ? '© <a href="https://opentopomap.org">OpenTopoMap</a> contributors' : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                  />
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${'YOUR_OPENWEATHERMAP_API_KEY'}`}
                    opacity={0.5}
                    attribution='© <a href="https://openweathermap.org">OpenWeatherMap</a>'
                  />
                  <Marker position={userLocation}><Popup>You are here</Popup></Marker>
                  {validFloodZones.map(zone => (
                    <DynamicCircle
                      key={zone.id}
                      center={zone.center}
                      baseRadius={zone.radius}
                      color={zone.severity === 'severe' ? 'red' : zone.severity === 'moderate' ? 'yellow' : 'green'}
                    />
                  ))}
                  {clickedLocation && (
                    <Marker position={clickedLocation} icon={purpleIcon}>
                      <Popup>Clicked Location: {clickedLocation[0].toFixed(4)}, {clickedLocation[1].toFixed(4)}</Popup>
                    </Marker>
                  )}
                  <LocationMarker
                    setClickedLocation={setClickedLocation}
                    setWeatherData={setWeatherData}
                    setIsFetchingWeather={setIsFetchingWeather}
                    useFakeData={useFakeData}
                    fallbackWeatherData={fallbackWeatherData}
                  />
                  <MapController
                    userLocation={userLocation}
                    onRecenter={(recenterFn) => setRecenterMap(() => recenterFn)}
                  />
                </MapContainer>
                <button
                  onClick={() => setIsSatelliteView(!isSatelliteView)}
                  className="absolute top-10 right-10 z-[1000] px-4 py-2 bg-white rounded-md shadow-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {isSatelliteView ? "Normal Map" : "Satellite Map"}
                </button>
                <button
                  onClick={handleRecenter}
                  className="absolute top-20 right-10 z-[1000] px-4 py-2 bg-white rounded-md shadow-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Navigation className="mr-2 h-4 w-4" /> My Location
                </button>
                <ToggleButton useFakeData={useFakeData} setUseFakeData={setUseFakeData} />
              </div>

              <div className="mt-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-2 text-black">Map Legend</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-black">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-75"></div>
                    <span>Severe Flooding</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-75"></div>
                    <span>Moderate Flooding</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 opacity-75"></div>
                    <span>Safe Zone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                    <span>Clicked Location</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Recommended Escape Routes</h2>
                <div className="space-y-4">
                  {routes.map(route => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${selectedRoute?.id === route.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{route.name}</h3>
                          <p className="text-sm text-gray-600">{route.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${route.risk === 'low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {route.risk} risk
                          </span>
                          <span className="text-gray-600">{route.duration}</span>
                          <ArrowRight className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FloodMap;
