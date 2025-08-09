import ports from './ports.json';

export const FRONTEND_PORT = ports.frontendPort;
export const BACKEND_PORT = ports.backendPort;
export const ACT_SESSION_TIMEOUT_MINUTES = ports.activesessiontimeout;
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
export const OPENAI_API_KEY = ""; // Replace with your actual OpenAI API key
