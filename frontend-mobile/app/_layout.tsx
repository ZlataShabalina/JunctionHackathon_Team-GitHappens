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
          name="tasks" 
          options={{ 
            title: 'Maintenance Tasks',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="taskpage" 
          options={{ 
            title: 'Task Details',
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