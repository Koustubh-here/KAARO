import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { createProduct } from '../lib/db';

const theme = {
  colors: { primary: '#4A69E2', background: '#F7F8FC', surface: '#FFFFFF', text: '#121212', border: '#E8E9F1', white: '#FFFFFF' },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  borderRadius: { sm: 8 },
};

const AddProductScreen = ({ navigation }) => {
  const { t } = useI18n();
  const { business } = useAuth();
  const [name, setName] = useState('');
  const [stock, setStock] = useState('0');
  const [image, setImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('inventory.addProductBody'));
      return;
    }
    if (!business?.id) return;
    setIsLoading(true);
    const { error } = await createProduct(business.id, { name, stock: Number(stock || 0), image: image || null });
    setIsLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: theme.spacing.sm }}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('inventory.addProductTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>{t('inventory.productName') || 'Product name'}</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Apple" style={styles.input} />
        <Text style={styles.label}>{t('inventory.stock') || 'Stock'}</Text>
        <TextInput value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" style={styles.input} />
        <Text style={styles.label}>Image URL</Text>
        <TextInput value={image} onChangeText={setImage} placeholder="https://..." style={styles.input} />
        <TouchableOpacity style={styles.save} onPress={save} disabled={isLoading}>
          <Text style={styles.saveText}>{isLoading ? t('common.loading') : t('common.save') || 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg },
  title: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  form: { backgroundColor: theme.colors.surface, margin: theme.spacing.lg, padding: theme.spacing.lg, borderRadius: theme.borderRadius.sm },
  label: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xs, color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm, padding: theme.spacing.md },
  save: { backgroundColor: theme.colors.primary, marginTop: theme.spacing.lg, padding: theme.spacing.md, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  saveText: { color: theme.colors.white, fontWeight: '600' },
});

export default AddProductScreen;


