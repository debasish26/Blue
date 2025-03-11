import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Wind, Droplets, LogIn, MessageSquare, AlertTriangle, Menu, Search, Upload, Phone, MapPin } from 'lucide-react';
import WeatherAlert from './components/WeatherAlert';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import CurrentConditions from './components/weather/CurrentConditions';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FloodMap from './components/FloodMap';
import AuthCard from './pages/AuthCard';
import { getCurrentWeather, WeatherData, getCoordinatesFromLocation } from './services/weatherService';
import Home from './pages/Home';
import Settings from './pages/Settings';
import { Navbar } from './components/Navbar';
import Scheduler from './pages/Scheduler';
function App() {
  const [showChat, setShowChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [userCoordinates, setUserCoordinates] = useState<{lat: number; lon: number} | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | undefined>(undefined); // State for weather data

  useEffect(() => {
    // Get user's location when component mounts
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoordinates({ lat: latitude, lon: longitude });

          // Get city name from coordinates using reverse geocoding
          try {
            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
            );
            const data = await response.json();
            if (data && data[0]) {
              setSearchLocation(data[0].name);
            }
          } catch (error) {
            console.error("Error getting location name:", error);
            setSearchLocation('London'); // Fallback to London if reverse geocoding fails
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setSearchLocation('London'); // Fallback to London if geolocation fails
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setSearchLocation('London'); // Fallback to London if geolocation is not supported
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchLocation(query);
    setUserCoordinates(null); // Clear user coordinates when searching for a specific location
  };

  const emergencyContacts = {
    police: "911",
    ambulance: "912",
    fire: "913",
    disasterControl: "914"
  };

  const handleAuthSubmit = (data: any) => {
    console.log('Auth submitted:', data);
    // Handle successful authentication here
  };

  return (
    <Router>
      {/* Navbar outside of Routes so it appears on all pages */}
      <Navbar />

      <Routes>
        <Route path="/auth" element={<AuthCard onSubmit={handleAuthSubmit} />} />
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <div className="flex">
                <main className="flex-1 container mx-auto px-4 py-8 space-y-8 mt-20">
                  {/* Search Bar */}
                  <SearchBar onSearch={handleSearch} />

                  {/* Current Conditions */}
                  <CurrentConditions
                    searchLocation={searchLocation}
                    userCoordinates={userCoordinates}
                  />

                  {/* Emergency Contact Bar */}
                  <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-5 h-5 text-red-400" />
                        <span className="font-bold text-red-400">Emergency Contacts</span>
                      </div>
                      <div className="flex gap-4">
                        {Object.entries(emergencyContacts).map(([service, number]) => (
                          <a
                            key={service}
                            href={`tel:${number}`}
                            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg"
                          >
                            <span className="capitalize">{service}:</span>
                            <span className="font-bold">{number}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Weather Alert Section */}
                  <WeatherAlert />
                </main>
              </div>
            </div>
          }
        />
        <Route path="/flood-map" element={<FloodMap />} />
      </Routes>
    </Router>
  );
}

export default App;
