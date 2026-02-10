import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/app/HomeScreen';
import TasksScreen from '../screens/app/TasksScreen';
import MyApplicationsScreen from '../screens/app/MyApplicationsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';
import CreateTaskScreen from '../screens/app/CreateTaskScreen';
import TaskDetailScreen from '../screens/app/TaskDetailScreen';
import VolunteerDetailScreen from '../screens/app/VolunteerDetailScreen';
import ChatScreen from '../screens/app/ChatScreen';
import NotificationsScreen from '../screens/app/NotificationsScreen';
import EditProfileScreen from '../screens/app/EditProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Community Helper' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
      <Stack.Screen
        name="VolunteerDetail"
        component={VolunteerDetailScreen}
        options={{ title: 'Volunteer Details' }}
      />
    </Stack.Navigator>
  );
};

const TasksStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="TasksMain"
        component={TasksScreen}
        options={{ title: 'Available Tasks' }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ title: 'Create New Task' }}
      />
      <Stack.Screen
        name="TaskDetailFromList"
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
    </Stack.Navigator>
  );
};

const ApplicationsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="ApplicationsMain"
        component={MyApplicationsScreen}
        options={{ title: 'My Applications' }}
      />
      <Stack.Screen
        name="TaskDetailFromApp"
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Messages' }}
      />
    </Stack.Navigator>
  );
};

export default function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TasksTab') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'ApplicationsTab') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'bell' : 'bell-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksStackNavigator}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen
        name="ApplicationsTab"
        component={ApplicationsStackNavigator}
        options={{ title: 'Applications' }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
