// auth.js

// 🔐 Connexion
export async function login() {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'test',
                email: 'test@gmail.com',
                password: 'azerty123',
            }),
        });

        const data = await response.json();
        console.log('Résultat de la connexion :', data);

        if (data.access_token) {
            console.log('✅ Token obtenu :', data.access_token);
            return data.access_token; // renvoie le token pour qu’on l’utilise ensuite
        } else {
            console.warn('❌ Connexion échouée : identifiants invalides.');
            return null;
        }

    } catch (error) {
        console.error('❌ Erreur lors de la connexion :', error);
        return null;
    }
}

// 👤 Récupérer le profil de l’utilisateur connecté
export async function getProfile(token) {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/user', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        console.log('👤 Profil utilisateur :', data);
        return data;
    } catch (error) {
        console.error('❌ Erreur récupération profil :', error);
        return null;
    }
}
