import { config } from '../config/config';

export const authEndpoints = {
  google: '/auth/google',
};

export const authenticateWithGoogle = async (googleToken, userInfo = null) => {
  try {
    const url = `${config.apiBaseUrl}${authEndpoints.google}`;

    const requestBody = {
      googleToken,
    };
    
    if (userInfo) {
      requestBody.userInfo = userInfo;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth API error:', error);
    throw error;
  }
};


