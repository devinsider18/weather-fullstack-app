export interface DailyWeather {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}
export interface HourlyWeather {
  dt: number;
  temp: number;
  icon: string;
}
export interface WeatherData {
  city: string;
  hourly: HourlyWeather[];
  daily: DailyWeather[]; 
}
export interface ApiError {
  error: string;
}