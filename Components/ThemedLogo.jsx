import { Image, useColorScheme } from 'react-native'

//logo images
import DarkIcon from "../assets/logos/icon-dark.png"
import LightIcon from "../assets/logos/icon-light.png"

const ThemedLogo = ({ ...props }) => {
    const colorScheme = useColorScheme ()
    const logo = colorScheme === 'dark' ? DarkIcon : LightIcon

    return (
        <Image source= {logo} {...props}/>
  )
}

export default ThemedLogo