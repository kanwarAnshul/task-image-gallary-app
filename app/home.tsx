import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DrawerLayoutAndroid } from 'react-native'
import { Snackbar } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import menu from '../assets/images/menu.png'

const FLICKR_API_URL =
  'https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=6f102c62f41998d151e5a1b48713cf13&format=json&nojsoncallback=1&extras=url_s'

const FLICKR_SEARCH_API_URL =
  'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=6f102c62f41998d151e5a1b48713cf13&format=json&nojsoncallback=1&extras=url_s&text='

const Home = () => {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)
  const [retryVisible, setRetryVisible] = useState(false)
  const drawerRef = useRef<DrawerLayoutAndroid>(null)
  const navigation = useNavigation()

  const fetchImages = async (newPage: number) => {
    setLoading(true)
    setError(false)

    try {
      const response = await fetch(`${FLICKR_API_URL}&page=${newPage}&per_page=20`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const json = await response.json()
      const newPhotos = json.photos.photo

      if (newPage === 1) {
        setPhotos(newPhotos) // On first load, replace photos
      } else {
        setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]) // On pagination, append new photos
      }

      await AsyncStorage.setItem('cachedPhotos', JSON.stringify(newPhotos))
    } catch (err) {
      console.error('Error fetching images:', err)
      setError(true)
      setRetryVisible(true)
      loadCachedImages()
    } finally {
      setLoading(false)
    }
  }

  const loadCachedImages = async () => {
    const cachedPhotos = await AsyncStorage.getItem('cachedPhotos')
    if (cachedPhotos) {
      setPhotos(JSON.parse(cachedPhotos))
    }
  }

  const handleRetry = () => {
    setRetryVisible(false)
    fetchImages(page)
  }

  useEffect(() => {
    fetchImages(page).catch(() => loadCachedImages())
  }, [page])

  const renderImage = ({ item }: any) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.url_s }} style={styles.image} />
    </View>
  )

  const loadMoreImages = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setPage((prevPage) => prevPage + 1)
    } else {
      setPage((prevPage) => (prevPage > 1 ? prevPage - 1 : 1))
    }
  }

  const handleSearchPress = () => {
    drawerRef.current?.closeDrawer()
    navigation.navigate('Search')
  }

  const navigationView = (
    <View style={styles.drawerContainer}>
      <Text style={styles.drawerTitle}>Menu</Text>
      <TouchableOpacity onPress={handleSearchPress} style={styles.drawerItem}>
        <Text style={styles.drawerItemText}>Search</Text>
      </TouchableOpacity>
    </View>
  )

  const PaginationButtons = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.paginationButton, page === 1 && styles.disabledButton]}
        onPress={() => loadMoreImages('prev')}
        disabled={page === 1}
      >
        <Text style={styles.paginationText}>Previous</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.paginationButton} onPress={() => loadMoreImages('next')}>
        <Text style={styles.paginationText}>Next</Text>
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
            <Image source={menu} style={styles.menuIcon} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Image Gallery App</Text>
        </View>
      </View>

      {loading && !photos.length ? (
        <ActivityIndicator size="large" color="green" />
      ) : error ? (
        <Text style={styles.errorText}>Error loading images. Please try again.</Text>
      ) : null}

      <FlatList
        data={photos}
        renderItem={renderImage}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.imageGrid}
        ListFooterComponent={loading ? <ActivityIndicator size="small" color="green" /> : <PaginationButtons />}
      />

      <Snackbar
        visible={retryVisible}
        onDismiss={() => setRetryVisible(false)}
        action={{ label: 'Retry', onPress: handleRetry }}
      >
        Network error. Please try again.
      </Snackbar>
    </DrawerLayoutAndroid>
  )
}

// Search component
const Search = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const navigation = useNavigation()

  const handleSearch = async () => {
    setLoading(true)
    setError(false)

    try {
      const response = await fetch(`${FLICKR_SEARCH_API_URL}${searchTerm}`)
      const json = await response.json()
      setSearchResults(json.photos.photo)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const renderImage = ({ item }: any) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.url_s }} style={styles.image} />
    </View>
  )

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search images..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        onSubmitEditing={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="green" />
      ) : error ? (
        <Text style={styles.errorText}>Error loading images. Please try again.</Text>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderImage}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
        />
      )}
    </View>
  )
}

const Stack = createStackNavigator()

const App = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={Search} />
    </Stack.Navigator>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  imageGrid: {
    justifyContent: 'center',
    paddingBottom: 50,
  },
  imageContainer: {
    flex: 1,
    margin: 5,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  menuIcon: {
    width: 30,
    height: 30,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  paginationButton: {
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationText: {
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
    marginBottom: 16,
  },
  drawerItem: {
    marginBottom: 10,
  },
  drawerItemText: {
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
})
