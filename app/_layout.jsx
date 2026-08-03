import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { useEffect } from 'react'
import { Colors } from '../Constants/Colors'
import { StatusBar } from 'expo-status-bar'
import { ping } from '../lib/appwrite'
import { UserProvider } from '../Contexts/UserContext'

const RootLayout = () => {
    const colorScheme = useColorScheme ()
    const theme= Colors[colorScheme] ?? Colors.light
    console.log(colorScheme)

    useEffect(() => {
        ping()
    }, [])

    return (
        <UserProvider>
            <StatusBar style="auto" />
                <Stack screenOptions={{
                    headerStyle: { backgroundColor: theme.navBackground },
                    headerTintColor: theme.title,
                    contentStyle: { backgroundColor: theme.background },
                }}>
                    <Stack.Screen name="(authentication)" options={{ headerShown: false }} />
                    <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
                    <Stack.Screen name="home" options={{ headerShown: false }}/>
                </Stack>
        </UserProvider>
    )
}

export default RootLayout