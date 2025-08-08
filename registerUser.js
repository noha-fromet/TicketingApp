export async function registerUser() {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: "utilisateuratelier2@atelier.ovh",
                name: "utilisateuratelier2",
                username: "utilisateuratelier2",
                password: "UserCDPI121",
                company_id: "nls628xs4p24rej", // ← FORCÉ à "L'atelier"
            }),
        });

        const data = await response.json(); // 🟡 D'abord on récupère la réponse JSON

        if (response.status === 201) {
            console.log("✅ Compte utilisateur créé avec succès :", data);
            console.log("🏢 Entreprise associée :", data.user?.company || data.company || "Non précisée");
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
