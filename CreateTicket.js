import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Pressable,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
    createTicket,
    fetchUserProfile,
    fetchProjectsByCompany,
    fetchProjects,
} from './api';
import CustomDropdown from './CustomDropdown';


export default function CreateTicket({ route, navigation }) {
    const { token } = route.params;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState(null);
    const [projectOptions, setProjectOptions] = useState([]);
    const [isInvite, setIsInvite] = useState(false);

    const priorityOptions = [
        { label: 'Faible', value: 'low' },
        { label: 'Normale', value: 'medium' },
        { label: 'Haute', value: 'high' },
        { label: 'Urgente', value: 'urgent' },
    ];

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const { profile } = await fetchUserProfile(token);
                const userEmail = profile?.email || '';
                const userCompanyId = profile?.company?.id;
                const isInvite = userCompanyId === 'a2v5y745epnpeda';
                setIsInvite(isInvite);

                if (isInvite && userEmail.endsWith('@atelier.ovh')) {
                    // 🚨 Forçage du projet pour les utilisateurs @atelier.ovh même en mode invité
                    const forcedProject = {
                        label: 'dffd (Forcé)',
                        value: 'cgmtck3kg64pu2v', // ← ID du projet "dffd"
                    };
                    setProjectOptions([forcedProject]);
                    setSelectedProject(forcedProject);
                    return;
                }

                if (!isInvite) {
                    const data = await fetchProjectsByCompany(token, userCompanyId);
                    const projects = data.projects || [];

                    const options = projects.map(p => ({
                        label: p.name,
                        value: p.id,
                    }));

                    setProjectOptions(options);

                    if (options.length > 0) {
                        setSelectedProject(options[0]); // Sélection par défaut
                    }
                }
            } catch (err) {
                console.error("❌ Erreur lors du chargement des projets :", err);
            }
        };

        loadProjects();
    }, []);


    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/*', 'application/pdf'],
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets?.length > 0) {
            const newFiles = result.assets.filter(asset => asset?.uri).map(asset => ({
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'application/octet-stream'
            }));

            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleCreate = async () => {
        if (!title || !description || !selectedPriority) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        if (!isInvite && !selectedProject) {
            alert('Veuillez choisir un projet.');
            return;
        }



        const sanitizeFileName = name =>
            name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-.]/g, '');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('priority', selectedPriority.value);

        // Toujours envoyer le projet si on en a un, même si c’est un invité avec un projet forcé
        if (selectedProject?.value) {
            formData.append('project', selectedProject.value);
        } else {
            alert("Veuillez choisir un projet.");
            return;
        }
        console.log("📦 Projet utilisé pour la création :", selectedProject?.value);



        files.forEach((f, i) => {
            formData.append('files', {
                ...f,
                name: sanitizeFileName(f.name),
            });
        });

        const result = await createTicket(token, formData, true);
        if (result?.ticket?.id) {
            alert('✅ Ticket créé !');
            navigation.goBack();
        } else {
            alert('❌ Erreur lors de la création');
        }
    };

    return (
        <View style={styles.page}>
            <ScrollView contentContainerStyle={styles.formWrapper}>
                <Text style={styles.title}>Créer un nouveau ticket</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Titre <Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} />

                    <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                    <TextInput style={[styles.input, styles.textarea]} multiline value={description} onChangeText={setDescription} />

                    {!isInvite && (
                        <>
                            <Text style={styles.label}>Projet <Text style={styles.required}>*</Text></Text>
                            <CustomDropdown
                                label="un projet"
                                options={projectOptions}
                                selected={selectedProject}
                                onSelect={setSelectedProject}
                            />
                        </>
                    )}

                    <Text style={styles.label}>Priorité <Text style={styles.required}>*</Text></Text>
                    <CustomDropdown
                        label="une priorité"
                        options={priorityOptions}
                        selected={selectedPriority}
                        onSelect={setSelectedPriority}
                    />

                    <Text style={styles.label}>Fichiers (optionnel)</Text>
                    <Pressable onPress={handlePickFile}>
                        <Text style={styles.selectFile}>Sélect. fichiers</Text>
                    </Pressable>

                    {files.map((f, idx) => (
                        <Text key={idx} style={styles.fileName}>📎 {f.name}</Text>
                    ))}

                    <Pressable style={styles.submitButton} onPress={handleCreate}>
                        <Text style={styles.submitText}>Ajouter un ticket</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#f8fdfc',
    },
    formWrapper: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    label: {
        marginTop: 10,
        marginBottom: 4,
        fontWeight: '500',
    },
    required: {
        color: 'red',
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 6,
        padding: 10,
        backgroundColor: '#fff',
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    selectFile: {
        backgroundColor: '#EBF5FF',
        color: '#006CFF',
        fontWeight: 'bold',
        marginRight: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        overflow: 'hidden',
        textAlign: 'center',
    },
    fileName: {
        color: '#333',
        fontSize: 14,
        flexShrink: 1,
    },
    submitButtonWrapper: {
        marginTop: 20,
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#006CFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 6,
        width: '100%',
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
    },
});
