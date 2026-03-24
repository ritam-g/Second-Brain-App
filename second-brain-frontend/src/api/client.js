import axios from 'axios';

// BENEFIT OF THIS SETUP:
// We removed token interceptors because tokens stored in localStorage are heavily vulnerable to XSS (Cross-Site Scripting) attacks.
// By setting `withCredentials: true`, Axios automatically attaches secure HTTP-only cookies (like our `jwtToken`) to every network request.
// This means the browser manages the active token natively, and maliciously injected scripts cannot access it.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
