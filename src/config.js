import ports from './ports.json';

export const FRONTEND_PORT = ports.frontendPort;
export const BACKEND_PORT = ports.backendPort;
export const ACT_SESSION_TIMEOUT_MINUTES = ports.activesessiontimeout;
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
export const OPENAI_API_KEY = "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"; // Replace with your actual OpenAI API key
