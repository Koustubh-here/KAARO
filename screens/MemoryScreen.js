import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const MemoryScreen = () => {
  const { user } = useAuth();
  const [kv, setKv] = useState([]);
  const [semantic, setSemantic] = useState([]);

  const load = async () => {
    if (!user?.id) return;
    const [{ data: kvRows }, { data: semRows }] = await Promise.all([
      supabase.from('ai_memory').select('key, value, updated_at').eq('user_id', user.id),
      supabase.from('user_memories').select('id, memory_text, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setKv(kvRows || []);
    setSemantic(semRows || []);
  };

  useEffect(() => { load(); }, [user?.id]);

  const exportAll = async () => {
    await load();
    const payload = JSON.stringify({ kv, semantic }, null, 2);
    await Share.share({ message: payload });
  };

  const deleteAll = async () => {
    if (!user?.id) return;
    Alert.alert('Delete all memories', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('ai_memory').delete().eq('user_id', user.id);
        await supabase.from('user_memories').delete().eq('user_id', user.id);
        await load();
      } }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.button} onPress={exportAll}><Text style={styles.buttonText}>Export</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.danger]} onPress={deleteAll}><Text style={styles.buttonText}>Delete All</Text></TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Key-Value</Text>
      <FlatList
        data={kv}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.item}><Text style={styles.itemTitle}>{item.key}</Text><Text style={styles.itemBody}>{JSON.stringify(item.value)}</Text></View>
        )}
      />
      <Text style={styles.sectionTitle}>Semantic</Text>
      <FlatList
        data={semantic}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}><Text style={styles.itemBody}>{item.memory_text}</Text></View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: '600' },
  button: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#4A69E2', borderRadius: 8, marginLeft: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  danger: { backgroundColor: '#C62828' },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 16, fontSize: 16, fontWeight: '600' },
  item: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 8 },
  itemTitle: { fontWeight: '600', marginBottom: 4 },
  itemBody: { color: '#333' },
});

export default MemoryScreen;


