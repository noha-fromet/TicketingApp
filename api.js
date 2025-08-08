// api.js

// Fonction pour récupérer les tickets avec un token d'authentification
export async function fetchTicketsSecure(token, filters = {}) {
    const allTickets = [];

    const statusList = filters.status ? [filters.status] : ['opened', 'closed'];
    const maxPages = filters.maxPages || 10; // nombre max de pages à parcourir (optionnel)

    for (const status of statusList) {
        for (let page = 1; page <= maxPages; page++) {
            const params = new URLSearchParams();

            params.append('page', page);
            params.append('limit', filters.limit || 20);
            params.append('status', status);

            if (filters.company) {
                params.append('company', filters.company);
            }

            if (filters.priority) {
                params.append('priority', filters.priority);
            }

            const url = `https://ticketing.development.atelier.ovh/api/mobile/tickets?${params.toString()}`;

            try {
                console.log('📡 URL API appelée :', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const text = await response.text();
                const data = JSON.parse(text);

                if (Array.isArray(data.tickets)) {
                    allTickets.push(...data.tickets);
                } else {
                    break; // aucune donnée, on arrête la boucle
                }
            } catch (error) {
                console.error(`❌ Erreur lors de la récupération des tickets (page ${page}) :`, error);
                break;
            }
        }
    }

    console.log(
        '🐥 Tickets bruts récupérés :',
        allTickets.map(t => ({ id: t.id, status: t.status, title: t.title }))
    );



    return { tickets: allTickets };
}

export async function logAvailableEnterprisesFromProjects(token) {
    console.log('📨 Découverte des entreprises via /projects');

    try {
        const response = await fetch(
            'https://ticketing.development.atelier.ovh/api/mobile/projects',
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const status = response.status;
        const text = await response.text();

        console.log("📦 Code HTTP:", status);
        console.log("📜 Contenu brut projets:", text);

        const data = JSON.parse(text);

        if (Array.isArray(data.projects)) {
            const uniqueCompanyIds = new Set();

            data.projects.forEach((project, i) => {
                const companyId = project.company; // ✅ Clé correcte
                if (companyId) {
                    uniqueCompanyIds.add(companyId);
                    console.log(`🔹 Projet ${i + 1}: ${project.name}, Entreprise ID: ${companyId}`);
                }
            });

            console.log("🏢 Entreprises (IDs uniques) découvertes via projets :");
            console.log([...uniqueCompanyIds]);
        } else {
            console.warn("⚠️ Aucun projet trouvé.");
        }

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des projets :', error);
    }
}



export async function fetchAllEnterprises(token) {
    console.log('📨 Récupération de toutes les entreprises via les projets');

    try {
        const response = await fetch(
            'https://ticketing.development.atelier.ovh/api/mobile/projects', // ✅ route existante
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const status = response.status;
        const text = await response.text();
        console.log("📦 Code HTTP (fetchAllEnterprises):", status);
        console.log("📜 Contenu brut :", text);

        const data = JSON.parse(text);

        if (Array.isArray(data.projects)) {
            // On regroupe par entreprise
            const enterpriseMap = {};
            data.projects.forEach(project => {
                if (project.company_id && project.company_name) {
                    enterpriseMap[project.company_id] = project.company_name;
                }
            });

            const enterpriseOptions = Object.entries(enterpriseMap).map(([id, name]) => ({
                label: name,
                value: id,
            }));

            return { companies: enterpriseOptions };
        }

        return null;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des entreprises :', error);
        return null;
    }
}



export async function createTicket(token, data, isMultipart = false) {
    console.log("🆕 Création d’un ticket...");
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/tickets', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
            },
            body: isMultipart ? data : JSON.stringify(data),
        });

        const status = response.status;
        const text = await response.text();
        console.log('📦 Code HTTP (createTicket) :', status);
        console.log('📜 Contenu brut :', text);

        const result = JSON.parse(text);

        if (status === 201) {
            console.log('✅ Ticket créé avec succès');
        } else {
            console.warn('⚠️ Ticket non créé correctement');
        }

        return result;
    } catch (error) {
        console.error('❌ Erreur lors de la création du ticket :', error);
        return null;
    }
}


export async function fetchProjectsByCompany(token, companyId) {
    console.log('📨 Récupération des projets pour entreprise ID:', companyId);

    try {
        const response = await fetch(
            `https://ticketing.development.atelier.ovh/api/mobile/projects/company/${companyId}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const status = response.status;
        const text = await response.text();
        console.log("📦 Code HTTP (fetchProjectsByCompany):", status);
        console.log("📜 Contenu brut :", text);

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des projets :', error);
        return null;
    }
}

export async function fetchUserProfile(token) {
    try {
        const response = await fetch(
            'https://ticketing.development.atelier.ovh/api/mobile/profile',
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            }
        );

        const text = await response.text();
        console.log("📥 Profil utilisateur brut :", text);

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil :', error);
        return null;
    }
}



export async function createProject(token, name = 'Projet test') {
    console.log("🛠️ Création d’un projet...");
    try {
        const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/projects', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        const status = response.status;
        const text = await response.text();
        console.log("📦 Code HTTP (createProject):", status);
        console.log("📜 Contenu brut :", text);

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('❌ Erreur lors de la création du projet :', error);
        return null;
    }
}

export async function fetchProjects(token) {
    console.log("📨 Récupération des projets via /projects (user non-admin)");

    try {
        const response = await fetch(
            'https://ticketing.development.atelier.ovh/api/mobile/projects',
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const status = response.status;
        const text = await response.text();
        console.log("📦 Code HTTP (fetchProjects):", status);
        console.log("📜 Contenu brut :", text);

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error("❌ Erreur fetchProjects :", error);
        return null;
    }
}

