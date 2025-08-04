import { useCallback, useState } from 'react';
import { useAuth } from '../components/AuthProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const useApi = () => {
  const { getHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeApiCall = useCallback(async (endpoint, method = 'GET', data = null, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getHeaders();
      const options = {
        method,
        credentials: 'include',
        headers,
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        options.body = JSON.stringify(data);
      }

      console.log(`Making ${method} request to ${endpoint}`, { headers: options.headers });

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, options);

      console.log('Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (response.status === 403 && retryCount < 1) {
        console.log('CSRF token may be invalid, refreshing and retrying...');
        const freshHeaders = await getHeaders();
        const retryOptions = { ...options, headers: freshHeaders };
        return makeApiCall(endpoint, method, data, retryCount + 1);
      }

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        if (isJson) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text().catch(() => '');
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204 || !response.body) {
        if (method.toUpperCase() === 'DELETE') {
          return { status: 'success', message: 'Resource deleted successfully' };
        }
        throw new Error('Empty response received from server');
      }

      if (!isJson) {
        const text = await response.text().catch(() => '');
        throw new Error(`Expected JSON response, but received: ${text || 'empty response'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return { makeApiCall, loading, error };
};

export default useApi;