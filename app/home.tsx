import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DrawerLayoutAndroid } from 'react-native'
import menu from '../assets/images/menu.png'

const FLICKR_API_URL =
  'https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=20&page=1&api_key=6f102c62f41998d151e5a1b48713cf13&format=json&nojsoncallback=1&extras=url_s'

const Home = () => {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  const drawerRef = useRef<DrawerLayoutAndroid>(null) 

  const fetchImages = async () => {
    try {
      const response = await fetch(FLICKR_API_URL)
      const json = await response.json()
      const newPhotos = json.photos.photo

      const cachedPhotos = await AsyncStorage.getItem('cachedPhotos')

      if (!cachedPhotos || JSON.stringify(newPhotos) !== cachedPhotos) {
        await AsyncStorage.setItem('cachedPhotos', JSON.stringify(newPhotos))
        setPhotos(newPhotos) 
      } else {
        setPhotos(JSON.parse(cachedPhotos))
      }

      setLoading(false)
    } catch (err) {
      console.log('Error fetching images:', err)
      setError(true)
      setLoading(false)

      loadCachedImages()
    }
  }

  const loadCachedImages = async () => {
    const cachedPhotos = await AsyncStorage.getItem('cachedPhotos')
    if (cachedPhotos) {
      setPhotos(JSON.parse(cachedPhotos))
      setIsOffline(true) 
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages().catch(() => loadCachedImages())
  }, [])

  const renderImage = ({ item }: any) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.url_s }} style={styles.image} />
    </View>
  )

  const handleHomePress = () => {
    drawerRef.current?.closeDrawer() 
    Alert.alert('Home Pressed', 'You clicked the Home option!')
  }

  const navigationView = (
    <View style={styles.drawerContainer}>
      <Text style={styles.drawerTitle}>Menu</Text>
      <TouchableOpacity onPress={handleHomePress} style={styles.drawerItem}>
        <Text style={styles.drawerItemText}>Home</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={() => navigationView}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
            <Image source={menu} style={styles.menuIcon} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Image Gallery App</Text>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <ActivityIndicator size="large" color="green" />
      ) : error ? (
        <Text style={styles.errorText}>Error loading images. Please try again.</Text>
      ) : isOffline ? (
        <Text style={styles.offlineText}>You are viewing cached images</Text>
      ) : null}

      <FlatList
        data={photos}
        renderItem={renderImage}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.imageGrid}
      />
    </DrawerLayoutAndroid>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  imageGrid: {
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  header: {
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#eaeaea',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  menuIcon: {
    width: 30,
    height: 25,
    marginRight: 12,  
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6347',  
  },
  imageContainer: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 3,
    padding: 8,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  drawerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerItemText: {
    fontSize: 18,
    color: '#333',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    textAlign: 'center',
  },
  offlineText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
})
