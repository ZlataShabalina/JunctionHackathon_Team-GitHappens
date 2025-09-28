import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Asset Manager',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="sites" 
          options={{ 
            title: 'Sites',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="sitepage" 
          options={{ 
            title: 'Site Details',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="workorders" 
          options={{ 
            title: 'Work Orders',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="workorder-details" 
          options={{ 
            title: 'Work Order Details',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="asset" 
          options={{ 
            title: 'Asset Details',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="map" 
          options={{ 
            title: 'Site Map',
            headerShown: true 
          }} 
        />
      </Stack>
    </>
  );
}