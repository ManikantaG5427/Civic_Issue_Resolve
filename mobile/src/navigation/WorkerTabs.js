import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WorkerTaskQueueScreen from '../screens/worker/WorkerTaskQueueScreen';
import PublicMapScreen from '../screens/common/PublicMapScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import { colors } from '../config/theme';
import { HardHat, Map, Bell, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

const WorkerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.warningLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="WorkerQueue"
        component={WorkerTaskQueueScreen}
        options={{
          tabBarLabel: 'Field Tasks',
          tabBarIcon: ({ color, size }) => <HardHat size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerMap"
        component={PublicMapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => <Map size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerNotifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Crew Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default WorkerTabs;
