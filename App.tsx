import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CarerDashboard from './src/screens/CarerDashboard';
import DependantDashboard from './src/screens/DependantDashboard';
import { User } from './src/types';
import NotificationService from './src/services/notificationService';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    checkAuthState();
    setupNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userString = await AsyncStorage.getItem('user');
      
      if (token && userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupNotifications = async () => {
    // Request notification permissions
    const hasPermission = await NotificationService.requestPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive medication reminders.',
        [{ text: 'OK' }]
      );
    }

    // Set up notification listeners
    notificationListener.current = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle notification received while app is open
      }
    );

    responseListener.current = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        // Handle user tapping on notification
        const data = response.notification.request.content.data;
        if (data?.type === 'medication_reminder') {
          // Could navigate to specific medication or show alert
          Alert.alert(
            'Medication Reminder',
            `Time to take your ${data.medicationName}!`,
            [{ text: 'OK' }]
          );
        }
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={
          user
            ? user.role === 'carer'
              ? 'CarerDashboard'
              : 'DependantDashboard'
            : 'Login'
        }
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CarerDashboard" component={CarerDashboard} />
        <Stack.Screen name="DependantDashboard" component={DependantDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
