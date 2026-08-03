import { StyleSheet, Text, Keyboard, TouchableWithoutFeedback, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../Constants/Colors'
import { useState } from 'react'

//Themed components
import ThemedView from '../../Components/ThemedView'
import ThemedText from '../../Components/ThemedText'
import Spacer from '../../Components/Spacer'
import ThemedButton from '../../Components/ThemedButton'
import ThemedTextInput from '../../Components/ThemedTextInput'
import ThemedLoader from '../../Components/ThemedLoader'
import { useUser } from '../../Hooks/useUser'

const Login = () => {
    const [email, setEmail] = useState ('')
    const [password, setPassword] = useState ('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { width } = useWindowDimensions()

    const { login } = useUser()

    const handleSubmit = async () => {
        setError(null)
        Keyboard.dismiss()
        setLoading(true)
        try {
            await login(email, password)
      } catch (error) {
        setError(error.message)
      } finally {
            setLoading(false)
      }
    }
  
    if (loading) return <ThemedLoader />
return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ThemedView style={styles.container}>

        <Spacer />
        <ThemedText title={true} style={[styles.title, { fontSize: width * 0.06 }]}>
            Login to Your Account
        </ThemedText>

        <ThemedTextInput 
        style={{ width: '80%', marginBottom: 20 }}
        placeholder="Enter Email"
        keyboardType="email-address" 
        onChangeText={setEmail}
        value={email}
        />

        <ThemedTextInput 
        style={{ width: '80%', marginBottom: 20 }}
        placeholder="Enter Password" 
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        />

        <ThemedButton onPress={handleSubmit}>
            <Text style={{ color: '#ffffff' }}>Login</Text>
        </ThemedButton>

        <ThemedButton onPress={() => router.push('/ForgotPassword')}>
            <ThemedText style={{ textAlign: 'center' }}>
                Forgot Password?
            </ThemedText>
        </ThemedButton>

        <Spacer />
        {error && <Text style={styles.error}>{error}</Text>}

        <Spacer height={80}/>
        <ThemedButton onPress={() => router.push('/Register')}>
            <ThemedText style={{ textAlign: 'center' }}>
                Register Instead
            </ThemedText>
        </ThemedButton>

    </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        textAlign: "center",
        marginBottom: 30
    },
    error: {
        color: Colors.warning,
        padding: 10,
        backgroundColor: '#f5c1c8',
        borderColor: Colors.warning,
        borderWidth: 1,
        borderRadius: 6,
        marginHorizontal: 10,
    }
})