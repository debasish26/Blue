import React, { useEffect, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import axios from "axios";
import { getDisasterAlerts, DisasterData } from "../../services/getDisasterData";

function CycloneAlert() {
  const [disaster, setDisaster] = useState<DisasterData | null>(null);
  const [useFakeData, setUseFakeData] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState("cyclone");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OpenWeatherMap API key (replace with your own)
  const OPENWEATHER_API_KEY = "YOUR_OPENWEATHERMAP_API_KEY_HERE"; // Replace this!

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          console.log(`📍 User Location: Lat ${position.coords.latitude}, Lon ${position.coords.longitude}`);
        },
        (err) => {
          console.error("❌ Location error:", err);
          setError("Location access denied. Unable to fetch nearby disasters.");
        }
      );
    } else {
      setError("Geolocation is not supported in this browser.");
    }
  }, []);

  // Fetch weather data from OpenWeatherMap
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: {
          lat,
          lon,
          appid: '2e8b16273dd6fdeacaa5f6ca60a250f8',
          units: "metric", // For Celsius and mm precipitation
        },
      });
      const weather = response.data;
      console.log("OpenWeatherMap Response:", weather);

      // Ensure all required fields are present
      const precipitation = weather.rain?.["1h"] ?? -1; // Set -1 to indicate missing data instead of 0
      // 1-hour precipitation in mm, default to 0 if missing
      const riverDischarge = precipitation > 0 ? precipitation * 10 : 5.0; // Rough estimate, adjust as needed
      const centralPressure = weather.main.pressure || 1013; // hPa, default to standard pressure if missing

      const weatherData = {
        precipitation,
        river_discharge: riverDischarge,
        central_pressure: centralPressure,
      };

      console.log("Prepared Weather Data:", weatherData);
      return weatherData;
    } catch (error) {
      console.error("🚨 Error fetching weather data:", error);
      return null;
    }
  };

  // Function to send notification email
  const sendAlertNotification = async (disasterData: DisasterData) => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      if (!token || !user?.email) {
        setError("Please login to receive notifications");
        return;
      }

      const alertMessage = `
🚨 DISASTER ALERT 🚨

Event Type: ${disasterData.event}
Probability: ${disasterData.probability}%
Expected Date: ${disasterData.expectedDate}
Intensity: ${disasterData.intensity}
Location: ${disasterData.location || 'Your area'}

Recommended Actions:
${disasterData.recommendations.join('\n')}

Please take necessary precautions and stay safe.
`;

      const response = await fetch('http://127.0.0.1:5050/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userEmail: user.email,
          type: 'weather',
          title: `${disasterData.event} Alert`,
          severity: disasterData.probability > 50 ? 'high' : 'medium',
          location: disasterData.location || 'Your area',
          description: alertMessage,
          source: useFakeData ? 'Simulation Data' : 'Real-time Data'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      console.log('Alert notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification');
    }
  };

  // Modify the fetchRealData function
  const fetchRealData = async () => {
    if (!location) {
      setError("❌ Location not available yet.");
      return;
    }

    setLoading(true);
    setError(null);
    setDisaster(null);

    try {
      const weatherData = await fetchWeatherData(location.lat, location.lon);
      if (!weatherData) {
        setError("Failed to fetch weather data.");
        setLoading(false);
        return;
      }

      const data = await getDisasterAlerts(
        false,
        selectedDisaster,
        location.lat,
        location.lon,
        weatherData
      );

      console.log("Final Disaster Response:", data);
      setDisaster(data);

      // Send notification if there's a significant threat
      if (data && data.probability > 20) {
        await sendAlertNotification(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to fetch disaster data');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle data switch
  const handleDataSwitch = async () => {
    setUseFakeData(!useFakeData);
    setLoading(true);
    setError(null);

    try {
      if (!location) {
        throw new Error("Location not available");
      }

      if (!useFakeData) {
        // Switching to fake data
        const fakeData = await getDisasterAlerts(true, selectedDisaster, location.lat, location.lon);
        setDisaster(fakeData);

        // Always send notification for simulation data
        if (fakeData) {
          await sendAlertNotification(fakeData);
        }
      } else {
        // Switching to real data
        await fetchRealData();
      }
    } catch (error) {
      console.error('Error switching data:', error);
      setError('Failed to switch data source');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (location) {
      fetchRealData(); // Start with real data
    }
  }, [location]);

  return (
    <div className="bg-orange-900/20 backdrop-blur-sm rounded-xl overflow-hidden p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-orange-400 flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-orange-400" />
          <span>Disaster Alert</span>
        </h2>
        <button
          onClick={handleDataSwitch}
          className="px-4 py-2 text-sm font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
        >
          {useFakeData ? "Switch to Real Data" : "Use Simulation Data"}
        </button>
      </div>

      <div className="mb-4">
        <label className="text-gray-400 text-sm">Select Disaster Type:</label>
        <select
          value={selectedDisaster}
          onChange={(e) => setSelectedDisaster(e.target.value)}
          className="ml-2 px-3 py-1 bg-black/20 text-white rounded-lg"
        >
          <option value="flood">Flood</option>
          <option value="cyclone">Cyclone</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-4 text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-300">⏳ Fetching disaster data...</div>
      ) : !disaster ? (
        <div className="bg-green-900/20 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-bold text-green-400">✅ No Active Disasters</h2>
          <p className="text-gray-300">There are no significant disasters detected in your region.</p>
        </div>
      ) : disaster.probability < 20 ? (
        <div className="bg-green-900/20 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-bold text-green-400">✅ No Nearby Threat</h2>
          <p className="text-gray-300">
            {disaster.event} probability is low ({disaster.probability}%). No immediate action required.
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-black/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400">Event</h4>
              <p className="text-xl font-bold text-white">{disaster.event}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400">Probability</h4>
              <p className="text-xl font-bold text-white">{disaster.probability}%</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400">Expected Date</h4>
              <p className="text-xl font-bold text-white">{disaster.expectedDate}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400">Intensity</h4>
              <p className="text-xl font-bold text-white">{disaster.intensity}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="text-sm text-gray-400">Location</h4>
                <p className="text-xl font-bold text-white">{disaster.location || "Unknown"}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-orange-400 font-bold mb-2">Recommended Actions</h3>
            <div className="flex flex-wrap gap-2">
              {disaster.recommendations.map((rec, index) => (
                <span key={index} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
                  {rec}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CycloneAlert;
