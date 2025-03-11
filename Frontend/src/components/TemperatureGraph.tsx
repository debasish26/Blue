import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your API key

// Generate hourly data based on current temp and feels like, with some variation
const generateHourlyData = (currentTemp, feelsLike) => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now.getTime() - (23 - i) * 3600000);
    const variation = Math.sin((i / 24) * Math.PI * 2) * 2 + (Math.random() * 1 - 0.5);
    return {
      time: time.getHours().toString().padStart(2, '0') + ':00',
      temp: Math.round((currentTemp + variation) * 10) / 10,
      feels: Math.round((feelsLike + variation + (Math.random() * 1 - 0.5)) * 10) / 10,
    };
  });
};

export function TemperatureGraph() {
  const [data, setData] = useState([]);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [feelsLike, setFeelsLike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch weather data based on geolocation
  const fetchWeatherData = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=d7fd4f07195ec9e6fbd27b00998bdb52&units=metric`
      );
      const { main } = response.data;
      const temp = main.temp;
      const feels = main.feels_like;

      setCurrentTemp(temp);
      setFeelsLike(feels);
      setData(generateHourlyData(temp, feels));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  // Get user geolocation and fetch weather data
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
      setError('Geolocation not supported by this browser');
      setLoading(false);
    }

    // Update every 5 minutes (300,000 ms)
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

  if (loading) {
    return (
      <div className="text-blue-200 text-center p-4">Loading weather data...</div>
    );
  }

  if (error) {
    return (
      <div className="text-red-300 text-center p-4">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
          <div className="text-blue-200 text-sm mb-1">Current Temperature</div>
          <div className="text-3xl font-bold text-blue-100">
            {currentTemp}°C
            <span className="text-sm font-normal text-blue-300 ml-2">Now</span>
          </div>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
          <div className="text-blue-200 text-sm mb-1">Feels Like</div>
          <div className="text-3xl font-bold text-blue-100">
            {feelsLike}°C
            <span className="text-sm font-normal text-blue-300 ml-2">
              {feelsLike > currentTemp ? '🔥' : '❄️'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(96, 165, 250, 0.2)" />
            <XAxis
              dataKey="time"
              stroke="#93C5FD"
              tick={{ fontSize: 12 }}
              interval={3}
            />
            <YAxis
              stroke="#93C5FD"
              tick={{ fontSize: 12 }}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '8px',
                color: '#BFDBFE'
              }}
            />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#60A5FA"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#60A5FA' }}
            />
            <Line
              type="monotone"
              dataKey="feels"
              stroke="#818CF8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#818CF8' }}
              strokeDasharray="4 4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
