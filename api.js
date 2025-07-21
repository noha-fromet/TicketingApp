// api.js
export async function fetchTickets() {
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile');
        const data = await response.json();
        console.log("Réponse de l'API :", data);
    } catch (error) {
        console.error("Erreur lors de l'appel API :", error);
    }
}
