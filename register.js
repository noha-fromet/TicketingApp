export async function register() {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: "test@gmail.com",
                name: "test",
                password: "azerty123",
                username: "test"
            }),
        });

        const data = await response.json();

        if (response.status === 201) {
            console.log("✅ Compte créé avec succès :", data);
        } else if (response.status === 400) {
            console.warn("❌ Données invalides :", data);
        } else if (response.status === 409) {
            console.warn("⚠️ Utilisateur déjà existant :", data);
        } else {
            console.error("❌ Erreur inconnue :", data);
        }
    } catch (error) {
        console.error("❌ Erreur réseau ou serveur :", error);
    }
}
