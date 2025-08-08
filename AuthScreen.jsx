import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerUser } from './registerUser';
import { login } from './auth';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = 'https://auth.expo.io/@noha.f/ticketingapp';

export default function AuthScreen({ onLogin, isLoading, loginFailed }) {
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: '391568560192-0jkhc9o7dgdugf4u0nqejcu583lfadmh.apps.googleusercontent.com',
        iosClientId: '391568560192-1kr258pdvqhth74upliq7rp6oe6gbggf.apps.googleusercontent.com',
        androidClientId: '391568560192-hjvhe2ae2lq79lajg7laapr3frfeuv23.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        useProxy: true,
        redirectUri,
    });

    useEffect(() => {
        console.log('✅ Redirect URI utilisée (forcée) :', redirectUri);
    }, []);

    useEffect(() => {
        async function handleGoogleLogin() {
            if (response?.type === 'success') {
                try {
                    const accessToken = response.authentication.accessToken;
                    console.log('🔐 Google access token :', accessToken);

                    const res = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: accessToken }),
                    });

                    const data = await res.json();
                    console.log("🧾 Contenu brut de la réponse :", data);
                    console.log("📬 Code HTTP :", res.status);

                    if (res.ok && data.access_token) {
                        await AsyncStorage.setItem('authToken', data.access_token);
                        onLogin({ token: data.access_token, identity: null, password: null });
                    } else {
                        Alert.alert("Erreur", "Connexion Google refusée.");
                        await AsyncStorage.removeItem('authToken');
                    }
                } catch (error) {
                    console.error("❌ Erreur lors de la connexion Google :", error);
                    Alert.alert("Erreur", "Impossible de finaliser la connexion.");
                    await AsyncStorage.removeItem('authToken');
                }
            }
        }

        handleGoogleLogin();
    }, [response]);

    const handleAutoLogin = () => {
        const defaultIdentity = "admin-cdpi@atelier.ovh";
        const defaultPassword = "AdminCDPI123";
        onLogin({ identity: defaultIdentity, password: defaultPassword });
    };

    const handleUserLogin = async () => {
        const userIdentity = "utilisateuratelier2@atelier.ovh";
        const userPassword = "UserCDPI121";
        const token = await login(userIdentity, userPassword);

        if (token) {
            await AsyncStorage.setItem('authToken', token);
            onLogin({ token });
        } else {
            Alert.alert("Erreur", "Impossible de se connecter.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Connexion</Text>

            {loginFailed && (
                <Text style={styles.errorText}>
                    ❌ Identifiants invalides. Veuillez réessayer.
                </Text>
            )}

            <View style={styles.buttonWrapper}>
                <Button
                    title={isLoading ? 'Connexion auto...' : 'Connexion auto (admin)'}
                    color="#FFC107"
                    onPress={handleAutoLogin}
                    disabled={isLoading}
                />
            </View>

            <View style={styles.buttonWrapper}>
                <Button
                    title="Connexion (utilisateur)"
                    color="#17A2B8"
                    onPress={handleUserLogin}
                    disabled={isLoading}
                />
            </View>

            <View style={styles.buttonWrapper}>
                <Button
                    title="Connexion Google"
                    color="#28A745"
                    onPress={() => promptAsync()}
                    disabled={!request}
                />
            </View>

            <View style={styles.buttonWrapper}>
                <Button
                    title="Créer un compte (utilisateur)"
                    color="#961d96ff"
                    onPress={registerUser}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 30,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 15,
        textAlign: 'center',
    },
    buttonWrapper: {
        marginTop: 15,
    },
});
