import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    FlatList,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomDropdown({ label, options, selected, onSelect }) {
    const [visible, setVisible] = useState(false);

    const handleSelect = (item) => {
        onSelect(item);
        setVisible(false);
    };

    return (
        <View style={styles.wrapper}>
            <Pressable style={styles.dropdown} onPress={() => setVisible(true)}>
                <Text style={selected ? styles.selectedText : styles.placeholderText}>
                    {selected ? selected.label : `Choisissez ${label}`}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#333" />
            </Pressable>

            <Modal
                transparent
                animationType="fade"
                visible={visible}
                onRequestClose={() => setVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.option}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={styles.optionText}>{item.label}</Text>
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 4,
        marginBottom: 12,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        backgroundColor: '#ffffffff',
        paddingVertical: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#000000',
        fontWeight: 'bold',
    },
    selectedText: {
        color: '#000000',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 10,
        maxHeight: '70%',
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    optionText: {
        fontSize: 16,
    },
});
