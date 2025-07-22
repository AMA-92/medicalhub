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
import { CreditCard, Plus, Search, Calendar, TrendingDown, X, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { useAppData } from '@/hooks/useFrameworkReady';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const ExpenseCard = ({ expense, onEdit, onDelete }: { expense: Expense; onEdit: (expense: Expense) => void; onDelete: (id: string) => void }) => (
  <View style={styles.expenseCard}>
    <View style={styles.expenseHeader}>
      <View style={styles.expenseIcon}>
        <CreditCard size={20} color="#EF4444" />
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity onPress={() => onEdit(expense)} style={styles.actionButton}>
          <Edit3 size={16} color="#60A5FA" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(expense.id)} style={styles.actionButton}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{expense.category}</Text>
        </View>
      </View>
    </View>
    
    <Text style={styles.expenseDescription}>{expense.description}</Text>
    
    <View style={styles.expenseFooter}>
      <View style={styles.dateContainer}>
        <Calendar size={14} color="#64748B" />
        <Text style={styles.expenseDate}>{expense.date}</Text>
      </View>
      <Text style={styles.expenseAmount}>-{expense.amount} FCFA</Text>
    </View>
  </View>
);

export default function ExpensesScreen() {
  const { expenses, setExpenses, saveAll } = useAppData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
  });

  const categories = ['Loyer', 'Salaire', 'Livraison', 'Électricité', 'Eau', 'Autres'];

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
      });
    } else {
      setEditingExpense(null);
      setFormData({ description: '', amount: '', category: '' });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.description || !formData.amount || !formData.category) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    const expenseData: Expense = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: new Date().toLocaleDateString('fr-FR'),
    };
    if (editingExpense) {
      setExpenses((prev) => {
        const updated = prev.map(e => e.id === editingExpense.id ? expenseData : e);
        saveAll();
        return updated;
      });
    } else {
      setExpenses((prev) => {
        const updated = [expenseData, ...prev];
        saveAll();
        return updated;
      });
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette charge ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            setExpenses((prev) => {
              const updated = prev.filter(e => e.id !== id);
              saveAll();
              return updated;
            });
          }
        },
      ]
    );
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date.split('/').reverse().join('-'));
    const currentMonth = new Date().getMonth();
    return expenseDate.getMonth() === currentMonth;
  }).reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des charges</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingDown size={20} color="#EF4444" />
          <Text style={styles.statValue}>{totalExpenses} FCFA</Text>
          <Text style={styles.statLabel}>Total des charges</Text>
        </View>
        <View style={styles.statCard}>
          <Calendar size={20} color="#F59E0B" />
          <Text style={styles.statValue}>{monthlyExpenses} FCFA</Text>
          <Text style={styles.statLabel}>Ce mois-ci</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une charge..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.expensesList}>
          {filteredExpenses.map((expense) => (
            <ExpenseCard 
              key={expense.id} 
              expense={expense} 
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
                {editingExpense ? 'Modifier la charge' : 'Nouvelle charge'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Ex: Loyer boutique janvier"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Catégorie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                  <View style={styles.categoriesContainer}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryChip,
                          formData.category === category && styles.categoryChipSelected
                        ]}
                        onPress={() => setFormData({ ...formData, category })}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          formData.category === category && styles.categoryChipTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant (FCFA)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="225000"
                  keyboardType="numeric"
                />
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
                  {editingExpense ? 'Modifier' : 'Ajouter'}
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
    backgroundColor: '#EF4444',
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
  expensesList: {
    gap: 16,
    paddingBottom: 24,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseActions: {
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
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
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
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
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
    backgroundColor: '#EF4444',
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