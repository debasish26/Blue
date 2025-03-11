import axios from 'axios';

const OPEN_WEATHER_API_KEY = '2e8b16273dd6fdeacaa5f6ca60a250f8';
const AI_SERVER_URL = 'http://localhost:5001';

export interface WeatherData {
    status: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    rainfallTime: any;
    visibility: number;
    airQuality: string;
    warnings: string[];
    riskScore: number;
    recommendations: string[];
    location: string;
    image: string;
    coordinates: {
        lat: number;
        lon: number;
    };
}

// Fetch coordinates from a location name
export const getCoordinatesFromLocation = async (location: string): Promise<{ lat: number; lon: number }> => {
    try {
        console.log(`📍 Fetching coordinates for location: ${location}`);
        const response = await axios.get(
            `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPEN_WEATHER_API_KEY}`
        );
        const data = response.data[0];
        if (!data) {
            throw new Error(`No coordinates found for location: ${location}`);
        }
        console.log(`✅ Coordinates Received: Lat ${data.lat}, Lon ${data.lon}`);
        return { lat: data.lat, lon: data.lon };
    } catch (error) {
        console.error(`❌ Error fetching coordinates for ${location}:`, error);
        throw error;
    }
};

export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        console.log(`📡 Fetching weather for: Lat ${lat}, Lon ${lon}`);

        // 🌤 Fetch Current Weather
        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
        );

        console.log("✅ OpenWeather Response:", weatherResponse.data);

        // 🌍 Fetch Air Quality Data
        const airQualityResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}`
        );

        console.log("✅ Air Quality Response:", airQualityResponse.data);

        // 📊 Fetch Forecast for AI Analysis
        const forecastResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
        );

        console.log("✅ Forecast Response:", forecastResponse.data);

        // 🤖 Send Data to AI Server for Extreme Weather Analysis
        const aiResponse = await axios.post(`${AI_SERVER_URL}/extreme_weather`, {
            forecast: forecastResponse.data.list,
            location: weatherResponse.data.name
        });

        console.log("✅ AI Server Response:", aiResponse.data);

        const weather = weatherResponse.data;
        const aiData = aiResponse.data.today;

        // 🌫 Extract Air Quality Index
        const aqiLevels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
        const airQualityIndex = airQualityResponse.data.list[0].main.aqi;
        const airQuality = aqiLevels[airQualityIndex - 1] || "Unknown";

        const weatherData: WeatherData = {
            status: weather.weather[0].main,
            temperature: weather.main.temp,
            humidity: weather.main.humidity,
            windSpeed: weather.wind.speed,
            rainfall: weather.rain ? weather.rain['1h'] || 0 : 0,
            rainfallTime: weather.dt ? new Date(weather.dt * 1000).toISOString() : null,
            visibility: weather.visibility / 1000,
            airQuality,
            warnings: [],
            riskScore: aiResponse.data.today.riskScore || 0,
            recommendations: aiResponse.data.today.recommendations || [],
            location: weather.name || "Unknown",
            coordinates: {
                lat: weather.coord?.lat || lat,
                lon: weather.coord?.lon || lon
            },
            image: aiResponse.data.today.image
        };

        console.log("✅ Final WeatherData Object Before Returning:", weatherData);
        return weatherData;

    } catch (error) {
        console.error("❌ Error fetching weather data:", error);
        console.error("❌ Error details:", error.response?.data || error.message);
        throw new Error("Failed to fetch weather data");
    }
};
