import { Tabs, Redirect } from 'expo-router'
import { useUser } from '../../Hooks/useUser'
import { useColorScheme, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../Constants/Colors'
import { Ionicons } from '@expo/vector-icons'

export default function Dashboard() {

    const { user } = useUser()

    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const insets = useSafeAreaInsets()
    const { width } = useWindowDimensions()

    if (!user) return <Redirect href="/home" />

    const isTablet = width >= 768
    const iconSize = isTablet ? 28 : 24
    const tabBarHeight = 60 + insets.bottom

    return (
       <Tabs
            screenOptions={{ headerShown: false,
            tabBarStyle: {
                backgroundColor: theme.navBackground,
                paddingTop: 10,
                paddingBottom: insets.bottom,
                height: tabBarHeight
            },
            tabBarActiveTintColor: theme.iconColorFocused,
            tabBarInactiveTintColor: theme.iconColor
            }}

        >
          <Tabs.Screen
            name="Profile"
            options={{ title: 'Settings', tabBarIcon: ({ focused }) => (
              <Ionicons
              size={iconSize}
              name={focused ? 'settings' : 'settings-outline'}
              color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ) }}
          />

          <Tabs.Screen
            name="NewProject"
            options={{ title: 'New Project', tabBarIcon: ({ focused }) => (
              <Ionicons
              size={iconSize}
              name={focused ? 'add-circle' : 'add-circle-outline'}
              color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ) }}
          />

          <Tabs.Screen
            name="SavedProjects"
            options={{ title: 'Saved Projects', tabBarIcon: ({ focused }) => (
              <Ionicons
              size={iconSize}
              name={focused ? 'folder-open' : 'folder-outline'}
              color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ) }}
          />
        </Tabs>

    )
}