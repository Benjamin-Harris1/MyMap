import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Request permission to access location of the device
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);

      // Fetch markers from Firestore
      const markersSnapshot = await getDocs(collection(db, 'markers'));
      const markersData = markersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarkers(markersData);
    })();
  }, []);

  // Handle long press on the map -> creates new marker with selected image
  const handleLongPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    
    // Open image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    // If image is selected
    if (!result.canceled) {
      // Upload image to Firebase Storage
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const filename = `${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);

      // Get download URL (the url of the uploaded image)
      const downloadURL = await getDownloadURL(storageRef);

      // Save marker data to Firestore
      const markerData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        imageUrl: downloadURL,
      };
      const docRef = await addDoc(collection(db, 'markers'), markerData);

      // Save marker to Firebase and update local state
      setMarkers([...markers, { id: docRef.id, ...markerData }]);
    }
  };

  // If location is not loaded, show loading screen
  if (!location) {
    return <View className="flex-1 items-center justify-center"><Text>Loading...</Text></View>;
  }

  // Handle delete
  const handleDelete = async (marker) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'markers', marker.id));
      
      // Delete from Storage
      const imageRef = ref(storage, marker.imageUrl);
      await deleteObject(imageRef).catch((error) => {
        console.log("Error deleting image:", error);
      });
  
      // Update the local state by filtering out the deleted marker
      setMarkers(markers.filter(m => m.id !== marker.id));
      setSelectedMarker(null);
    } catch (error) {
      console.error("Error deleting marker:", error);
    }
  };

  const goToCurrentLocation = async () => {
    let location = await Location.getCurrentPositionAsync({});
    mapRef.current.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  return (
    <View className="flex-1">
      {/* MapView component */}
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 1,
          longitudeDelta: 1,
        }}
        onLongPress={handleLongPress}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => setSelectedMarker(marker)}
          />
        ))}
      </MapView>
      {/* Go to current location button */}
      <TouchableOpacity 
        onPress={goToCurrentLocation}
        className="absolute bottom-8 right-4 bg-white rounded-full w-12 h-12 items-center justify-center shadow-lg"
      >
        <Ionicons name="locate" size={24} color="blue" />
      </TouchableOpacity>

      {/* If a marker is selected, show the image in a modal */}
      {selectedMarker && (
        <View 
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 h-full w-full justify-center items-center" 
        >
          <View className="bg-white p-4 pt-12 rounded-lg w-[80%] relative">
            {/* Close button */}
            <TouchableOpacity 
              onPress={() => setSelectedMarker(null)}
              className="absolute right-2 top-2 z-10 bg-white rounded-full w-8 h-8 items-center justify-center shadow-sm"
            >
              <Text className="text-lg font-bold">×</Text>
            </TouchableOpacity>
            
            {/* Delete button */}
            <TouchableOpacity 
              onPress={() => handleDelete(selectedMarker)}
              className="absolute left-2 top-2 z-10 bg-white rounded-full px-3 py-1 items-center justify-center shadow-sm"
            >
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>

            {/* Selected marker image */}
            <Image
              source={{ uri: selectedMarker.imageUrl }}
              className="w-full h-72 rounded"
              resizeMode="cover"
            />
          </View>
        </View>
      )}
    </View>
  );
}