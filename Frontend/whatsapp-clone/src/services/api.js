// src/services/api.js me temporary direct URL daal kar check karo:
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://novaconnect-uowz.onrender.com/api/v1',
  withCredentials: true // Cookies ke liye yeh rehne dete hain
});

// 🚨 NAYA CODE: Yeh har request ke sath apka Token backend ko bhejega
API.interceptors.request.use(
  (config) => {
    // LocalStorage se apna token nikalo
    const token = localStorage.getItem('token');
    
    // Agar token hai, toh usko request ke Headers mein daal do
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;