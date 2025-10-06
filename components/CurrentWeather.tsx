import Image from 'next/image';

// Use a type for the props to ensure we receive the correct data
interface CurrentWeatherProps {
  data: {
    name: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
  };
}

const CurrentWeather = ({ data }: CurrentWeatherProps) => {
  if (!data) return null;

  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">{data.name}</h2>
          <p className="text-gray-400 capitalize">{data.weather[0].description}</p>
        </div>
        <div className="text-5xl font-bold">
          {Math.round(data.main.temp)}°
        </div>
      </div>
      <div className="flex items-center justify-center -mt-4">
        <Image src={iconUrl} alt={data.weather[0].main} width={100} height={100} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center mt-4">
        <div className="p-2">
          <p className="text-gray-400">Feels Like</p>
          <p className="text-xl font-semibold">{Math.round(data.main.feels_like)}°</p>
        </div>
        <div className="p-2">
          <p className="text-gray-400">Humidity</p>
          <p className="text-xl font-semibold">{data.main.humidity}%</p>
        </div>
        <div className="p-2">
          <p className="text-gray-400">Wind Speed</p>
          <p className="text-xl font-semibold">{data.wind.speed.toFixed(1)} m/s</p>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather;