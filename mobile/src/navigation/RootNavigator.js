import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../config/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CitizenTabs from './CitizenTabs';
import WorkerTabs from './WorkerTabs';
import IssueDetailScreen from '../screens/citizen/IssueDetailScreen';
import WorkerTaskActionScreen from '../screens/worker/WorkerTaskActionScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        ) : (
          // Authenticated Stack
          <Stack.Group>
            {user?.role === 'field_worker' ? (
              <Stack.Screen name="WorkerMain" component={WorkerTabs} />
            ) : (
              <Stack.Screen name="CitizenMain" component={CitizenTabs} />
            )}

            {/* Shared Detail / Modal Screens */}
            <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
            <Stack.Screen name="WorkerTaskAction" component={WorkerTaskActionScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigator;
