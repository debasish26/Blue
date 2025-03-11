import React, { useState, useEffect } from "react";
import CurrentConditions from "./weather/CurrentConditions";
import CycloneAlert from "./weather/CycloneAlert";
import FutureRiskAssessment from "./weather/LiveDisasterAlerts";
import FloodMap from "./FloodMap";
import Scheduler from "../pages/Scheduler";
import { Map, Sun, Droplets, Wind, Cloud } from "lucide-react";
import { Link } from "react-router-dom";
import WeatherChart from "./weather/WeatherChart";

function WeatherAlert() {
    const [location, setLocation] = useState("New York");
    const [weatherData, setWeatherData] = useState({ temp: 0, humidity: 0, wind: 0, precipitation: 0 });
    const [loading, setLoading] = useState(true);
    const [hourlyData, setHourlyData] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/hourly-weather?lat=28.7041&lon=77.1025")
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched Hourly Weather Data:", data);
                setHourlyData(data.forecast);
            })
            .catch((err) => console.error("Error fetching hourly weather data:", err));
    }, []);

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-8">
                    <div className="space-y-6">
                        <CycloneAlert />
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-700">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Map size={20} />
                                    Disaster Map Preview
                                </h3>
                            </div>
                            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                                <div className="z-0 absolute top-0 left-0 w-full h-full">
                                    <FloodMap />
                                </div>
                            </div>
                            <div className="relative z-10 p-4 bg-gray-800/80">
                                <Link
                                    to="/flood-map"
                                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                                >
                                    <Map size={20} />
                                    <span>Open Full Disaster Map</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-4 space-y-6">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden">
                        <FutureRiskAssessment />
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden">
                        <div className="p-4">
                            <div className="bg-transparent">
                                <Scheduler />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeatherAlert;
