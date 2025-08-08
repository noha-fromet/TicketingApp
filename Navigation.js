// 📁 Navigation.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TicketListScreen from './TicketListScreen';
import TicketDetail from './TicketDetail';
import CreateTicket from './CreateTicket';
import AuthScreen from './AuthScreen';

import { login as loginAPI, getProfile } from './auth';
import { fetchProjectsByCompany, fetchTicketsSecure } from './api'; // ✅ tu en avais besoin ici

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function Navigation() {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loginFailed, setLoginFailed] = useState(false);

    // 🚀 1. Chargement initial du token
    useEffect(() => {
        const init = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('authToken');

                if (savedToken && savedToken !== 'null') {
                    // ⚠️ Teste que le token est encore bon
                    try {
                        const profile = await getProfile(savedToken);

                        if (profile?.profile?.id) {
                            setToken(savedToken);
                        } else {
                            throw new Error("Token invalide");
                        }
                    } catch (err) {
                        console.warn("❌ Token invalide au chargement :", err.message);
                        await AsyncStorage.removeItem('authToken');
                        setToken(null);
                    }
                } else {
                    setToken(null);
                }
            } catch (err) {
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    // 🔐 2. Login manuel ou via Google
    const handleLogin = async ({ token: tokenFromProps, identity, password }) => {
        setIsLoading(true);
        setLoginFailed(false);

        try {
            let finalToken = tokenFromProps;

            if (!finalToken && identity && password) {
                finalToken = await loginAPI(identity.trim(), password.trim());
            }

            if (!finalToken) throw new Error('Token manquant');

            const profile = await getProfile(finalToken);
            if (!profile?.profile?.id) throw new Error('Profil invalide');

            await AsyncStorage.setItem('authToken', finalToken);
            setToken(finalToken);

            // Optionnel : précharger les projets et tickets
            await fetchProjectsByCompany(finalToken);
            await fetchTicketsSecure(finalToken);
        } catch (err) {
            console.error("❌ Connexion échouée :", err.message);
            setLoginFailed(true);
            await AsyncStorage.removeItem('authToken');
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 🔓 3. Logout complet
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('authToken');
        } catch (err) {
            console.warn("⚠️ Erreur AsyncStorage.removeItem :", err.message);
        } finally {
            setToken(null); // 🔁 Forcera le retour à l'écran de login
        }
    };

    // 🕐 4. Affichage conditionnel
    if (isLoading) {
        return null; // ou un splash screen si tu veux
    }

    if (!token) {
        return (
            <AuthScreen
                onLogin={handleLogin}
                isLoading={isLoading}
                loginFailed={loginFailed}
                onLoginGoogle={async (tokenFromGoogle) => {
                    await handleLogin({ token: tokenFromGoogle });
                }}
            />
        );
    }

    // ✅ 5. Navigation si connecté
    return (
        <QueryClientProvider client={queryClient}>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen name="Tickets">
                        {props => (
                            <TicketListScreen
                                {...props}
                                token={token}
                                onLogout={handleLogout}
                            />
                        )}
                    </Stack.Screen>
                    <Stack.Screen name="TicketDetail">
                        {props => <TicketDetail {...props} token={token} />}
                    </Stack.Screen>
                    <Stack.Screen name="CreateTicket">
                        {props => <CreateTicket {...props} token={token} />}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </QueryClientProvider>
    );
}
