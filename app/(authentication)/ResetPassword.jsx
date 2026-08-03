import { StyleSheet, Text, Keyboard, TouchableWithoutFeedback, useWindowDimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../Constants/Colors'
import { useState } from 'react'
import { useUser } from '../../Hooks/useUser'

import ThemedView from '../../Components/ThemedView'
import ThemedText from '../../Components/ThemedText'
import Spacer from '../../Components/Spacer'
import ThemedButton from '../../Components/ThemedButton'
import ThemedTextInput from '../../Components/ThemedTextInput'

const ResetPassword = () => {
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [done, setDone] = useState(false)
    const router = useRouter()
    const { width } = useWindowDimensions()

    // Read the userId and secret that Appwrite attached to the link in the email
    const { userId, secret } = useLocalSearchParams()

    const { confirmPasswordReset } = useUser()

    const handleSubmit = async () => {
        setError(null)
        Keyboard.dismiss()
        try {
            await confirmPasswordReset(userId, secret, password)
            setDone(true)
        } catch (error) {
            setError('Could not reset password. Your link may have expired. Please request a new one.')
        }
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>

            <Spacer />
            <ThemedText title={true} style={[styles.title, { fontSize: width * 0.06 }]}>
                Set a New Password
            </ThemedText>

            {done ? (
                <>
                    <ThemedText style={styles.success}>
                        Password updated! You can now log in with your new password.
                    </ThemedText>
                    <Spacer />
                    <ThemedButton onPress={() => router.replace('/Login')}>
                        <Text style={{ color: '#ffffff' }}>Go to Login</Text>
                    </ThemedButton>
                </>
            ) : (
                <>
                    <ThemedTextInput
                        style={{ width: '80%', marginBottom: 20 }}
                        placeholder="Enter new password"
                        onChangeText={setPassword}
                        value={password}
                        secureTextEntry
                    />

                    <ThemedButton onPress={handleSubmit}>
                        <Text style={{ color: '#ffffff' }}>Save New Password</Text>
                    </ThemedButton>

                    {error && <Text style={styles.error}>{error}</Text>}
                </>
            )}

            <Spacer height={100} />

        </ThemedView>
        </TouchableWithoutFeedback>
    )
}

export default ResetPassword

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
    },
    success: {
        textAlign: 'center',
        marginHorizontal: 30,
        color: 'green',
    },
    error: {
        color: Colors.warning,
        padding: 10,
        backgroundColor: '#f5c1c8',
        borderColor: Colors.warning,
        borderWidth: 1,
        borderRadius: 6,
        marginHorizontal: 10,
        marginTop: 15,
    },
})
