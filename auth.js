export async function login(identity, password) {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, password }),
        });

        const data = await response.json();
        console.log('🎫 Réponse login :', JSON.stringify(data, null, 2));
        console.log('🪪 Token obtenu ?', data.access_token);

        if (data.access_token) {
            console.log('🆕 token actuelle =', data.access_token); // 👈 ICI le log demandé
            return data.access_token;
        }
        console.log('🪪 data', data);

        // ⛔ NE PAS faire throw ici
        return null;

    } catch (error) {
        console.error('❌ Erreur lors de la connexion (network ou parsing) :', error);
        return null; // ⛔ ne fais pas throw ici non plus
    }
}




export async function getProfile(token) {
    if (!token) {
        console.warn("❌ getProfile : Token manquant");
        return null;
    }
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/profile', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const text = await response.text();
        console.log('🧾 Contenu brut de la réponse :\n', text);
        console.log('📬 Code HTTP :', response.status);

        const data = JSON.parse(text);
        console.log('👤 Profil utilisateur :', data);
        return data;

    } catch (error) {
        console.error('❌ Erreur récupération profil :', error);
        return null;
    }
}


export async function getAuthUser(token) {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/user', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const text = await response.text();
        console.log('🧾 Réponse brute GET /auth/user :\n', text);
        console.log('📬 Code HTTP :', response.status);

        const data = JSON.parse(text); // ici peut planter
        console.log('👤 Utilisateur connecté :', data);
        return data;
    } catch (error) {
        console.error('❌ Erreur getAuthUser :', error);
        return null;
    }
}

export async function getUserById(id, token) {
    try {
        const response = await fetch(`https://ticketing.development.atelier.ovh/api/mobile/users/${id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const text = await response.text();
        console.log('🧾 Réponse GET /users/{id} :', text);
        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('❌ Erreur getUserById :', error);
        return null;
    }
}
