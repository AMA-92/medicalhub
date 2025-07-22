import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Settings, Store, Upload, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAppData } from '@/hooks/useFrameworkReady';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setSettings, saveAll, loadAll, setSales, setExpenses, setProducts } = useAppData();
  const [shopName, setShopName] = useState(settings.name);
  const [logoUri, setLogoUri] = useState<string | null>(settings.logoUri || null);
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [email, setEmail] = useState(settings.email || '');
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    setShopName(settings.name);
    setLogoUri(settings.logoUri || null);
    setPhone(settings.phone || '');
    setAddress(settings.address || '');
    setEmail(settings.email || '');
  }, [settings]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: false, // on va lire le fichier nous-même
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      // Convertir en base64
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const ext = uri.split('.').pop()?.toLowerCase() || 'png';
        const dataUrl = `data:image/${ext};base64,${base64}`;
        setLogoUri(dataUrl);
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de convertir l\'image en base64.');
        setLogoUri(null);
      }
    }
  };

  const saveSettings = () => {
    setSettings({ name: shopName, logoUri: logoUri || undefined, phone, address, email });
    saveAll();
    Alert.alert('Succès', 'Les paramètres ont été sauvegardés avec succès !');
  };

  const resetLogo = () => {
    Alert.alert(
      'Supprimer le logo',
      'Êtes-vous sûr de vouloir supprimer le logo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => setLogoUri(null)
        },
      ]
    );
  };

  const resetAllData = async () => {
    setShowCodePrompt(true);
  };

  const handleCodeSubmit = async () => {
    if (adminCode === 'admin') {
      setShowCodePrompt(false);
      setAdminCode('');
      Alert.alert(
        'Réinitialiser toutes les données',
        'Êtes-vous sûr de vouloir effacer toutes les données de l’application ? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Réinitialiser',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.clear();
              setProducts([]);
              setSales([]);
              setExpenses([]);
              setSettings({ name: 'Ma Boutique', logoUri: undefined });
              await loadAll();
              Alert.alert('Succès', 'Toutes les données ont été réinitialisées.');
              router.replace('/');
            }
          }
        ]
      );
    } else {
      Alert.alert('Code incorrect', 'Le code d’accès est incorrect.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Settings size={24} color="#8B5CF6" />
        </View>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de la boutique</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Store size={20} color="#8B5CF6" />
              <Text style={styles.settingTitle}>Nom de la boutique</Text>
            </View>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Nom de votre boutique"
            />
          </View>
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>Numéro de téléphone</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ex: +2250700000000"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>Adresse</Text>
            </View>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Ex: Abidjan, Cocody, Riviera 2"
            />
          </View>
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>E-mail</Text>
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Ex: contact@boutique.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Upload size={20} color="#8B5CF6" />
              <Text style={styles.settingTitle}>Logo de la boutique</Text>
            </View>
            
            <View style={styles.logoContainer}>
              {logoUri ? (
                <View style={styles.logoPreview}>
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                  <TouchableOpacity style={styles.removeLogoButton} onPress={resetLogo}>
                    <Text style={styles.removeLogoText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Upload size={32} color="#64748B" />
                  <Text style={styles.logoPlaceholderText}>Aucun logo sélectionné</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>
                  {logoUri ? 'Changer le logo' : 'Ajouter un logo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>À propos</Text>
            <Text style={styles.infoText}>
              Cette application vous permet de gérer votre boutique de manière efficace avec un suivi complet des ventes, des produits et des charges.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Fonctionnalités</Text>
            <Text style={styles.infoText}>
              • Gestion des produits{'\n'}
              • Suivi des ventes et modes de paiement{'\n'}
              • Gestion des charges par catégorie{'\n'}
              • Génération de rapports PDF{'\n'}
              • Facturation automatique{'\n'}
              • Suivi des dettes clients
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Sauvegarder les paramètres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#EF4444', marginTop: 16 }]} onPress={resetAllData}>
          <Text style={styles.saveButtonText}>Réinitialiser l’application</Text>
        </TouchableOpacity>
      </ScrollView>
      {showCodePrompt && (
        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: 300 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Code d’accès requis</Text>
            <TextInput
              placeholder="Entrer le code d’accès"
              secureTextEntry
              value={adminCode}
              onChangeText={setAdminCode}
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => { setShowCodePrompt(false); setAdminCode(''); }}>
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCodeSubmit}>
                <Text style={{ color: '#8B5CF6', fontWeight: 'bold' }}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeLogoButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeLogoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});