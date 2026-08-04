import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Colors } from '../Constants/Colors'

const RootLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
            }}>
                <Stack.Screen name="index" />
            </Stack>
        </>
    )
}

export default RootLayout