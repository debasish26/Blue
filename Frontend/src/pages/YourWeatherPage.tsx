import { FloodMap } from '../components/FloodMap';

function YourWeatherPage() {
  return (
    <div>
      {/* Your existing weather content */}
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">Flood Map</h2>
        <FloodMap />
      </div>
      {/* More weather content */}
    </div>
  );
}

export default YourWeatherPage;
