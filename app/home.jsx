import { StyleSheet, useWindowDimensions } from 'react-native'
import { Link, Redirect } from 'expo-router'
import { useUser } from '../Hooks/useUser'

//Themed components
import ThemedView from '../Components/ThemedView'
import ThemedLogo from '../Components/ThemedLogo'
import ThemedText from '../Components/ThemedText'
import ThemedLoader from '../Components/ThemedLoader'
import Spacer from '../Components/Spacer'

const Home = () => {
  const { user, loading } = useUser()
  const { width } = useWindowDimensions()
  if (loading) return <ThemedLoader />
  if (user) return <Redirect href="/(dashboard)/Profile" />
  const titleFontSize = width < 768 ? 32 : 60
  const logoSize = width < 768 ? 300 : 500
  

  return (
    <ThemedView style={styles.container}>

        <ThemedLogo style={[styles.logoicon, { width: logoSize, height: logoSize }]}/>

      <Spacer height= {15}/>

      <ThemedText style={[styles.title, { fontSize: titleFontSize }]}>Scale Conversion Tool</ThemedText>

      <Spacer height= {15}/>
      
      <ThemedText style={styles.subtitle}>The Real World in Miniature</ThemedText>

      <Spacer height= {20}/>

      <Link href="/Login">
      <ThemedText>Login</ThemedText>
      </Link>

      <Spacer height= {20}/>

      <Link href="/Register">
      <ThemedText>Register</ThemedText>
      </Link>

    </ThemedView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    textDecorationLine: 'underline', 
  },

  logoicon: {                                                                  
    resizeMode: 'contain',
    marginVertical: 20
  }
  
})