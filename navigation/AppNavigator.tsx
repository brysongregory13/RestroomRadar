import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import {
  RootStackParamList,
  TabParamList,
  AuthStackParamList,
  ExploreStackParamList,
  AddStackParamList,
  RouteStackParamList,
} from './types';

import { useAuthContext } from '../context/AuthContext';

import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { MapScreen } from '../screens/explore/MapScreen';
import { ListScreen } from '../screens/explore/ListScreen';
import { DetailScreen } from '../screens/explore/DetailScreen';
import { ReportScreen } from '../screens/explore/ReportScreen';
import { SuggestEditScreen } from '../screens/explore/SuggestEditScreen';
import { AuthGateScreen } from '../screens/add/AuthGateScreen';
import { AddRestroomScreen } from '../screens/add/AddRestroomScreen';
import { ConfirmScreen } from '../screens/add/ConfirmScreen';
import { RoutePlannerScreen } from '../screens/route/RoutePlannerScreen';
import { ProfileScreen } from '../screens/modals/ProfileScreen';
import { SettingsScreen } from '../screens/modals/SettingsScreen';

import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const AddStack = createNativeStackNavigator<AddStackParamList>();
const RouteStack = createNativeStackNavigator<RouteStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: Theme.typography.weightBold },
      }}
    >
      <ExploreStack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      <ExploreStack.Screen name="List" component={ListScreen} options={{ headerShown: false }} />
      <ExploreStack.Screen name="Detail" component={DetailScreen} options={{ title: 'Restroom Detail' }} />
      <ExploreStack.Screen name="Report" component={ReportScreen} options={{ title: 'Report Issue' }} />
      <ExploreStack.Screen name="SuggestEdit" component={SuggestEditScreen} options={{ title: 'Suggest Edit' }} />
    </ExploreStack.Navigator>
  );
}

function AddNavigator() {
  const { user } = useAuthContext();
  return (
    <AddStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <AddStack.Screen name="AddRestroom" component={AddRestroomScreen} />
          <AddStack.Screen name="Confirm" component={ConfirmScreen} />
        </>
      ) : (
        <AddStack.Screen name="AuthGate" component={AuthGateScreen} />
      )}
    </AddStack.Navigator>
  );
}

function RouteNavigator() {
  return (
    <RouteStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: Theme.typography.weightBold },
      }}
    >
      <RouteStack.Screen name="RoutePlanner" component={RoutePlannerScreen} options={{ title: 'Route Planner' }} />
      <RouteStack.Screen name="Detail" component={DetailScreen as any} options={{ title: 'Restroom Detail' }} />
    </RouteStack.Navigator>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: Theme.typography.weightSemibold,
        },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <TabIcon emoji="🗺️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddNavigator}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ color }) => <TabIcon emoji="➕" color={color} />,
        }}
      />
      <Tab.Screen
        name="Route"
        component={RouteNavigator}
        options={{
          tabBarLabel: 'Route',
          tabBarIcon: ({ color }) => <TabIcon emoji="🧭" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
        <RootStack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <RootStack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
