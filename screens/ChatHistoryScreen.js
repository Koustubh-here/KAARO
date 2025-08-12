import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ChatHistoryScreen = ({ navigation }) => {
  const { user, business } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const newChat = async () => {
    const { data } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, business_id: business?.id || null, title: `chat-${new Date().toISOString()}` })
      .select('id')
      .single();
    if (data?.id) navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat History</Text>
        <TouchableOpacity style={styles.button} onPress={newChat}><Text style={styles.buttonText}>New Chat</Text></TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8 }}>Loading chats…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <View style={{ padding: 24 }}>
              <Text style={{ textAlign: 'center', color: '#6E717A' }}>No chats yet. Start a new one!</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                // Pass back selected conversation id; Home screen will read it from params if needed
                navigation.navigate('Home', { openConversationId: item.id });
              }}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: '600' },
  button: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#4A69E2', borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  item: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 8 },
  itemTitle: { fontWeight: '600', marginBottom: 4 },
  itemBody: { color: '#333' },
});

export default ChatHistoryScreen;


