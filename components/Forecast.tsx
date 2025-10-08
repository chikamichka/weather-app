import Image from 'next/image';

// Define and export the type for a single forecast day item
export interface ForecastDay {
  dt: number;
  main: {
    temp_min: number;
    temp_max: number;
  };
  weather: {
    icon: string;
    main: string;
  }[];
}

// Export the props type
export interface ForecastProps {
  data: ForecastDay[];
}

const Forecast = ({ data }: ForecastProps) => {
  if (!data || data.length === 0) return null;
  
  const getDayOfWeek = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">5-Day Forecast</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {data.slice(0, 5).map((day) => {
          const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
          return (
            <div key={day.dt} className="flex flex-col items-center bg-gray-700/60 p-3 rounded-md text-center">
              <p className="font-semibold">{getDayOfWeek(day.dt)}</p>
              <Image src={iconUrl} alt={day.weather[0].main} width={50} height={50} unoptimized />
              <div className="flex gap-2">
                <p className="font-bold">{Math.round(day.main.temp_max)}°</p>
                <p className="text-gray-400">{Math.round(day.main.temp_min)}°</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Forecast;