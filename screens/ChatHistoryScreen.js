import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // ADDED

const ChatHistoryScreen = ({ navigation }) => {
  const { theme } = useTheme(); // ADDED
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Chat History</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={newChat}>
            <Text style={[styles.buttonText, { color: theme.colors.white }]}>New Chat</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.subtleText }]}>Loading chats…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.subtleText }]}>No chats yet. Start a new one!</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                navigation.navigate('Home', { openConversationId: item.id });
              }}
            >
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={[styles.itemBody, { color: theme.colors.subtleText }]}>{new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600',
  },
  button: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8,
  },
  buttonText: { 
    fontWeight: '600',
  },
  item: { 
    marginHorizontal: 16, 
    marginTop: 8, 
    padding: 12, 
    borderRadius: 8,
  },
  itemTitle: { 
    fontWeight: '600', 
    marginBottom: 4,
  },
  itemBody: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  emptyContainer: {
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
  }
});

export default ChatHistoryScreen;