import axios from 'axios';

// Security rationale:
// HTTP-only cookies (jwtToken) are immune to XSS since JS cannot read them.
// withCredentials:true tells the browser to send the cookie on every cross-origin request.
// In production, VITE_API_URL must point to your Render backend URL.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
