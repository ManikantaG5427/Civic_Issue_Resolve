import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CitizenHomeScreen from '../screens/citizen/CitizenHomeScreen';
import ReportIssueScreen from '../screens/citizen/ReportIssueScreen';
import PublicMapScreen from '../screens/common/PublicMapScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import { colors } from '../config/theme';
import { Home, PlusCircle, Map, Bell, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

const CitizenTabs = () => {
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
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="CitizenHome"
        component={CitizenHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReportIssue"
        component={ReportIssueScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="PublicMap"
        component={PublicMapScreen}
        options={{
          tabBarLabel: 'City Map',
          tabBarIcon: ({ color, size }) => <Map size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default CitizenTabs;
