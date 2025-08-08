import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, FlatList, Text, View, TouchableOpacity, Pressable, Alert, Button
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CheckBox } from 'react-native-elements';
import { useFocusEffect } from '@react-navigation/native';
import { getProfile } from './auth';
import { fetchProjectsByCompany, fetchTicketsSecure } from './api';
import CustomDropdown from './CustomDropdown';

const TICKETS_PER_PAGE = 10;

export default function TicketsScreen({ token, navigation, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [enterpriseFilter, setEnterpriseFilter] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allEnterprises, setAllEnterprises] = useState([]);
  const [companyNameById, setCompanyNameById] = useState(new Map());

  function guessCompanyNameFromEmail(email) {
    if (email.includes("@laplateforme.io")) return "LaPlateforme";
    if (email.includes("testing.com")) return "Testing Inc";
    if (email.includes("example.com")) return "Exemple SARL";
    if (email.includes("atelier.ovh")) return "Atelier";
    return "Entreprise inconnue";
  }

  const loadTickets = async (projects, companyNameByIdMap) => {
    const filters = {
      status: statusFilter?.value,
      priority: priorityFilter?.value,
      limit: 20,
      maxPages: 10,
    };

    console.log('📌 Filtres appliqués (API) :', filters);

    const ticketsResult = await fetchTicketsSecure(token, filters);
    let ticketsList = Array.isArray(ticketsResult?.tickets) ? ticketsResult.tickets : [];

    const companyName =
      projectCompanyNameMap.get(ticket.project) ||
      companyNameByIdMap.get(companyId || guessedId);


    projects.forEach(p => {
      if (p.id && p.company) {
        projectCompanyMap.set(p.id, p.company);
      }
      if (p.id && p.company_name) {
        projectCompanyNameMap.set(p.id, p.company_name);
      }
    });

    ticketsList = ticketsList.map(ticket => {
      const companyId = projectCompanyMap.get(ticket.project);
      const guessedId = ticket.email?.includes('@atelier.ovh') ? 'nls628xs4p24rej' : null;

      let companyName =
        projectCompanyNameMap.get(ticket.project) ||
        companyNameById.get(companyId || guessedId);

      if (!companyName && ticket.email) {
        companyName = guessCompanyNameFromEmail(ticket.email);
      }


      return {
        ...ticket,
        companyId: companyId || guessedId,
        company_name: companyName || 'Entreprise inconnue',
      };

    });

    setTickets(ticketsList);
    console.log('✅ Tickets après enrichissement :', ticketsList.length);
  };

  useFocusEffect(
    useCallback(() => {
      async function refreshData() {
        const profile = await getProfile(token);
        const adminStatus = profile?.profile?.admin === true;
        setIsAdmin(adminStatus);
        setUserId(profile?.profile?.id);

        const companyId = profile?.profile?.company?.id;
        let allProjects = [];

        if (adminStatus) {
          try {
            const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/projects', {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            allProjects = data?.projects || [];
          } catch (error) {
            console.error("❌ Erreur lors de la récupération des projets admin :", error);
          }
        } else {
          const result = await fetchProjectsByCompany(token, companyId);
          allProjects = result?.projects || [];
        }

        setProjects(allProjects);




        const idToCompanyNameMap = new Map([
          ["ejc7xzf2q3m64u3", "LaPlateforme"],
          ["a2v5y745epnpeda", "Invité"],
          ["nls628xs4p24rej", "Atelier"]
        ]);

        if (adminStatus) {
          try {
            const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/users', {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            const usersList = Array.isArray(data.users) ? data.users : [];

            usersList.forEach(user => {
              const cid = user.company;
              const fallbackName = `Entreprise ${cid?.slice(0, 6)}`;
              const name = guessCompanyNameFromEmail(user.email) || fallbackName;
              if (!idToCompanyNameMap.has(cid)) {
                idToCompanyNameMap.set(cid, name);
              }
            });

            const companies = [...idToCompanyNameMap.entries()].map(([id, name]) => ({
              label: name,
              value: id
            }));

            console.log("🏢 Entreprises détectées + manuelles :", companies);
            setAllEnterprises(companies);
          } catch (err) {
            console.error("❌ Erreur en récupérant les utilisateurs :", err);
          }
        } else {
          setAllEnterprises([
            {
              label: profile.profile.company.name,
              value: profile.profile.company.id
            }
          ]);

          idToCompanyNameMap.set(
            profile.profile.company.id,
            profile.profile.company.name
          );
        }

        setCompanyNameById(idToCompanyNameMap);
        await loadTickets(allProjects, idToCompanyNameMap);


      }
      refreshData();
    }, [token])
  );

  useEffect(() => {
    const applyFilterAndLoad = async () => {
      await loadTickets();
      setCurrentPage(1);
    };
    applyFilterAndLoad();
  }, [enterpriseFilter?.value, statusFilter?.value, priorityFilter?.value, onlyMine]);

  const filteredTickets = useMemo(() => {
    const filtered = tickets
      .filter(ticket => {
        if (onlyMine && ticket.author !== userId) return false;
        if (enterpriseFilter?.value) {
          return ticket.companyId === enterpriseFilter.value;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    return filtered;
  }, [tickets, onlyMine, userId, enterpriseFilter]);

  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const currentPageTickets = filteredTickets.slice(
    (currentPage - 1) * TICKETS_PER_PAGE,
    currentPage * TICKETS_PER_PAGE
  );

  const logout = async () => {
    try {
      const response = await fetch('https://ticketing.development.atelier.ovh/api/mobile/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) onLogout();
      else Alert.alert('Erreur', 'Déconnexion échouée');
    } catch (err) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎫 Tickets</Text>
        <View style={styles.topButtons}>
          <Pressable
            style={styles.smallButton}
            onPress={() => navigation.navigate('CreateTicket', { token, projects })}
          >
            <Text style={styles.smallButtonText}>➕ Créer</Text>
          </Pressable>
          <Pressable style={styles.smallLogout} onPress={logout}>
            <Text style={styles.smallLogoutText}>🚪 Quitter</Text>
          </Pressable>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.firstRow}>
          <CheckBox
            title="Mes tickets"
            checked={onlyMine}
            onPress={() => setOnlyMine(!onlyMine)}
            containerStyle={styles.checkBox}
            textStyle={{ fontSize: 12 }}
          />
          <View style={styles.dropdownWrapper}>
            <CustomDropdown
              label="Priorité"
              options={[
                { label: 'Urgente', value: 'urgent' },
                { label: 'Haute', value: 'high' },
                { label: 'Moyenne', value: 'medium' },
                { label: 'Basse', value: 'low' },
              ]}
              selected={priorityFilter}
              onSelect={setPriorityFilter}
            />
          </View>
          {isAdmin && (
            <View style={styles.dropdownWrapper}>
              <CustomDropdown
                label="Entreprise"
                options={allEnterprises}
                selected={enterpriseFilter}
                onSelect={setEnterpriseFilter}
              />
            </View>
          )}
        </View>
        <View style={styles.statusDropdownRow}>
          <Text style={{ fontWeight: 'bold', marginRight: 6 }}>Statut :</Text>
          <CustomDropdown
            label="Statut"
            options={[
              { label: 'Ouverts', value: 'opened' },
              { label: 'Fermés', value: 'closed' },
            ]}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
        </View>
      </View>

      {/* Ticket list */}
      {currentPageTickets.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 10, color: '#888' }}>
          Aucun ticket trouvé.
        </Text>
      ) : (
        <>
          <FlatList
            data={currentPageTickets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('TicketDetail', {
                  ticketId: item.id,
                  token: token,
                  userRole: isAdmin ? 'admin' : 'user',
                })}
              >
                <Text style={styles.item}>
                  {item.title} ({item.company_name || 'Entreprise inconnue'}) - {item.priority}{"\n"}
                  📅 Créé le {new Date(item.created).toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.pagination}>
            {currentPage > 1 && (
              <Button title="⬅️" onPress={() => setCurrentPage(prev => prev - 1)} />
            )}
            <Text style={styles.pageText}>
              Page {currentPage} / {totalPages}
            </Text>
            {currentPage < totalPages && (
              <Button title="➡️" onPress={() => setCurrentPage(prev => prev + 1)} />
            )}
          </View>
        </>
      )}

      <StatusBar style="auto" />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold' },
  topButtons: { flexDirection: 'row', gap: 8 },
  smallButton: { backgroundColor: '#006CFF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 4 },
  smallButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  smallLogout: { backgroundColor: '#FF3B30', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 4, marginLeft: 6 },
  smallLogoutText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10, gap: 8 },
  dropdownWrapper: { flex: 1, minWidth: 20 },
  checkBox: { backgroundColor: 'transparent', borderWidth: 0, padding: 0, margin: 0 },
  item: { paddingVertical: 10, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10, gap: 12 },
  pageText: { marginHorizontal: 12, fontWeight: 'bold', fontSize: 14 },
  firstRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  statusDropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
});
