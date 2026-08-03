import { Client, Account } from 'react-native-appwrite'

export const client = new Client()
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setPlatform('com.mmi.scaleconversiontool')

export const account = new Account(client)

export const ping = async () => {
    try {
        await account.get()
        console.log('Appwrite: connection OK')
    } catch (error) {
        if (error.code === 401) {
            console.log('Appwrite: connection OK (not authenticated)')
        } else {
            console.error('Appwrite: connection failed', error)
        }
    }
}
