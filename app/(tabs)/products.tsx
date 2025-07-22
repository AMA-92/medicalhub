import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Package, Plus, Search, CreditCard as Edit3, Trash2, X } from 'lucide-react-native';
import { useAppData, Product } from '@/hooks/useFrameworkReady';

const ProductCard = ({ product, onEdit, onDelete }: any) => (
  <View style={styles.productCard}>
    <View style={styles.productHeader}>
      <View style={styles.productIcon}>
        <Package size={20} color="#8B5CF6" />
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity onPress={() => onEdit(product)} style={styles.actionButton}>
          <Edit3 size={16} color="#60A5FA" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(product.id)} style={styles.actionButton}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
    
    <Text style={styles.productName}>{product.name}</Text>
    <Text style={styles.productCategory}>{product.category}</Text>
    
    <View style={styles.productDetails}>
      <View style={styles.productPrice}>
        <Text style={styles.priceLabel}>Prix</Text>
        <Text style={styles.priceValue}>{product.price} FCFA</Text>
      </View>
      <View style={styles.productStock}>
        <Text style={styles.stockLabel}>Stock</Text>
        <Text style={[styles.stockValue, { color: product.stock > 10 ? '#10B981' : '#EF4444' }]}>
          {product.stock}
        </Text>
      </View>
    </View>
  </View>
);

export default function ProductsScreen() {
  const { products, setProducts, saveAll } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', category: '' });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      category: formData.category,
    };
    if (editingProduct) {
      setProducts((prev: Product[]) => {
        const updated = prev.map((p: Product) => p.id === editingProduct.id ? productData : p);
        saveAll();
        return updated;
      });
    } else {
      setProducts((prev: Product[]) => {
        const updated = [productData, ...prev];
        saveAll();
        return updated;
      });
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            setProducts((prev: Product[]) => {
              const updated = prev.filter((p: Product) => p.id !== id);
              saveAll();
              return updated;
            });
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des produits</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openModal}
              onDelete={handleDelete}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom du produit</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ex: T-shirt Premium"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Catégorie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="Ex: Vêtements"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Prix (FCFA)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="12500"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                  <Text style={styles.label}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    placeholder="50"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  productsGrid: {
    gap: 16,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  productStock: {
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});