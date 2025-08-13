import { useCallback, useState } from 'react';
import { useAuth } from '../components/AuthProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const useApi = () => {
  const { makeAuthenticatedRequest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeApiCall = useCallback(async (endpoint, method = 'GET', data = null, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        options.body = JSON.stringify(data);
      }

      console.log(`Making ${method} request to ${endpoint}`);

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api${endpoint}`, options);

      console.log('Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      // Handle successful responses
      if (response.status === 204 || !response.body) {
        if (method.toUpperCase() === 'DELETE') {
          return { status: 'success', message: 'Resource deleted successfully' };
        }
        return { status: 'success' };
      }

      if (!isJson) {
        const text = await response.text().catch(() => '');
        throw new Error(`Expected JSON response, but received: ${text || 'empty response'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      
      if (error.message === 'Session expired') {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(error.message);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  return { makeApiCall, loading, error };
};

export default useApi;