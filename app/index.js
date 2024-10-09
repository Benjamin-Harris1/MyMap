import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function App() {
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);

      // Fetch markers from Firestore
      const markersSnapshot = await getDocs(collection(db, 'markers'));
      const markersData = markersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarkers(markersData);
    })();
  }, []);

  const handleLongPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    
    // Pick an image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Upload image to Firebase Storage
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const filename = `${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save marker data to Firestore
      const markerData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        imageUrl: downloadURL,
      };
      const docRef = await addDoc(collection(db, 'markers'), markerData);

      // Update local state
      setMarkers([...markers, { id: docRef.id, ...markerData }]);
    }
  };

  if (!location) {
    return <View className="flex-1 items-center justify-center"><Text>Loading...</Text></View>;
  }

  return (
    <View className="flex-1">
      <MapView
        className="flex-1"
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
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
      {selectedMarker && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4">
          <TouchableOpacity onPress={() => setSelectedMarker(null)}>
            <Text className="text-blue-500 mb-2">Close</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: selectedMarker.imageUrl }}
            className="w-full h-40"
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
}