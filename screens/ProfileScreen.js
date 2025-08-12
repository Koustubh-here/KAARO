import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error && error.code !== 'PGRST116') Alert.alert('Error', error.message);
    if (data) {
      setName(data.name || '');
      setBusinessName(data.business_name || '');
      setLocation(data.location || '');
      setPreferences(data.preferences ? JSON.stringify(data.preferences, null, 2) : '');
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let prefs = null;
      if (preferences && preferences.trim()) {
        try { prefs = JSON.parse(preferences); } catch { Alert.alert('Invalid JSON in Preferences'); setLoading(false); return; }
      }
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, name, business_name: businessName, location, preferences: prefs }, { onConflict: 'user_id' });
      if (error) throw error;
      Alert.alert('Saved');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

      <Text style={styles.label}>Business Name</Text>
      <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Business name" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" />

      <Text style={styles.label}>Preferences (JSON)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={preferences}
        onChangeText={setPreferences}
        placeholder={`{\n  "theme": "dark"\n}`}
        multiline
      />

      <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={save} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  multiline: { height: 140, textAlignVertical: 'top' },
  button: { marginTop: 20, backgroundColor: '#4A69E2', paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});

export default ProfileScreen;


