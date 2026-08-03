import { Stack, Redirect } from 'expo-router'
import { useColorScheme } from 'react-native'
import { useUser } from '../../Hooks/useUser'
import { Colors } from '../../Constants/Colors'

export default function AuthenticationLayout() {

    const { user } = useUser()
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    
    if (user) return <Redirect href="/(dashboard)/Profile" />

    return (
        <>
        <Stack 
            screenOptions={{ 
                animation: "none", 
                contentStyle: { backgroundColor: theme.background },
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.title,
            }}
        >
            <Stack.Screen name="Login" options={{ headerBackVisible: false }} />
            <Stack.Screen name="Register" options={{ headerBackVisible: false }} />
            <Stack.Screen name="ForgotPassword" options={{ title: 'Forgot Password', headerBackVisible: false }} />
        </Stack>
    </>
    )
}