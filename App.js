import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchTickets } from './api';
import { login, getProfile } from './auth';
import { register } from './register';

export default function App() {
  useEffect(() => {
    async function start() {
      await fetchTickets();   // Appel des tickets
      await register();       // Inscription

      const token = await login(); // Connexion
      if (token) {
        await getProfile(token);  // Récupération du profil
      }
    }

    start();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Bienvenue dans l'app Ticketing !</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
