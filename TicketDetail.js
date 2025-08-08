import React, { useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList,
    TouchableOpacity,
    Image,
    Modal
} from 'react-native';
import {
    Text,
    Button,
    Input,
    Card,
    Overlay
} from 'react-native-elements';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';

export default function TicketDetail({ route, navigation }) {
    const { ticketId, token, userRole = 'user', userId } = route.params;
    const queryClient = useQueryClient();
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTo, setAssignTo] = useState('');
    const [newComment, setNewComment] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    console.log("🟢 TicketDetail monté avec :", { ticketId, userRole, userId });

    const { data, isLoading, isError } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: async () => {
            console.log(`🔍 Fetch ticket ${ticketId}`);
            const res = await axios.get(
                `https://ticketing.development.atelier.ovh/api/mobile/tickets/${ticketId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("✅ Ticket récupéré :", res.data.ticket);
            return res.data.ticket;
        },
    });

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            console.log("📥 Chargement des utilisateurs (admin)");
            const res = await axios.get(
                `https://ticketing.development.atelier.ovh/api/mobile/users`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("✅ Utilisateurs récupérés :", res.data);
            return res.data;
        },
        enabled: userRole === 'admin' && showAssignModal
    });

    const assignMutation = useMutation({
        mutationFn: async (userId) => {
            const res = await axios.post(
                `https://ticketing.development.atelier.ovh/api/mobile/tickets/${ticketId}/assign`,
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticket', ticketId]);
            setShowAssignModal(false);
            Alert.alert('Succès', 'Ticket assigné avec succès.');
        },
        onError: () => {
            Alert.alert('Erreur', "Impossible d'assigner ce ticket.");
        },
    });

    const deleteTicketMutation = useMutation({
        mutationFn: async () => {
            const res = await axios.delete(
                `https://ticketing.development.atelier.ovh/api/mobile/tickets/${ticketId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tickets']);
            Alert.alert('Succès', 'Le ticket a été supprimé.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        },
        onError: () => {
            Alert.alert('Erreur', 'Impossible de supprimer le ticket.');
        },
    });

    const closeTicketMutation = useMutation({
        mutationFn: async () => {
            const res = await axios.patch(
                `https://ticketing.development.atelier.ovh/api/mobile/tickets/${ticketId}/status`,
                { status: 'closed' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticket', ticketId]);
            Alert.alert('Succès', 'Le ticket a été fermé.');
        },
        onError: () => {
            Alert.alert('Erreur', 'Impossible de fermer le ticket.');
        },
    });

    const commentMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('ticket_id', ticketId);
            formData.append('content', newComment);
            const res = await fetch(
                'https://ticketing.development.atelier.ovh/api/mobile/comments',
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                }
            );
            if (!res.ok) throw new Error('Erreur API');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticket', ticketId]);
            setNewComment('');
        },
        onError: () => {
            Alert.alert('Erreur', 'Impossible de poster le commentaire.');
        },
    });

    const handleAssignManual = () => {
        if (assignTo.trim() === '') {
            Alert.alert('Erreur', 'Veuillez renseigner un ID utilisateur valide.');
            return;
        }
        console.log("📌 Assignation manuelle :", assignTo);
        assignMutation.mutate(assignTo.trim());
    };

    const handleCommentSubmit = () => {
        if (newComment.trim() === '') {
            Alert.alert('Champ vide', 'Veuillez écrire un commentaire.');
            return;
        }
        console.log("💬 Envoi commentaire :", newComment);
        commentMutation.mutate();
    };

    const confirmDelete = () => {
        console.log("🗑️ Demande de suppression du ticket :", ticketId);
        Alert.alert(
            'Confirmer la suppression',
            'Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => deleteTicketMutation.mutate() },
            ]
        );
    };

    if (isLoading) {
        console.log("⏳ Chargement du ticket...");
        return <ActivityIndicator style={{ flex: 1 }} size="large" />;
    }
    if (isError || !data) {
        console.error("❌ Erreur ou pas de data pour le ticket");
        return (
            <View style={styles.container}>
                <Text>Erreur de chargement du ticket.</Text>
            </View>
        );
    }
    console.log("📦 Ticket affiché :", data);

    let filesArray = [];
    if (typeof data.files === 'string' && data.files.length > 0) {
        try {
            filesArray = JSON.parse(data.files);
            console.log("📂 Fichiers parsés :", filesArray);
        } catch (e) {
            console.error("❌ Impossible de parser files :", e);
            filesArray = []; // Pas de fichiers valides
        }
    } else if (Array.isArray(data.files)) {
        filesArray = data.files;
    }

    const isCreator = data.author === userId;

    return (
        <ScrollView style={styles.container}>
            <Card>
                <Card.Title>{data.title}</Card.Title>
                <Card.Divider />
                <Text style={styles.info}>Numéro : #{data.id}</Text>
                <Text style={styles.info}>Statut : {data.status}</Text>
                <Text style={styles.info}>Priorité : {data.priority}</Text>
                <Text style={styles.info}>Créé le : {dayjs(data.created).format('DD/MM/YYYY HH:mm')}</Text>
                <Text style={styles.info}>Assigné à : {data.assigned_to || 'Non assigné'}</Text>

                {userRole === 'admin' && data.status !== 'closed' && (
                    <Button
                        title="Gérer l’assignation"
                        onPress={() => setShowAssignModal(true)}
                        buttonStyle={{ backgroundColor: '#006CFF', marginTop: 12 }}
                    />
                )}

                {(userRole === 'admin' || isCreator) && data.status !== 'closed' && (
                    <Button
                        title="🚩 Fermer le ticket"
                        onPress={() => closeTicketMutation.mutate()}
                        buttonStyle={{ backgroundColor: '#FF3B30', marginTop: 10 }}
                        loading={closeTicketMutation.isLoading}
                    />
                )}

                {userRole === 'admin' && (
                    <Button
                        title="🗑️ Supprimer le ticket"
                        onPress={confirmDelete}
                        buttonStyle={{ backgroundColor: '#FF3B30', marginTop: 10 }}
                        loading={deleteTicketMutation.isLoading}
                    />
                )}

                <Text style={styles.sectionTitle}>Description complète :</Text>
                <Text style={styles.description}>{data.description}</Text>

                {Array.isArray(filesArray) && filesArray.length > 0 ? (
                    <>
                        <Text style={styles.sectionTitle}>📎 Fichiers attachés :</Text>
                        {filesArray.map((file, idx) => {
                            const isImage = file.match(/\.(jpg|jpeg|png|gif)$/i);

                            // Raw from API
                            const original = file;

                            // Decoded for human reading
                            const decoded = decodeURIComponent(original);

                            // Re-encode the decoded filename (normal case)
                            const encoded = encodeURIComponent(decoded);

                            // Construct different URL variants
                            const urlOriginal = `https://ticketing.development.atelier.ovh/api/files/tickets/${data.id}/${original}`;
                            const urlDecoded = `https://ticketing.development.atelier.ovh/api/files/tickets/${data.id}/${decoded}`;
                            const urlEncoded = `https://ticketing.development.atelier.ovh/api/files/tickets/${data.id}/${encoded}`;

                            // Log absolutely everything for this file
                            console.log(`\n================ File ${idx + 1} =================`);
                            console.log(`Original from API:    ${original}`);
                            console.log(`Decoded:              ${decoded}`);
                            console.log(`Encoded:              ${encoded}`);
                            console.log(`URL with original:    ${urlOriginal}`);
                            console.log(`URL with decoded:     ${urlDecoded}`);
                            console.log(`URL with encoded:     ${urlEncoded}`);

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        console.log(`\n👆 Clicked file index: ${idx}`);
                                        console.log(`Try with original URL: ${urlOriginal}`);
                                        console.log(`Try with decoded URL: ${urlDecoded}`);
                                        console.log(`Try with encoded URL: ${urlEncoded}`);

                                        // For preview, try the encoded URL first (most standard).
                                        if (isImage) {
                                            setImagePreview(urlEncoded);
                                        }
                                    }}
                                >
                                    {isImage ? (
                                        <Image
                                            source={{ uri: urlEncoded }}
                                            style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }}
                                            resizeMode="cover"
                                            onError={err =>
                                                console.error(`❌ Loading error for ${urlEncoded}`, err.nativeEvent)
                                            }
                                            onLoad={() => console.log(`✅ Image loaded OK for ${urlEncoded}`)}
                                        />
                                    ) : (
                                        <Text style={{ color: '#006CFF', marginBottom: 8 }}>📄 {decoded}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}





                    </>
                ) : (
                    console.warn("⚠ Aucun fichier attaché au ticket")
                )}

                <Text style={styles.sectionTitle}>💬 Commentaires :</Text>
                {Array.isArray(data.comments) && data.comments.length > 0 ? (
                    data.comments.map((comment, idx) => (
                        <Card key={idx} containerStyle={styles.commentBox}>
                            <Text style={styles.commentAuthor}>{comment.user || 'Utilisateur inconnu'}</Text>
                            <Text>{comment.content}</Text>
                        </Card>
                    ))
                ) : (
                    <Text style={{ fontStyle: 'italic', color: '#666' }}>Aucun commentaire.</Text>
                )}

                <Input
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <Button
                    title="Envoyer le commentaire"
                    onPress={handleCommentSubmit}
                    loading={commentMutation.isLoading}
                />
            </Card>

            <Overlay isVisible={showAssignModal} onBackdropPress={() => setShowAssignModal(false)}>
                <View style={{ padding: 20, width: 300 }}>
                    <Text h4 style={{ marginBottom: 10 }}>Assigner à</Text>
                    {usersData ? (
                        <FlatList
                            data={usersData.users || []}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.userItem}
                                    onPress={() => assignMutation.mutate(item.id)}
                                >
                                    <Text>{item.name} ({item.email})</Text>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <>
                            <Input
                                placeholder="ID utilisateur"
                                value={assignTo}
                                onChangeText={setAssignTo}
                            />
                            <Button
                                title="Assigner"
                                onPress={handleAssignManual}
                                loading={assignMutation.isLoading}
                            />
                        </>
                    )}
                </View>
            </Overlay>

            <Modal visible={!!imagePreview} transparent={true} onRequestClose={() => setImagePreview(null)}>
                <View style={styles.modalContainer}>
                    <Image source={{ uri: imagePreview }} style={styles.fullImage} resizeMode="contain" />
                    <Button title="Fermer" onPress={() => setImagePreview(null)} buttonStyle={{ marginTop: 20 }} />
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    info: { marginBottom: 6 },
    description: { marginVertical: 10 },
    sectionTitle: { marginTop: 16, fontWeight: 'bold', fontSize: 16 },
    commentBox: { backgroundColor: '#f5f5f5', marginVertical: 6 },
    commentAuthor: { fontWeight: 'bold', marginBottom: 4 },
    userItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '90%', height: '70%' }
});
