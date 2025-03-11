import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Loader2, MapPin, Calendar } from 'lucide-react';
import { getCurrentWeather, WeatherData, getCoordinatesFromLocation } from '../../services/weatherService';

interface CurrentConditionsProps {
    searchLocation: string;
    userCoordinates: { lat: number; lon: number } | null;
}

const UNSPLASH_ACCESS_KEY = 'Y4y1K8UORi3TRIQip9XKU772tb3K9pPQrMLpHmTp9Xs'; // Replace with your actual key

const getWeatherSearchTerm = (status: string | undefined) => {
    if (!status) return 'weather';

    const normalizedStatus = status.toLowerCase();
    if (['clear', 'sunny'].includes(normalizedStatus)) {
        return 'sunny weather landscape';
    } else if (['rain', 'drizzle', 'shower'].some(condition => normalizedStatus.includes(condition))) {
        return 'rainy weather';
    } else if (['cloudy', 'overcast'].includes(normalizedStatus)) {
        return 'cloudy sky';
    } else if (['mist', 'fog', 'haze'].includes(normalizedStatus)) {
        return 'foggy landscape';
    } else if (['thunderstorm', 'storm'].includes(normalizedStatus)) {
        return 'thunderstorm lightning';
    } else if (['snow', 'sleet', 'blizzard'].includes(normalizedStatus)) {
        return 'snow landscape';
    } else if (['tornado', 'hurricane'].includes(normalizedStatus)) {
        return 'stormy weather';
    }
    return 'weather landscape';
};

