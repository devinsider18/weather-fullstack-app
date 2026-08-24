import type { WeatherData, ApiError } from '../types/weather';
const API_BASE_URL = 'http://localhost:4000';
export const getWeather = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/weather?city=${city}`);
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Помилка сервера');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Невідома помилка');
  }
};