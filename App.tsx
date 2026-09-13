import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ChessScreen from './src/screens/ChessScreen';

export type RootStackParamList = {
  Home: undefined;
  Chess: {
    player1: string;
    player2: string;
    boardTheme: 'classic' | 'dark' | 'wood';
  };
};


const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chess" component={ChessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
