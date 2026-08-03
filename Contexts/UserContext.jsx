import { createContext, useState, useEffect } from 'react'
import { account } from '../lib/appwrite'
import { ID } from "react-native-appwrite"

export const UserContext = createContext ()

export function UserProvider ({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
        useEffect(() => {
            account.get()
                .then(response => setUser(response))
                .catch(() => setUser(null))
                .finally(() => setLoading(false))
        }, [])

    async function login(email, password) {
        try {
          await account.createEmailPasswordSession({ email, password })
          const response = await account.get()
          setUser(response)
        } catch (error) {
            console.log(error.message)
        if (error.message.includes('session is active')) {
             throw new Error('You are already logged in.')
        } else if (error.message.includes('Invalid credentials')) {
             throw new Error('Incorrect email or password.')
        } else {
             throw new Error('Something went wrong. Please try again.')
            }
        }
    }

    async function register(email, password) {
        try {
          await account.create({ userId: ID.unique(), email, password })
          await login(email, password)
    } catch (error) {
        console.log(error.message)
        if (error.message.includes('user with the same email')) {
            throw new Error('An account with that email already exists.')
        } else if (error.message.includes('Value must be a valid email')) {
            throw new Error('Please enter a valid email address.')
        } else if (error.message.includes('You are already logged in') || 
               error.message.includes('Incorrect email or password')) {
            throw new Error(error.message)
        } else {
            throw new Error('Something went wrong. Please try again.')
        }
    }   

}

    async function logout() {
        await account.deleteSession({ sessionId: "current" })
        setUser(null)
    }

    async function sendPasswordReset(email){
        const redirectUrl = 'exp://localhost:8801/(authentication)/ResetPassword'
        await account.createRecovery({ email, url: redirectUrl })
    }
    async function confirmPasswordReset(userId, secret, newPassword) {
        await account.updateRecovery({ userId, secret, password: newPassword })
    }

    return (
        <UserContext.Provider value={{ user, loading, login, register, logout, sendPasswordReset, confirmPasswordReset }}>
            {children}
        </UserContext.Provider>
    )
}