function CurrentConditions({ searchLocation, userCoordinates }: CurrentConditionsProps) {
    const [conditions, setConditions] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weatherImage, setWeatherImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                setLoading(true);
                setError(null);

                let weatherData;

                if (userCoordinates) {
                    // Use direct coordinates if available
                    weatherData = await getCurrentWeather(userCoordinates.lat, userCoordinates.lon);
                } else if (searchLocation) {
                    // Otherwise use the search location
                    const coords = await getCoordinatesFromLocation(searchLocation);
                    weatherData = await getCurrentWeather(coords.lat, coords.lon);
                } else {
                    throw new Error("No location specified");
                }

                if (weatherData) {
                    setConditions(weatherData);
                    console.log("✅ Weather data updated for:", weatherData.location);
                } else {
                    throw new Error("Failed to fetch weather data");
                }
            } catch (err) {
                console.error("❌ Error fetching weather data:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch weather data");
            } finally {
                setLoading(false);
            }
        };

        if (userCoordinates || searchLocation) {
            fetchWeatherData();
        }
    }, [searchLocation, userCoordinates]);

    useEffect(() => {
        const fetchWeatherImage = async () => {
            if (!conditions?.status) return;

            try {
                const searchTerm = getWeatherSearchTerm(conditions.status);
                const response = await fetch(
                    `https://api.unsplash.com/photos/random?query=${searchTerm}&orientation=landscape`,
                    {
                        headers: {
                            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
                        }
                    }
                );

                if (!response.ok) throw new Error('Failed to fetch image');

                const data = await response.json();
                setWeatherImage(data.urls.regular);
            } catch (error) {
                console.error('Error fetching weather image:', error);
                setWeatherImage(null);
            }
        };

        fetchWeatherImage();
    }, [conditions?.status]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    };

    const getBackgroundColor = (status: string | undefined) => {
        if (!status) return 'bg-slate-900/20';

        const normalizedStatus = status.toLowerCase();
        if (['clear', 'sunny'].includes(normalizedStatus)) {
            return 'bg-sky-400/20';
        } else if (['rain', 'drizzle', 'shower'].some(condition => normalizedStatus.includes(condition))) {
            return 'bg-indigo-900/20';
        } else if (['cloudy', 'overcast'].includes(normalizedStatus)) {
            return 'bg-slate-700/20';
        } else if (['mist', 'fog', 'haze'].includes(normalizedStatus)) {
            return 'bg-slate-500/20';
        } else if (['thunderstorm', 'storm'].includes(normalizedStatus)) {
            return 'bg-purple-900/20';
        } else if (['snow', 'sleet', 'blizzard'].includes(normalizedStatus)) {
            return 'bg-sky-900/20';
        } else if (['tornado', 'hurricane'].includes(normalizedStatus)) {
            return 'bg-rose-900/20';
        }
        return 'bg-slate-900/20';
    };

    const getGradientColor = (status: string | undefined) => {
        if (!status) return 'from-slate-500/20';

        const normalizedStatus = status.toLowerCase();
        if (['clear', 'sunny'].includes(normalizedStatus)) {
            return 'from-sky-400/20';
        } else if (['rain', 'drizzle', 'shower'].some(condition => normalizedStatus.includes(condition))) {
            return 'from-indigo-500/20';
        } else if (['cloudy', 'overcast'].includes(normalizedStatus)) {
            return 'from-slate-600/20';
        } else if (['mist', 'fog', 'haze'].includes(normalizedStatus)) {
            return 'from-slate-400/20';
        } else if (['thunderstorm', 'storm'].includes(normalizedStatus)) {
            return 'from-purple-500/20';
        } else if (['snow', 'sleet', 'blizzard'].includes(normalizedStatus)) {
            return 'from-sky-200/20';
        } else if (['tornado', 'hurricane'].includes(normalizedStatus)) {
            return 'from-rose-500/20';
        }
        return 'from-slate-500/20';
    };

    const getTextColor = (status: string | undefined) => {
        if (!status) return 'text-gray-300';

        const normalizedStatus = status.toLowerCase();
        if (['clear', 'sunny'].includes(normalizedStatus)) {
            return 'text-amber-300';
        } else if (['rain', 'drizzle', 'shower'].some(condition => normalizedStatus.includes(condition))) {
            return 'text-blue-300';
        } else if (['cloudy', 'overcast'].includes(normalizedStatus)) {
            return 'text-slate-300';
        } else if (['thunderstorm', 'storm'].includes(normalizedStatus)) {
            return 'text-purple-300';
        } else if (['snow', 'sleet', 'blizzard'].includes(normalizedStatus)) {
            return 'text-sky-200';
        }
        return 'text-gray-300';
    };

    if (loading) {
        return (
            <div className="bg-gray-900/20 backdrop-blur-sm rounded-xl p-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (error || !conditions) {
        return (
            <div className="bg-gray-900/20 backdrop-blur-sm rounded-xl p-6">
                <p className="text-gray-400">{error || 'Unable to load weather data'}</p>
            </div>
        );
    }

    const backgroundColor = getBackgroundColor(conditions.status);
    const gradientColor = getGradientColor(conditions.status);

    return (
        <div className={`${backgroundColor} backdrop-blur-sm rounded-xl overflow-hidden`}>
            <div className={`bg-gradient-to-r ${gradientColor} to-transparent p-6`}>
                <div className="flex flex-col space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-6 h-6 text-amber-400" />
                        <h2 className={`text-xl font-bold ${getTextColor(conditions.status)}`}>Current Weather Status</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className={getTextColor(conditions.status)}>
                                {conditions?.location && conditions.location !== "Unknown" ? conditions.location : "Fetching location..."}
                            </span>
                            {conditions?.coordinates ? (
                                <span className="text-sm text-gray-400">
                                    ({conditions.coordinates.lat.toFixed(2)}°, {conditions.coordinates.lon.toFixed(2)}°)
                                </span>
                            ) : (
                                <span className="text-sm text-gray-400">Coordinates not available</span>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <span className={getTextColor(conditions.status)}>{formatDate(new Date())}</span>
                            <span className="text-sm text-amber-400">{formatTime(new Date())}</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`text-2xl font-bold ${getTextColor(conditions.status)} mb-2`}>{conditions.status}</h3>
                                <p className={`${getTextColor(conditions.status)}`}>Temperature: {conditions.temperature}°C</p>
                                <p className={`${getTextColor(conditions.status)}`}>Wind Speed: {conditions.windSpeed} km/h</p>
                                <p className={`${getTextColor(conditions.status)}`}>Humidity: {conditions.humidity}%</p>
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-lg p-4">
                            <h4 className={`font-semibold mb-2 ${getTextColor(conditions.status)}`}>Current Metrics</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span>Rainfall:</span>
                                    <span className={`${getTextColor(conditions.status)}`}>
                                        {conditions.rainfall > 0 && conditions.rainfallTime ? (
                                            <span className="text-xs ml-2">
                                                (Last recorded: {formatTime(new Date(conditions.rainfallTime))})
                                            </span>
                                        ) : (
                                            <span className="text-xs ml-2 text-gray-400">No recent rainfall data</span>
                                        )}
                                    </span>
                                </div>
                                <p>Visibility: {conditions.visibility} km</p>
                                <p>Air Quality: {conditions.airQuality}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className={`font-semibold mb-2 ${getTextColor(conditions.status)}`}>AI Recommendations:</h4>
                            <ul className="space-y-2">
                                {conditions.recommendations.length > 0 ? (
                                    conditions.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-center space-x-2 text-sm">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            <span className={`${getTextColor(conditions.status)}`}>{rec}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-gray-400">No recommendations available.</p>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="relative h-[300px] md:h-auto rounded-lg overflow-hidden">
                        {weatherImage ? (
                            <img
                                src={weatherImage}
                                alt={`Weather condition: ${conditions.status}`}
                                className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                onError={() => setWeatherImage(null)}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                                <p className="text-gray-400">No Image Available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CurrentConditions;
