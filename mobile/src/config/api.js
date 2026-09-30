import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Android emulator, localhost is 10.0.2.2; on iOS simulator it is localhost; on physical device configure with LAN IP.
export const DEFAULT_API_HOST = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

export const SOCKET_HOST = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const API_STORAGE_KEY = '@civicresolve_api_url';
export const TOKEN_STORAGE_KEY = '@civicresolve_token';
export const USER_STORAGE_KEY = '@civicresolve_user';

const apiClient = axios.create({
  baseURL: DEFAULT_API_HOST,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Token and custom base URL if configured
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const storedUrl = await AsyncStorage.getItem(API_STORAGE_KEY);
      if (storedUrl) {
        config.baseURL = storedUrl;
      }
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading from AsyncStorage in request interceptor', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network request failed. Please check your connection.';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
