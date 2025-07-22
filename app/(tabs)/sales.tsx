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
import { ShoppingCart, Plus, Search, Calendar, DollarSign, X, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { generateInvoiceHtml } from '@/utils/pdfGenerator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAppData } from '@/hooks/useFrameworkReady';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number; // Added stock to the Product interface
}

interface Sale {
  id: string;
  customerName: string;
  items: { productId: string; productName: string; quantity: number; price: number }[];
  total: number;
  date: string;
  status: 'completed' | 'pending';
  paymentMethod: 'cash' | 'wave' | 'orange' | 'debt';
  isPaid: boolean;
}

const SaleCard = ({ sale, onEdit, onDelete, onPayDebt }: { 
  sale: Sale; 
  onEdit: (sale: Sale) => void; 
  onDelete: (id: string) => void;
  onPayDebt: (id: string) => void;
}) => {
  const isDebt = sale.paymentMethod === 'debt' && !sale.isPaid;
  const { settings } = useAppData();
  
  const handleDoublePress = () => {
    if (isDebt) {
      Alert.alert(
        'Rembourser la dette',
        `Marquer cette vente de ${sale.total} FCFA comme remboursée ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Remboursé', 
            onPress: () => onPayDebt(sale.id)
          },
        ]
      );
    }
  };

  const handleLongPress = async () => {
    Alert.alert(
      'Générer une facture',
      `Voulez-vous générer une facture pour cette vente ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Générer', 
          onPress: async () => {
            try {
              const html = generateInvoiceHtml(sale, settings.logoUri, settings.phone, settings.address, settings.email);
              const { uri } = await Print.printToFileAsync({ html });
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
              } else {
                Alert.alert('PDF généré', 'Le PDF a été généré à l\'emplacement : ' + uri);
              }
              Alert.alert('Succès', 'La facture PDF a été générée et téléchargée.');
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la génération de la facture.');
            }
          }
        },
      ]
    );
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'wave': return 'Wave';
      case 'orange': return 'Orange Money';
      case 'debt': return 'Dette';
      default: return method;
    }
  };

  return (
  <TouchableOpacity 
    style={[styles.saleCard, isDebt && styles.debtCard]} 
    onPress={handleDoublePress}
    onLongPress={handleLongPress}
    // disabled={!isDebt} // On retire la désactivation pour permettre l'appui long sur toutes les ventes
  >
    <View style={styles.saleHeader}>
      <View style={styles.saleIcon}>
        <ShoppingCart size={20} color="#60A5FA" />
      </View>
      <View style={styles.saleActions}>
        <TouchableOpacity onPress={() => onEdit(sale)} style={styles.actionButton}>
          <Edit3 size={16} color="#60A5FA" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(sale.id)} style={styles.actionButton}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: sale.status === 'completed' ? '#DCFCE7' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: sale.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
            {sale.status === 'completed' ? 'Terminée' : 'En cours'}
          </Text>
        </View>
      </View>
    </View>
    
    <Text style={styles.customerName}>{sale.customerName}</Text>
    <Text style={styles.saleItems}>
      {sale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
    </Text>
    
    <View style={styles.paymentMethodContainer}>
      <Text style={styles.paymentMethodLabel}>Paiement:</Text>
      <Text style={[styles.paymentMethodText, isDebt && styles.debtText]}>
        {getPaymentMethodText(sale.paymentMethod)}
      </Text>
    </View>
    
    <View style={styles.saleFooter}>
      <View style={styles.dateContainer}>
        <Calendar size={14} color="#64748B" />
        <Text style={styles.saleDate}>{sale.date}</Text>
      </View>
      <Text style={styles.saleTotal}>{sale.total} FCFA</Text>
    </View>
  </TouchableOpacity>
  );
};

