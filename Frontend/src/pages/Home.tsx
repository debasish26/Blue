import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tornado } from '../components/Tornado';
import { TemperatureGraph } from '../components/TemperatureGraph';
import { Description } from '../components/Description';
import axios from 'axios';
import LiveDisasterAlerts from '../components/weather/LiveDisasterAlerts';
const API_KEY = 'a99b9aed98233edcac512fc2a16cb7aa'; // Replace with your OpenWeatherMap API key

function Home() {
  const navigate = useNavigate();
  const [windSpeed, setWindSpeed] = useState(null);
  const [precipitation, setPrecipitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch weather data based on geolocation
  const fetchWeatherData = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const { wind, weather } = response.data;

      // Wind speed in m/s converted to km/h (1 m/s = 3.6 km/h)
      const windSpeedKmh = Math.round(wind.speed * 3.6);
      setWindSpeed(windSpeedKmh);

      // Precipitation probability (OpenWeatherMap doesn't directly provide %, so we'll use 'pop' from forecast if needed)
      // For current weather, we'll use cloudiness or rain presence as a proxy
      const rain = response.data.rain ? response.data.rain['1h'] || 0 : 0;
      const precipitationChance = rain > 0 ? 80 : weather[0].id >= 500 && weather[0].id < 600 ? 60 : 20; // Rough estimation
      setPrecipitation(precipitationChance);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Unable to get location');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported');
      setLoading(false);
    }

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        });
      }
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const handleEnterBlue = () => {
    navigate('/dashboard');
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherData(latitude, longitude);
      });
    }
  };

  if (loading) {
    return <div className="text-blue-200 text-center p-4">Loading weather data...</div>;
  }

  if (error) {
    return <div className="text-red-300 text-center p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent animate-pulse"></div>

      <div className="container mx-auto px-4 pt-24 pb-24 relative z-10">
        <div className="bg-slate-800/40 rounded-3xl p-8 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="inline-block bg-blue-500/20 text-blue-300 px-6 py-2 rounded-full border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                BLUE
              </div>

              <div className="space-y-6">
                <TemperatureGraph />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
                    <div className="text-blue-200 text-sm">Precipitation</div>
                    <div className="text-2xl font-bold text-blue-100">{precipitation}%</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
                    <div className="text-blue-200 text-sm">Wind Speed</div>
                    <div className="text-2xl font-bold text-blue-100">{windSpeed} km/h</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEnterBlue}
                className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)]"
              >
                ENTER BLUE
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="h-[500px] relative">
              <div className="absolute inset-0 bg-blue-500/5 rounded-2xl border border-blue-400/20"></div>
              <Canvas camera={{ position: [0, 2, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} color="#60A5FA" intensity={2} />
                <spotLight
                  position={[0, 10, 0]}
                  angle={0.3}
                  penumbra={1}
                  intensity={2}
                  color="#60A5FA"
                />
                <Tornado />
                <OrbitControls enableZoom={false} />
              </Canvas>
            </div>
          </div>
        </div>
      </div>

      <Description />

      <button
        onClick={handleRefresh}
        className="fixed bottom-20 right-4 bg-blue-500/20 p-2 rounded-full backdrop-blur-sm hover:bg-blue-400/30 transition-all border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
      >
        <RefreshCw className="text-blue-100" size={24} />
      </button>
    </div>
  );
}

export default Home;
