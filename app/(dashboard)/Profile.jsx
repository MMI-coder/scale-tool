import { StyleSheet, Text } from 'react-native'
import { useUser } from '../../Hooks/useUser'

import Spacer from "../../Components/Spacer"
import ThemedText from "../../Components/ThemedText"
import ThemedView from "../../Components/ThemedView"
import ThemedButton from "../../Components/ThemedButton"

const Profile = () => {
  const { logout } = useUser()

  return (
    <ThemedView style={styles.container}>

      <ThemedText title={true} style={styles.heading}>
        Your Email
      </ThemedText>
      <Spacer />

      <ThemedButton onPress={logout}>
        <Text style={{ color: '#ffffff' }}>Logout</Text>
      </ThemedButton>
      <Spacer />

      <ThemedText>Time to Scale the World!</ThemedText>
      <Spacer />



    </ThemedView>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 30,
    textAlign: "center",
  },
})