const ProductSelector = ({ products, selectedItems, onItemsChange }: any) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const addProduct = (product: Product) => {
    if (product.stock <= 0) return; // Ne rien faire si stock épuisé
    const existingItem = selectedItems.find((item: any) => item.productId === product.id);
    if (existingItem) {
      onItemsChange(selectedItems.map((item: any) => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      onItemsChange([...selectedItems, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
    setShowDropdown(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      onItemsChange(selectedItems.filter((item: any) => item.productId !== productId));
    } else {
      onItemsChange(selectedItems.map((item: any) => 
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  return (
    <View style={styles.productSelector}>
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <Text style={styles.dropdownButtonText}>Ajouter un produit</Text>
        <Plus size={20} color="#8B5CF6" />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdown}>
          {products.map((product: Product) => (
            <TouchableOpacity
              key={product.id}
              style={[styles.dropdownItem, product.stock <= 0 && { opacity: 0.5 }]}
              onPress={() => addProduct(product)}
              disabled={product.stock <= 0}
            >
              <Text style={styles.dropdownItemText}>{product.name}</Text>
              <Text style={styles.dropdownItemPrice}>{product.price} FCFA</Text>
              {product.stock <= 0 && (
                <Text style={{ color: '#EF4444', fontSize: 10, marginLeft: 8 }}>(Rupture)</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedItems.length > 0 && (
        <View style={styles.selectedItems}>
          <Text style={styles.selectedItemsTitle}>Articles sélectionnés:</Text>
          {selectedItems.map((item: any) => (
            <View key={item.productId} style={styles.selectedItem}>
              <Text style={styles.selectedItemName}>{item.productName}</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedItemTotal}>{item.price * item.quantity} FCFA</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function SalesScreen() {
  const { sales, setSales, saveAll, products, setProducts } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    selectedItems: [] as any[],
    paymentMethod: 'cash' as 'cash' | 'wave' | 'orange' | 'debt',
  });

  const filteredSales = sales.filter(sale =>
    sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openModal = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        customerName: sale.customerName,
        selectedItems: sale.items,
        paymentMethod: sale.paymentMethod,
      });
    } else {
      setEditingSale(null);
      setFormData({ customerName: '', selectedItems: [], paymentMethod: 'cash' });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.customerName || formData.selectedItems.length === 0 || !formData.paymentMethod) {
      Alert.alert('Erreur', 'Le nom du client, au moins un article et le mode de paiement sont obligatoires');
      return;
    }
    const total = formData.selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const saleData = {
      customerName: formData.customerName,
      items: formData.selectedItems,
      total,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'completed' as const,
      paymentMethod: formData.paymentMethod,
      isPaid: formData.paymentMethod !== 'debt',
    };
    if (editingSale) {
      // Synchronisation du stock lors de la modification d'une vente
      setProducts((prev) => {
        let updated = [...prev];
        // 1. Restaurer le stock de l'ancienne vente
        editingSale.items.forEach((oldItem: any) => {
          const idx = updated.findIndex(p => p.id === oldItem.productId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], stock: updated[idx].stock + oldItem.quantity };
          }
        });
        // 2. Décrémenter le stock selon la nouvelle vente
        formData.selectedItems.forEach((newItem: any) => {
          const idx = updated.findIndex(p => p.id === newItem.productId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], stock: Math.max(0, updated[idx].stock - newItem.quantity) };
          }
        });
        return updated;
      });
      setSales((prev) => {
        const updated = prev.map(s => s.id === editingSale.id ? { ...saleData, id: editingSale.id } : s);
        saveAll();
        return updated;
      });
    } else {
      const newSale = {
        ...saleData,
        id: Date.now().toString(),
      };
      setSales((prev) => {
        const updated = [newSale, ...prev];
        saveAll();
        return updated;
      });
      // Décrémenter le stock des produits concernés
      setProducts((prev) => {
        const updated = prev.map(prod => {
          const soldItem = formData.selectedItems.find((item: any) => item.productId === prod.id);
          if (soldItem) {
            return { ...prod, stock: Math.max(0, prod.stock - soldItem.quantity) };
          }
          return prod;
        });
        return updated;
      });
    }
    setModalVisible(false);
  };

  const handlePayDebt = (id: string) => {
    setSales((prev) => {
      const updated = prev.map(s => s.id === id ? { ...s, isPaid: true } : s);
      saveAll();
      return updated;
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette vente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            // Restaurer le stock des produits concernés par la vente supprimée
            const saleToDelete = sales.find(s => s.id === id);
            if (saleToDelete) {
              setProducts((prev) => {
                let updated = [...prev];
                saleToDelete.items.forEach((item: any) => {
                  const idx = updated.findIndex(p => p.id === item.productId);
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], stock: updated[idx].stock + item.quantity };
                  }
                });
                return updated;
              });
            }
            setSales((prev) => {
              const updated = prev.filter(s => s.id !== id);
              saveAll();
              return updated;
            });
          }
        },
      ]
    );
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = sales.filter(sale => sale.date === new Date().toLocaleDateString('fr-FR'));
  const totalDebts = sales
    .filter(sale => sale.paymentMethod === 'debt' && !sale.isPaid)
    .reduce((sum, sale) => sum + sale.total, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des ventes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <DollarSign size={20} color="#60A5FA" />
          <Text style={styles.statValue}>{totalSales} FCFA</Text>
          <Text style={styles.statLabel}>Total des ventes</Text>
        </View>
        <View style={styles.statCard}>
          <ShoppingCart size={20} color="#10B981" />
          <Text style={styles.statValue}>{todaySales.length}</Text>
          <Text style={styles.statLabel}>Ventes aujourd'hui</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une vente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.salesList}>
          {filteredSales.map((sale) => (
            <SaleCard 
              key={sale.id} 
              sale={sale} 
              onEdit={openModal}
              onDelete={handleDelete}
              onPayDebt={handlePayDebt}
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
                {editingSale ? 'Modifier la vente' : 'Nouvelle vente'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom du client</Text>
                <TextInput
                  style={styles.input}
                  value={formData.customerName}
                  onChangeText={(text) => setFormData({ ...formData, customerName: text })}
                  placeholder="Ex: Marie Dubois"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Articles</Text>
                <ProductSelector
                  products={products}
                  selectedItems={formData.selectedItems}
                  onItemsChange={(items: any[]) => setFormData({ ...formData, selectedItems: items })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mode de paiement</Text>
                <View style={styles.paymentMethodsContainer}>
                  {[
                    { key: 'cash', label: 'Espèces' },
                    { key: 'wave', label: 'Wave' },
                    { key: 'orange', label: 'Orange Money' },
                    { key: 'debt', label: 'Dette' }
                  ].map((method) => (
                    <TouchableOpacity
                      key={method.key}
                      style={[
                        styles.paymentMethodChip,
                        formData.paymentMethod === method.key && styles.paymentMethodChipSelected
                      ]}
                      onPress={() => setFormData({ ...formData, paymentMethod: method.key as any })}
                    >
                      <Text style={[
                        styles.paymentMethodChipText,
                        formData.paymentMethod === method.key && styles.paymentMethodChipTextSelected
                      ]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.selectedItems.length > 0 && (
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    {formData.selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)} FCFA
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingSale ? 'Modifier' : 'Enregistrer'}
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
    backgroundColor: '#60A5FA',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
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
  salesList: {
    gap: 16,
    paddingBottom: 24,
  },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  saleItems: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saleDate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#60A5FA',
  },
  debtCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  debtText: {
    color: '#EF4444',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentMethodChipSelected: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  paymentMethodChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentMethodChipTextSelected: {
    color: '#FFFFFF',
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
    maxHeight: '90%',
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
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
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
  productSelector: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  dropdownItemPrice: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  selectedItems: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  selectedItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedItemName: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  selectedItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
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
    backgroundColor: '#60A5FA',
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