import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Re-using the theme for consistency
const theme = {
    colors: { primary: '#4A69E2', background: '#F7F8FC', surface: '#FFFFFF', text: '#121212', subtleText: '#6E717A', border: '#E8E9F1', white: '#FFFFFF' },
    spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
    typography: {
        h1: { fontFamily: 'Poppins-Bold', fontSize: 24 },
        h2: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        body: { fontFamily: 'Poppins-Regular', fontSize: 16 },
    },
    borderRadius: { md: 16 },
};


const SectionHeader = ({ title }) => <Text style={styles.sectionHeader}>{title}</Text>;
const SettingsItem = ({ icon, label, children, isFirst }) => (
    <View style={[styles.itemContainer, isFirst && {borderTopWidth: 0}]}>
        <Icon name={icon} size={24} color={theme.colors.primary} style={styles.itemIcon} />
        <Text style={styles.itemLabel}>{label}</Text>
        {children}
    </View>
);

const GeneralSettingsScreen = ({ navigation }) => {
    const [themeOption, setThemeOption] = useState('Light');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <SectionHeader title="Appearance" />
                <View style={styles.card}>
                    <View style={styles.themeSelector}>
                        {['Light', 'Dark', 'System'].map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.themeButton, themeOption === opt && styles.themeButtonActive]}
                                onPress={() => setThemeOption(opt)}>
                                <Text style={[styles.themeButtonText, themeOption === opt && styles.themeButtonTextActive]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <SectionHeader title="Notifications" />
                <View style={styles.card}>
                    <SettingsItem icon="notifications" label="Push Notifications">
                        <Switch
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={theme.colors.white}
                            onValueChange={() => setNotificationsEnabled(prev => !prev)}
                            value={notificationsEnabled}
                        />
                    </SettingsItem>
                </View>
                
                <SectionHeader title="Account" />
                <View style={styles.card}>
                    <TouchableOpacity>
                         <SettingsItem icon="person" label="Manage Account">
                             <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
                         </SettingsItem>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md,paddingTop:30 },
    headerTitle: { ...theme.typography.h1, color: theme.colors.text },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.md },
    sectionHeader: { ...theme.typography.h2, color: theme.colors.subtleText, marginBottom: theme.spacing.md, marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.sm },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, overflow: 'hidden' },
    itemContainer: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.surface },
    itemIcon: { marginRight: theme.spacing.lg },
    itemLabel: { ...theme.typography.body, color: theme.colors.text, fontSize: 16, flex: 1 },
    themeSelector: { flexDirection: 'row', backgroundColor: theme.colors.background, borderRadius: 10, padding: theme.spacing.xs, margin: theme.spacing.lg },
    themeButton: { flex: 1, paddingVertical: theme.spacing.sm, borderRadius: 8, alignItems: 'center' },
    themeButtonActive: { backgroundColor: theme.colors.white },
    themeButtonText: { ...theme.typography.body, color: theme.colors.subtleText, fontSize: 14 },
    themeButtonTextActive: { color: theme.colors.primary, fontFamily: 'Poppins-SemiBold' },
});

export default GeneralSettingsScreen;