import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../features/home/screens/HomeScreen';
import LibraryStack from './LibraryStack';
import CaptureScreen from '../features/documents/screens/CaptureScreen';
import SearchScreen from '../features/search/screens/SearchScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconsName; default: IoniconsName }> = {
  Home: { focused: 'home', default: 'home-outline' },
  Library: { focused: 'library', default: 'library-outline' },
  Capture: { focused: 'add-circle', default: 'add-circle-outline' },
  Search: { focused: 'search', default: 'search-outline' },
  Profile: { focused: 'person', default: 'person-outline' },
};

export default function MainTabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={focused ? icons.focused : icons.default}
                size={route.name === 'Capture' ? 28 : 22}
                color={focused ? colors.tabBarActive : colors.tabBarInactive}
              />
              {focused && route.name !== 'Capture' && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.tabBarActive,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          );
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryStack} />
      <Tab.Screen name="Capture" component={CaptureScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
