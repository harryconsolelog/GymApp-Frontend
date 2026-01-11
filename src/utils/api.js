import { config } from '../config/config';
import { getToken } from './auth';

export const apiEndpoints = {
  workouts: {
    list: '/workouts',
    create: '/workouts',
    update: (id) => `/workouts/${id}`,
    delete: (id) => `/workouts/${id}`,
  },
  availability: {
    list: '/availability',
    create: '/availability',
    deleteSlot: (id, date) => `/availability/${id}/slot?date=${encodeURIComponent(date)}`,
  },
};

export const apiCall = async (endpoint, options = {}) => {
  // Get fresh API URL each time to ensure it's current
  const apiBaseUrl = config.apiBaseUrl;
  const fullUrl = `${apiBaseUrl}${endpoint}`;
  const token = await getToken();
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(fullUrl, {
      headers,
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    if (response.status === 204) {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Workout API functions
export const workoutAPI = {
  // Get all workout plans
  getAll: async () => {
    return apiCall(apiEndpoints.workouts.list, { method: 'GET' });
  },

  // Get single workout plan by ID
  getById: async (id) => {
    return apiCall(apiEndpoints.workouts.list + `/${id}`, { method: 'GET' });
  },

  // Create new workout plan
  create: async (data) => {
    return apiCall(apiEndpoints.workouts.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update existing workout plan
  update: async (id, data) => {
    return apiCall(apiEndpoints.workouts.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete workout plan
  delete: async (id) => {
    return apiCall(apiEndpoints.workouts.delete(id), { method: 'DELETE' });
  },
};

// Availability API functions
export const availabilityAPI = {
  // Get all availability records
  getAll: async () => {
    return apiCall(apiEndpoints.availability.list, { method: 'GET' });
  },

  // Create new availability
  create: async (data) => {
    return apiCall(apiEndpoints.availability.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete specific slot/date from availability
  deleteSlot: async (id, date) => {
    return apiCall(apiEndpoints.availability.deleteSlot(id, date), { method: 'DELETE' });
  },
};

