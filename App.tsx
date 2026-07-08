import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GameMode } from './src/hooks/useGameEngine';
import { GameScreen } from './src/ui/GameScreen';
import { HomeScreen } from './src/ui/HomeScreen';
import { theme } from './src/ui/theme';

type Screen = { name: 'home' } | { name: 'game'; mode: GameMode };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  return (
    <View style={styles.container}>
      {screen.name === 'home' ? (
        <HomeScreen onStart={(mode) => setScreen({ name: 'game', mode })} />
      ) : (
        <GameScreen mode={screen.mode} onExit={() => setScreen({ name: 'home' })} />
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
});
