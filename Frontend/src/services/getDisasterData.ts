import axios from "axios";

// Base URL for the FastAPI server
const ML_API_BASE_URL = "https://blue-backend-three.onrender.com";

// DisasterData interface matching the backend response structure
export interface DisasterData {
  event: string;
  probability: number;
  expectedDate: string;
  intensity: string;
  image: string;
  details: string;
  recommendations: string[];
  location: string;
}

// Function to get fake disaster data for testing
const getFakeDisaster = (selectedDisaster: string): DisasterData => {
  const fakeDisasters: Record<string, DisasterData> = {
    flood: {
      event: "Simulated Flood",
      probability: 95,
      expectedDate: "2025-02-25",
      intensity: "High",
      image: "https://source.unsplash.com/800x600/?flood,disaster",
      details: "A simulated flood with high risk has been detected.",
      recommendations: ["Prepare sandbags", "Avoid low-lying areas", "Monitor updates"],
      location: "California, USA",
    },
    cyclone: {
      event: "Simulated Cyclone",
      probability: 85,
      expectedDate: "2025-02-28",
      intensity: "Severe",
      image: "https://source.unsplash.com/800x600/?cyclone,storm",
      details: "A simulated severe cyclone is approaching.",
      recommendations: ["Stay indoors", "Stock supplies", "Follow evacuation orders"],
      location: "Florida, USA",
    },
  };

  return fakeDisasters[selectedDisaster] || fakeDisasters["flood"];
};

// Function to get disaster alerts from the ML backend or fake data
export const getDisasterAlerts = async (
  useFakeData: boolean = false,
  selectedDisaster: string = "flood",
  userLat?: number,
  userLon?: number,
  weatherData?: { river_discharge?: number; precipitation?: number; central_pressure?: number }
): Promise<DisasterData | null> => {
  try {
    console.log(`📡 Fetching ${useFakeData ? "FAKE" : "ML-BASED"} disaster alerts for ${selectedDisaster}`);

    if (useFakeData) {
      const fakeData = getFakeDisaster(selectedDisaster);
      console.log("Fake Data Response:", fakeData);
      return fakeData;
    }

    if (!userLat || !userLon) {
      console.error("❌ User location (lat, lon) not provided!");
      return null;
    }

    if (!weatherData) {
      console.error("❌ Weather data not provided!");
      return null;
    }

    console.log("Weather Data Received:", weatherData);

    let response;
    if (selectedDisaster === "flood") {
      if (!weatherData.river_discharge || !weatherData.precipitation) {
        console.error("❌ Flood prediction requires river_discharge and precipitation!");
        console.error("Current weatherData:", weatherData);
        return null;
      }
      console.log(`Sending flood request: river_discharge=${weatherData.river_discharge}, precipitation=${weatherData.precipitation}, lat=${userLat}, lon=${userLon}`);
      response = await axios.get(`${ML_API_BASE_URL}/predict/flood`, {
        params: {
          river_discharge: weatherData.river_discharge,
          precipitation: weatherData.precipitation,
          lat: userLat,
          lon: userLon,
        },
      });
      console.log("Flood Real Data Response from Backend:", response.data);
    } else if (selectedDisaster === "cyclone") {
      if (!weatherData.central_pressure) {
        console.error("❌ Cyclone prediction requires central_pressure!");
        console.error("Current weatherData:", weatherData);
        return null;
      }
      console.log(`Sending cyclone request: central_pressure=${weatherData.central_pressure}, lat=${userLat}, lon=${userLon}`);
      response = await axios.get(`${ML_API_BASE_URL}/predict/cyclone`, {
        params: {
          central_pressure: weatherData.central_pressure,
          lat: userLat,
          lon: userLon,
        },
      });
      console.log("Cyclone Real Data Response from Backend:", response.data);
    } else {
      console.error("❌ Unsupported disaster type! Use 'flood' or 'cyclone'.");
      return null;
    }

    return response.data as DisasterData;
  } catch (error) {
    console.error("🚨 Error fetching disaster alerts:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios Error Details:", error.response?.data || error.message);
    }
    return null;
  }
};
