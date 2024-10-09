import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f3f4f6' },
      }}
    />
  );
}
// This is the layout for the app, it is used to wrap the stack navigator and provide a background color for the whole app
// Using expo-router again - the routes are created automatically depending on the file structure
