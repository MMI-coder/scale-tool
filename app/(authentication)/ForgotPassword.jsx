import { StyleSheet, Text, Keyboard, TouchableWithoutFeedback, useWindowDimensions } from 'react-native'
import { Colors } from '../../Constants/Colors'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useUser } from '../../Hooks/useUser'

import ThemedView from '../../Components/ThemedView'
import ThemedText from '../../Components/ThemedText'
import Spacer from '../../Components/Spacer'
import ThemedButton from '../../Components/ThemedButton'
import ThemedTextInput from '../../Components/ThemedTextInput'
import ThemedLoader from '../../Components/ThemedLoader'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const router = useRouter()
    const { sendPasswordReset } = useUser()
    const { width } = useWindowDimensions()

    const handleSubmit = async () => {
        setError(null)
        Keyboard.dismiss()
        setLoading(true)
        try {
            await sendPasswordReset(email)
            setSent(true)
        } catch (error) {
            setError('Could not send reset email. Please check the address and try again.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <ThemedLoader />

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>

            <Spacer />
            <ThemedText title={true} style={[styles.title, { fontSize: width * 0.06}]}>
                Reset Your Password
            </ThemedText>

            {sent ? (
            <>
                <ThemedText style={styles.success}>
                    Check your email for a reset link. It expires in 1 hour.
                </ThemedText>
                <Spacer height={20} />
                <ThemedButton onPress={() => router.back()}>
                    <ThemedText style={{ textAlign: 'center' }}>Back to Login</ThemedText>
                </ThemedButton>
            </>
        ) : (
                <>
                    <ThemedTextInput
                        style={{ width: '80%', marginBottom: 20 }}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        onChangeText={setEmail}
                        value={email}
                    />

                    <ThemedButton onPress={handleSubmit}>
                        <Text style={{ color: '#ffffff' }}>Send Reset Email</Text>
                    </ThemedButton>

                    <Spacer height={100} />
                    <ThemedButton onPress={() => router.back()}>
                        <ThemedText style={{ textAlign: 'center' }}>Back to Login</ThemedText>
                    </ThemedButton>

                    {error && <Text style={styles.error}>{error}</Text>}
                </>
            )}

            <Spacer height={100} />

        </ThemedView>
        </TouchableWithoutFeedback>
    )
}

export default ForgotPassword

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
