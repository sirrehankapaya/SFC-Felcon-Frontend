import { toast } from '../components/ui/Toast';

const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FALLBACK_BASE_URL = 'http://localhost:3000';

async function resolveBaseURL() {
    if (!ENV_BASE_URL) return FALLBACK_BASE_URL;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${ENV_BASE_URL}`, { 
            method: 'GET', 
            signal: controller.signal 
        });
        clearTimeout(timeout);
        if (res.ok) return ENV_BASE_URL;
    } catch (err) {
        console.warn('[apiClient] No backend responded at', ENV_BASE_URL, 'defaulting to', FALLBACK_BASE_URL);
    }
    return FALLBACK_BASE_URL;
}

let cachedBaseURL = null;
async function getBaseURL() {
    if (cachedBaseURL === null) {
        cachedBaseURL = await resolveBaseURL();
    }
    return cachedBaseURL;
}

class ApiClient {
    async request(endpoint, options = {}) {
        const baseURL = await getBaseURL();
        const url = `${baseURL}${endpoint}`;
        
        const headers = {
            'Accept': 'application/json',
            ...options.headers,
        };

        if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        options.headers = headers;
        options.credentials = 'include';

        try {
            const response = await fetch(url, options);
            
            if (response.status === 401) {
                localStorage.removeItem('smartsociety_session');
                window.dispatchEvent(new CustomEvent('session-expired'));
                throw new Error('Session expired. Please login again.');
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                return await response.blob();
            }

            const text = await response.text();
            let data = {};

            if (text) {
                const trimmed = text.trim();
                if (trimmed.startsWith('<')) {
                    throw new Error('The API server is not responding correctly. Please start the backend on http://localhost:5000.');
                }
                try {
                    data = JSON.parse(trimmed);
                } catch (parseErr) {
                    throw new Error('Unexpected response from the server. Please check the backend connection.');
                }
            }
            
            if (response.ok && data.status !== false) {
                return data;
            } else {
                const errorMsg = data.message || 'An error occurred during request';
                toast('error', errorMsg);
                throw new Error(errorMsg);
            }
        } catch (err) {
            if (err.message && !err.message.includes('Session expired')) {
                toast('error', err.message || 'Network connection failed');
            }
            throw err;
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
