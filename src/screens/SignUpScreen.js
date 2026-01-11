import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authenticateWithGoogle } from '../utils/authAPI';
import { storeToken, storeUser } from '../utils/auth';
import { config } from '../config/config';

WebBrowser.maybeCompleteAuthSession();

const SignUpScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  // Try to import runtime config (generated at build time)
  // This file is created by scripts/inject-env.js during build
  let runtimeConfig = null;
  try {
    const runtimeConfigModule = require('../config/runtimeConfig');
    runtimeConfig = runtimeConfigModule?.runtimeConfig || null;
  } catch (e) {
    // Runtime config not available (development or first build)
    runtimeConfig = null;
  }

  const getRedirectUri = () => {
    if (Platform.OS === 'web') {
      // For web, try multiple sources in order of priority:
      // 1. Runtime config (injected at build time)
      // 2. process.env (works in development)
      // 3. window.location (fallback)
      return (
        (runtimeConfig && runtimeConfig.oauthRedirectUri) ||
        process.env.REACT_APP_OAUTH_REDIRECT_URI || 
        (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '')
      );
    }
    // For mobile, use custom scheme
    return AuthSession.makeRedirectUri({
      useProxy: false,
      scheme: 'wellvantage',
    });
  };

  const redirectUri = getRedirectUri();

  // For web, we'll use Token response type to get access token directly (implicit flow)
  // This avoids the need to manually exchange authorization code
  // Note: Google still supports implicit flow for web, though authorization code flow is preferred
  const responseType = Platform.OS === 'web' 
    ? AuthSession.ResponseType.Token  // Implicit flow - get token directly
    : AuthSession.ResponseType.Code;   // Authorization code flow with PKCE for mobile

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.googleClientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: responseType,
      redirectUri,
      usePKCE: responseType === AuthSession.ResponseType.Code, // Only use PKCE with Code flow
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const handleSignInSuccess = async () => {
        try {
          setIsLoading(true);
          
          const accessToken = response.params?.access_token || response.params?.id_token;
          
          if (!accessToken) {
            Alert.alert('Error', 'Failed to get access token from Google');
            setIsLoading(false);
            return;
          }
          
          let userInfo = null;
          try {
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
            
            if (userInfoResponse.ok) {
              const googleUserData = await userInfoResponse.json();
              userInfo = {
                id: googleUserData.id,
                email: googleUserData.email,
                name: googleUserData.name,
                picture: googleUserData.picture,
              };
            }
          } catch (error) {
            // Silently continue if user info fetch fails
          }
          
          const authResult = await authenticateWithGoogle(accessToken, userInfo);
        
          if (authResult.token) {
            await storeToken(authResult.token);
          }
          
          if (authResult.user) {
            await storeUser(authResult.user);
          }
          
          navigation.replace('WorkoutManagement');
        } catch (error) {
          Alert.alert('Error', error.message || 'Authentication failed');
          setIsLoading(false);
        }
      };
      
      handleSignInSuccess();
    } else if (response?.type === 'error') {
      const errorMessage = response.error?.message || response.params?.error_description || 'Google sign in failed';
      Alert.alert('Error', `Google sign in failed: ${errorMessage}`);
      setIsLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsLoading(false);
    }
  }, [response, navigation]);

  const handleGoogleSignIn = async () => {
    if (!config.googleClientId) {
      Alert.alert('Error', 'Google Client ID not configured');
      return;
    }

    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      Alert.alert('Error', `Sign in failed: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>

        <Text style={styles.welcomeText}>
          Welcome! Manage, Track and Grow your Gym with WellVantage.
        </Text>

        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <View style={styles.googleButtonContent}>
            <View style={styles.googleLogo}>
              <Image 
                source={require('../../assets/images/google-logo.png')} 
                style={{ width: 24, height: 24 }} 
              />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    minHeight: '100%',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: '600',
    lineHeight: 35,
    textAlign: 'center',
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
});

export default SignUpScreen;

