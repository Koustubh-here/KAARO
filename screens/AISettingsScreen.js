import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Re-using the theme for consistency
const theme = {
    colors: { primary: '#4A69E2', background: '#F7F8FC', surface: '#FFFFFF', text: '#121212', subtleText: '#6E717A', border: '#E8E9F1', white: '#FFFFFF' },
    spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
    typography: {
        h1: { fontFamily: 'Poppins-Bold', fontSize: 24 },
        h2: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        body: { fontFamily: 'Poppins-Regular', fontSize: 16 },
        subtext: { fontFamily: 'Poppins-Regular', fontSize: 14 },
    },
    borderRadius: { md: 16 },
};

const SectionHeader = ({ title }) => <Text style={styles.sectionHeader}>{title}</Text>;

const SettingsItem = ({ icon, label, value, onPress, children }) => (
    <TouchableOpacity onPress={onPress} style={styles.itemContainer}>
        <Icon name={icon} size={24} color={theme.colors.primary} style={styles.itemIcon} />
        <View style={styles.itemContent}>
            <Text style={styles.itemLabel}>{label}</Text>
            {value && <Text style={styles.itemValue}>{value}</Text>}
        </View>
        {children ? children : <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />}
    </TouchableOpacity>
);

const AISettingsScreen = ({ navigation }) => {
    const [isProactive, setIsProactive] = React.useState(true);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Settings</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <SectionHeader title="Knowledge & Behavior" />
                <View style={styles.card}>
                    <SettingsItem icon="storage" label="Knowledge Base" value="Business Data Q3/2025" onPress={() => {}} />
                    <View style={styles.divider} />
                    <SettingsItem icon="auto-awesome" label="Proactive Suggestions">
                        <TouchableOpacity onPress={() => setIsProactive(!isProactive)} style={[styles.toggleBase, isProactive && styles.toggleActive]}>
                           <View style={[styles.toggleCircle, isProactive && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                    </SettingsItem>
                </View>

                <SectionHeader title="Language & Tone" />
                <View style={styles.card}>
                    <SettingsItem icon="translate" label="Language" value="English (US)" onPress={() => {}} />
                    <View style={styles.divider} />
                    <SettingsItem icon="record-voice-over" label="Response Tone" value="Professional" onPress={() => {}} />
                </View>

                <SectionHeader title="Data" />
                <View style={styles.card}>
                     <SettingsItem icon="history" label="Clear Chat History" onPress={() => {}} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles for this screen
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
    itemContent: { flex: 1 },
    itemLabel: { ...theme.typography.body, color: theme.colors.text, fontSize: 16 },
    itemValue: { ...theme.typography.subtext, color: theme.colors.subtleText },
    divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: theme.spacing.lg * 2 + 24 },
    toggleBase: { width: 50, height: 28, borderRadius: 15, backgroundColor: theme.colors.border, justifyContent: 'center', padding: 2 },
    toggleActive: { backgroundColor: theme.colors.primary },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.white, alignSelf: 'flex-start' },
    toggleCircleActive: { alignSelf: 'flex-end' }
});

export default AISettingsScreen;