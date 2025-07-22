import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, Package, ShoppingCart, CreditCard, DollarSign, Users, ArrowUpRight, LogOut, TriangleAlert as AlertTriangle, FileText, X } from 'lucide-react-native';
import { generateSalesReport, generateExpensesReport, generateBalanceReport, type FilterPeriod } from '@/utils/pdfGenerator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateSalesReportHtml, generateExpensesReportHtml, generateBalanceReportHtml } from '@/utils/pdfGenerator';
import { useAppData } from '@/hooks/useFrameworkReady';

const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}> 
    <View style={styles.statHeader}>
      <Icon size={24} color={color} />
      <View style={styles.changeContainer}>
        <ArrowUpRight size={16} color="#10B981" />
        <Text style={styles.changeText}>{change}</Text>
      </View>
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();
  const [reportModalVisible, setReportModalVisible] = React.useState(false);
  const [selectedReportType, setSelectedReportType] = React.useState<'balance' | 'sales' | 'expenses'>('balance');
  const { sales, expenses, products, settings } = useAppData();

  // Calculs dynamiques
  const totalDebts = sales.filter(s => s.paymentMethod === 'debt' && !s.isPaid).reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const today = new Date().toLocaleDateString('fr-FR');
  const todaySales = sales.filter(sale => sale.date === today).length;
  const uniqueClients = new Set(sales.map(sale => sale.customerName)).size;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  const openReportModal = (type: 'balance' | 'sales' | 'expenses') => {
    setSelectedReportType(type);
    setReportModalVisible(true);
  };

  const generateReport = async (period: FilterPeriod) => {
    try {
      switch (selectedReportType) {
        case 'balance': {
          const filteredSales = sales.filter(sale => {
            const itemDate = new Date(sale.date.split('/').reverse().join('-'));
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            switch (period) {
              case 'day':
                return itemDate.toDateString() === today.toDateString();
              case 'week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDate >= weekStart && itemDate <= weekEnd;
              }
              case 'month':
                return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
              case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                const quarterStart = quarter * 3;
                const quarterEnd = quarterStart + 2;
                return itemDate.getFullYear() === today.getFullYear() && itemDate.getMonth() >= quarterStart && itemDate.getMonth() <= quarterEnd;
              }
              default:
                return true;
            }
          });
          const filteredExpenses = expenses.filter(expense => {
            const itemDate = new Date(expense.date.split('/').reverse().join('-'));
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            switch (period) {
              case 'day':
                return itemDate.toDateString() === today.toDateString();
              case 'week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDate >= weekStart && itemDate <= weekEnd;
              }
              case 'month':
                return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
              case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                const quarterStart = quarter * 3;
                const quarterEnd = quarterStart + 2;
                return itemDate.getFullYear() === today.getFullYear() && itemDate.getMonth() >= quarterStart && itemDate.getMonth() <= quarterEnd;
              }
              default:
                return true;
            }
          });
          const html = generateBalanceReportHtml(filteredSales, filteredExpenses, period, settings.logoUri, settings.phone, settings.address, settings.email);
          const { uri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('PDF généré', 'Le PDF a été généré à l\'emplacement : ' + uri);
          }
          break;
        }
        case 'sales': {
          // Génération du HTML
          const filteredSales = sales.filter(sale => {
            const itemDate = new Date(sale.date.split('/').reverse().join('-'));
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            switch (period) {
              case 'day':
                return itemDate.toDateString() === today.toDateString();
              case 'week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDate >= weekStart && itemDate <= weekEnd;
              }
              case 'month':
                return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
              case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                const quarterStart = quarter * 3;
                const quarterEnd = quarterStart + 2;
                return itemDate.getFullYear() === today.getFullYear() && itemDate.getMonth() >= quarterStart && itemDate.getMonth() <= quarterEnd;
              }
              default:
                return true;
            }
          });
          const html = generateSalesReportHtml(filteredSales, period, settings.logoUri, settings.phone, settings.address, settings.email);
          const { uri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('PDF généré', 'Le PDF a été généré à l\'emplacement : ' + uri);
          }
          break;
        }
        case 'expenses': {
          const filteredExpenses = expenses.filter(expense => {
            const itemDate = new Date(expense.date.split('/').reverse().join('-'));
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            switch (period) {
              case 'day':
                return itemDate.toDateString() === today.toDateString();
              case 'week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDate >= weekStart && itemDate <= weekEnd;
              }
              case 'month':
                return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
              case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                const quarterStart = quarter * 3;
                const quarterEnd = quarterStart + 2;
                return itemDate.getFullYear() === today.getFullYear() && itemDate.getMonth() >= quarterStart && itemDate.getMonth() <= quarterEnd;
              }
              default:
                return true;
            }
          });
          const html = generateExpensesReportHtml(filteredExpenses, period, settings.logoUri, settings.phone, settings.address, settings.email);
          const { uri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('PDF généré', 'Le PDF a été généré à l\'emplacement : ' + uri);
          }
          break;
        }
      }
      setReportModalVisible(false);
      Alert.alert('Succès', 'Le rapport PDF a été généré et téléchargé.');
    } catch (error: any) {
      console.error('Erreur lors de la génération du rapport PDF:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la génération du rapport.\n' + (error && error.message ? error.message : ''));
    }
  };

  const getReportTitle = () => {
    switch (selectedReportType) {
      case 'balance': return 'Bilan';
      case 'sales': return 'Rapport Ventes';
      case 'expenses': return 'Rapport Charges';
      default: return 'Rapport';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{settings.name || 'Ma Boutique'}</Text>
          <Text style={styles.subtitle}>Bienvenue</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            icon={DollarSign}
            title="Chiffre d'affaires"
            value={`${totalSales} FCFA`}
            change=""
            color="#8B5CF6"
          />
          <StatCard
            icon={Package}
            title="Produits en stock"
            value={
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>{`${totalStockValue} FCFA`}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 2 }}>{`${totalStock} articles`}</Text>
              </View>
            }
            change=""
            color="#60A5FA"
          />
          <StatCard
            icon={ShoppingCart}
            title="Ventes aujourd'hui"
            value={todaySales.toString()}
            change=""
            color="#10B981"
          />
          <StatCard
            icon={Users}
            title="Clients"
            value={uniqueClients.toString()}
            change=""
            color="#F59E0B"
          />
          <StatCard
            icon={AlertTriangle}
            title="Dettes en cours"
            value={`${totalDebts} FCFA`}
            change=""
            color="#EF4444"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Package size={32} color="#8B5CF6" />
              <Text style={styles.actionTitle}>Gérer les produits</Text>
              <Text style={styles.actionSubtitle}>Ajouter ou modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/sales')}
            >
              <ShoppingCart size={32} color="#60A5FA" />
              <Text style={styles.actionTitle}>Nouvelle vente</Text>
              <Text style={styles.actionSubtitle}>Enregistrer une vente</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé financier</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Recettes du mois</Text>
              <Text style={styles.financialValue}>{`${totalSales} FCFA`}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Charges du mois</Text>
              <Text style={styles.financialValueNegative}>{`-${totalExpenses} FCFA`}</Text>
            </View>
            <View style={[styles.financialRow, styles.financialTotal]}>
              <Text style={styles.financialTotalLabel}>Bénéfice net</Text>
              <Text style={styles.financialTotalValue}>{`${netProfit} FCFA`}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rapports</Text>
          <View style={styles.reportsContainer}>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => openReportModal('balance')}
            >
              <FileText size={20} color="#8B5CF6" />
              <Text style={styles.reportButtonText}>Bilan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => openReportModal('sales')}
            >
              <FileText size={20} color="#60A5FA" />
              <Text style={styles.reportButtonText}>Rapport Ventes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => openReportModal('expenses')}
            >
              <FileText size={20} color="#EF4444" />
              <Text style={styles.reportButtonText}>Rapport Charges</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getReportTitle()}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choisissez la période pour le rapport :</Text>

            <View style={styles.periodButtons}>
              <TouchableOpacity 
                style={styles.periodButton}
                onPress={() => generateReport('day')}
              >
                <Text style={styles.periodButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.periodButton}
                onPress={() => generateReport('week')}
              >
                <Text style={styles.periodButtonText}>Cette semaine</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.periodButton}
                onPress={() => generateReport('month')}
              >
                <Text style={styles.periodButtonText}>Ce mois</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.periodButton}
                onPress={() => generateReport('quarter')}
              >
                <Text style={styles.periodButtonText}>Ce trimestre</Text>
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsGrid: {
    marginTop: 24,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  financialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  financialLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  financialValueNegative: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  financialTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  financialTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  financialTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  reportsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  reportButton: {
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
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  periodButtons: {
    gap: 12,
  },
  periodButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});