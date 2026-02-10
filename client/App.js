import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from './src/stores/authStore';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import * as notificationService from './src/services/notificationService';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { setUser, setToken, user, token } = useAuthStore();

  useEffect(() => {
    bootstrapAsync();
    notificationService.initialize();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Try to restore token
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Failed to restore token', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
          }}
        >
          {token == null ? (
            <Stack.Screen
              name="Auth"
              component={AuthStack}
              options={{
                animationTypeForReplace: isLoading ? 'none' : 'pop',
              }}
            />
          ) : (
            <Stack.Screen
              name="App"
              component={AppStack}
              options={{
                animationTypeForReplace: 'pop',
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
