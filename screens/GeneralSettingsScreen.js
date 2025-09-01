import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const SectionHeader = ({ title, theme }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.subtleText }]}>{title}</Text>
);

const SettingsItem = ({ icon, label, children, theme, onPress, showChevron = false }) => (
    <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: theme.colors.surface }]} 
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
    >
        <Icon name={icon} size={24} color={theme.colors.primary} style={styles.itemIcon} />
        <Text style={[styles.itemLabel, { color: theme.colors.text }]}>{label}</Text>
        <View style={styles.itemAction}>
            {children}
            {showChevron && <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />}
        </View>
    </TouchableOpacity>
);

const GeneralSettingsScreen = ({ navigation }) => {
    const { theme, themeMode, setThemeMode } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(false);

    const handleThemeChange = (newTheme) => {
        setThemeMode(newTheme.toLowerCase());
    };

    const handleAccountPress = () => {
        Alert.alert('Account Management', 'This feature will be available in the next update!');
    };

    const handlePrivacyPress = () => {
        Alert.alert('Privacy Settings', 'Privacy settings coming soon!');
    };

    const handleSecurityPress = () => {
        Alert.alert('Security Settings', 'Security settings coming soon!');
    };

    const handleLanguagePress = () => {
        Alert.alert('Language Settings', 'Language selection coming soon!');
    };

    const handleHelpPress = () => {
        Alert.alert('Help & Support', 'Help center coming soon!');
    };

    const handleAboutPress = () => {
        Alert.alert('About', 'KAARO App v1.0.0\nBuilt with React Native');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Appearance Section */}
                <SectionHeader title="Appearance" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.themeSelector, { backgroundColor: theme.colors.background }]}>
                        {['Light', 'Dark', 'System'].map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.themeButton, 
                                    themeMode === opt.toLowerCase() && [styles.themeButtonActive, { backgroundColor: theme.colors.primary }]
                                ]}
                                onPress={() => handleThemeChange(opt)}
                            >
                                <Text style={[
                                    styles.themeButtonText, 
                                    { color: theme.colors.subtleText },
                                    themeMode === opt.toLowerCase() && [styles.themeButtonTextActive, { color: theme.colors.white }]
                                ]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Notifications Section */}
                <SectionHeader title="Notifications" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <SettingsItem 
                        icon="notifications" 
                        label="Push Notifications" 
                        theme={theme}
                    >
                        <Switch
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={theme.colors.white}
                            onValueChange={setPushNotifications}
                            value={pushNotifications}
                        />
                    </SettingsItem>
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                    <SettingsItem 
                        icon="email" 
                        label="Email Notifications" 
                        theme={theme}
                    >
                        <Switch
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={theme.colors.white}
                            onValueChange={setEmailNotifications}
                            value={emailNotifications}
                        />
                    </SettingsItem>
                </View>

                {/* Privacy & Security Section */}
                <SectionHeader title="Privacy & Security" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <SettingsItem 
                        icon="location-on" 
                        label="Location Services" 
                        theme={theme}
                    >
                        <Switch
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={theme.colors.white}
                            onValueChange={setLocationEnabled}
                            value={locationEnabled}
                        />
                    </SettingsItem>
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                    <SettingsItem 
                        icon="privacy-tip" 
                        label="Privacy Settings" 
                        theme={theme}
                        onPress={handlePrivacyPress}
                        showChevron
                    />
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                    <SettingsItem 
                        icon="security" 
                        label="Security" 
                        theme={theme}
                        onPress={handleSecurityPress}
                        showChevron
                    />
                </View>

                {/* Account Section */}
                <SectionHeader title="Account" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <SettingsItem 
                        icon="person" 
                        label="Manage Account" 
                        theme={theme}
                        onPress={handleAccountPress}
                        showChevron
                    />
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                    <SettingsItem 
                        icon="language" 
                        label="Language" 
                        theme={theme}
                        onPress={handleLanguagePress}
                        showChevron
                    />
                </View>

                {/* Support Section */}
                <SectionHeader title="Support" theme={theme} />
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <SettingsItem 
                        icon="help-outline" 
                        label="Help & Support" 
                        theme={theme}
                        onPress={handleHelpPress}
                        showChevron
                    />
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                    <SettingsItem 
                        icon="info-outline" 
                        label="About" 
                        theme={theme}
                        onPress={handleAboutPress}
                        showChevron
                    />
                </View>

                {/* Bottom spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16,
        paddingTop: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: { 
        fontFamily: 'Poppins-Bold', 
        fontSize: 24 
    },
    headerButton: { 
        width: 40, 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: 20,
    },
    scrollContent: { 
        padding: 24, 
        paddingTop: 16 
    },
    sectionHeader: { 
        fontFamily: 'Poppins-SemiBold', 
        fontSize: 18, 
        marginBottom: 16, 
        marginTop: 24, 
        paddingHorizontal: 8 
    },
    card: { 
        borderRadius: 16, 
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    itemContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 20,
        minHeight: 64,
    },
    itemIcon: { 
        marginRight: 16 
    },
    itemLabel: { 
        fontFamily: 'Poppins-Regular', 
        fontSize: 16, 
        flex: 1 
    },
    itemAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    separator: {
        height: 1,
        marginLeft: 60,
    },
    themeSelector: { 
        flexDirection: 'row', 
        borderRadius: 12, 
        padding: 4, 
        margin: 20 
    },
    themeButton: { 
        flex: 1, 
        paddingVertical: 12, 
        borderRadius: 10, 
        alignItems: 'center',
        marginHorizontal: 2,
    },
    themeButtonActive: { 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    themeButtonText: { 
        fontFamily: 'Poppins-Regular', 
        fontSize: 14 
    },
    themeButtonTextActive: { 
        fontFamily: 'Poppins-SemiBold' 
    },
    bottomSpacing: {
        height: 40,
    },
});

export default GeneralSettingsScreen;