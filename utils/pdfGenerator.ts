import jsPDF from 'jspdf';

interface ShopSettings {
  name: string;
  logoUri?: string;
}

// Dans une vraie app, ces données viendraient d'AsyncStorage ou d'une base de données
const getShopSettings = (): ShopSettings => {
  return {
    name: 'Ma Boutique',
    logoUri: undefined // Sera remplacé par l'URI du logo si disponible
  };
};

const addLogoToPDF = (doc: jsPDF, logoUri?: string) => {
  if (logoUri && logoUri.startsWith('data:image/')) {
    try {
      doc.addImage(logoUri, 'PNG', 20, 10, 30, 30);
    } catch (error) {
      // Si le logo ne peut pas être chargé, on continue sans
    }
  }
};

export interface Sale {
  id: string;
  customerName: string;
  items: { productId: string; productName: string; quantity: number; price: number }[];
  total: number;
  date: string;
  status: 'completed' | 'pending';
  paymentMethod: 'cash' | 'wave' | 'orange' | 'debt';
  isPaid: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export type FilterPeriod = 'day' | 'week' | 'month' | 'quarter';

export const filterDataByPeriod = (data: any[], period: FilterPeriod): any[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return data.filter((item: any) => {
    const itemDate = new Date(item.date.split('/').reverse().join('-'));
    
    switch (period) {
      case 'day':
        return itemDate.toDateString() === today.toDateString();
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return itemDate >= weekStart && itemDate <= weekEnd;
      
      case 'month':
        return itemDate.getMonth() === today.getMonth() && 
               itemDate.getFullYear() === today.getFullYear();
      
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = quarter * 3;
        const quarterEnd = quarterStart + 2;
        return itemDate.getFullYear() === today.getFullYear() &&
               itemDate.getMonth() >= quarterStart && 
               itemDate.getMonth() <= quarterEnd;
      
      default:
        return true;
    }
  });
};

export const getPeriodLabel = (period: FilterPeriod): string => {
  switch (period) {
    case 'day': return 'Aujourd\'hui';
    case 'week': return 'Cette semaine';
    case 'month': return 'Ce mois';
    case 'quarter': return 'Ce trimestre';
    default: return '';
  }
};

export const generateSalesReport = (sales: Sale[], period: FilterPeriod, logoUri?: string): void => {
  const filteredSales = filterDataByPeriod(sales, period);
  const total = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const shopSettings = getShopSettings();
  
  const doc = new jsPDF();
  
  // Logo
  addLogoToPDF(doc, logoUri);
  
  // Header
  doc.setFontSize(20);
  doc.text(`${shopSettings.name.toUpperCase()}`, 20, 20);
  doc.setFontSize(16);
  doc.text('RAPPORT DES VENTES', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Période: ${getPeriodLabel(period)}`, 20, 45);
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);
  
  // Table header
  let yPosition = 75;
  doc.setFontSize(10);
  doc.text('Date', 20, yPosition);
  doc.text('Client', 50, yPosition);
  doc.text('Articles', 100, yPosition);
  doc.text('Paiement', 140, yPosition);
  doc.text('Montant', 170, yPosition);
  
  // Draw line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 10;
  
  // Table content
  filteredSales.forEach((sale) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    const itemsText = sale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
    const paymentText = sale.paymentMethod === 'cash' ? 'Espèces' : 
                       sale.paymentMethod === 'wave' ? 'Wave' :
                       sale.paymentMethod === 'orange' ? 'Orange Money' : 'Dette';
    
    doc.text(sale.date, 20, yPosition);
    doc.text(sale.customerName.substring(0, 15), 50, yPosition);
    doc.text(itemsText.substring(0, 20) + (itemsText.length > 20 ? '...' : ''), 100, yPosition);
    doc.text(paymentText, 140, yPosition);
    doc.text(`${sale.total} FCFA`, 170, yPosition);
    
    yPosition += 8;
  });
  
  // Total
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  doc.setFontSize(12);
  doc.text(`TOTAL: ${total} FCFA`, 140, yPosition);
  
  // Save
  doc.save(`rapport-ventes-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export function generateSalesReportHtml(sales: Sale[], period: FilterPeriod, logoUri?: string, phone?: string, address?: string, email?: string): string {
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);
  const contactBlock = (phone || email || address)
    ? `<div class="contact">
        ${phone ? `<div>${phone}</div>` : ''}
        ${email ? `<div>${email}</div>` : ''}
        ${address ? `<div>${address}</div>` : ''}
      </div>`
    : '';
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { color: #8B5CF6; }
          .logo { float: right; margin-top: 0; margin-bottom: 16px; max-height: 60px; }
          .contact { text-align: right; font-size: 14px; color: #64748B; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px; font-size: 12px; }
          th { background: #F3F4F6; }
          tfoot td { font-weight: bold; background: #F3F4F6; }
        </style>
      </head>
      <body>
        ${logoUri && logoUri.startsWith('data:image/') ? `<img src="${logoUri}" class="logo" />` : ''}
        <h1>Rapport des ventes</h1>
        <p><strong>Période :</strong> ${getPeriodLabel(period)}</p>
        ${contactBlock}
        <p><strong>Date de génération :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Articles</th>
              <th>Paiement</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map(sale => `
              <tr>
                <td>${sale.date}</td>
                <td>${sale.customerName}</td>
                <td>${sale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}</td>
                <td>${sale.paymentMethod === 'cash' ? 'Espèces' : sale.paymentMethod === 'wave' ? 'Wave' : sale.paymentMethod === 'orange' ? 'Orange Money' : 'Dette'}</td>
                <td>${sale.total} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">TOTAL</td>
              <td>${total} FCFA</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;
}

export const generateExpensesReport = (expenses: Expense[], period: FilterPeriod, logoUri?: string): void => {
  const filteredExpenses = filterDataByPeriod(expenses, period);
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const shopSettings = getShopSettings();
  
  const doc = new jsPDF();
  
  // Logo
  addLogoToPDF(doc, logoUri);
  
  // Header
  doc.setFontSize(20);
  doc.text(`${shopSettings.name.toUpperCase()}`, 20, 20);
  doc.setFontSize(16);
  doc.text('RAPPORT DES CHARGES', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Période: ${getPeriodLabel(period)}`, 20, 45);
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);
  
  // Table header
  let yPosition = 75;
  doc.setFontSize(10);
  doc.text('Date', 20, yPosition);
  doc.text('Description', 60, yPosition);
  doc.text('Catégorie', 120, yPosition);
  doc.text('Montant', 160, yPosition);
  
  // Draw line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 10;
  
  // Table content
  filteredExpenses.forEach((expense) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(expense.date, 20, yPosition);
    doc.text(expense.description.substring(0, 25), 60, yPosition);
    doc.text(expense.category, 120, yPosition);
    doc.text(`-${expense.amount} FCFA`, 160, yPosition);
    
    yPosition += 8;
  });
  
  // Total
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  doc.setFontSize(12);
  doc.text(`TOTAL: -${total} FCFA`, 140, yPosition);
  
  // Save
  doc.save(`rapport-charges-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export function generateExpensesReportHtml(expenses: Expense[], period: FilterPeriod, logoUri?: string, phone?: string, address?: string, email?: string): string {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const contactBlock = (phone || email || address)
    ? `<div class="contact">
        ${phone ? `<div>${phone}</div>` : ''}
        ${email ? `<div>${email}</div>` : ''}
        ${address ? `<div>${address}</div>` : ''}
      </div>`
    : '';
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { color: #EF4444; }
          .logo { float: right; margin-top: 0; margin-bottom: 16px; max-height: 60px; }
          .contact { text-align: right; font-size: 14px; color: #64748B; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px; font-size: 12px; }
          th { background: #F3F4F6; }
          tfoot td { font-weight: bold; background: #F3F4F6; }
        </style>
      </head>
      <body>
        ${logoUri && logoUri.startsWith('data:image/') ? `<img src="${logoUri}" class="logo" />` : ''}
        <h1>Rapport des charges</h1>
        <p><strong>Période :</strong> ${getPeriodLabel(period)}</p>
        ${contactBlock}
        <p><strong>Date de génération :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Catégorie</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td>${expense.date}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>-${expense.amount} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL</td>
              <td>-${total} FCFA</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;
}

export const generateBalanceReport = (sales: Sale[], expenses: Expense[], period: FilterPeriod, logoUri?: string): void => {
  const filteredSales = filterDataByPeriod(sales, period);
  const filteredExpenses = filterDataByPeriod(expenses, period);
  const shopSettings = getShopSettings();
  
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = totalSales - totalExpenses;
  
  const doc = new jsPDF();
  
  // Logo
  addLogoToPDF(doc, logoUri);
  
  // Header
  doc.setFontSize(20);
  doc.text(`${shopSettings.name.toUpperCase()}`, 20, 20);
  doc.setFontSize(16);
  doc.text('BILAN FINANCIER', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Période: ${getPeriodLabel(period)}`, 20, 45);
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);
  
  let yPosition = 75;
  
  // Sales section
  doc.setFontSize(14);
  doc.text('RECETTES', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.text('Date', 20, yPosition);
  doc.text('Client', 60, yPosition);
  doc.text('Montant', 160, yPosition);
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 10;
  
  filteredSales.forEach((sale) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(sale.date, 20, yPosition);
    doc.text(sale.customerName.substring(0, 20), 60, yPosition);
    doc.text(`${sale.total} FCFA`, 160, yPosition);
    yPosition += 8;
  });
  
  yPosition += 5;
  doc.setFontSize(12);
  doc.text(`Sous-total recettes: ${totalSales} FCFA`, 120, yPosition);
  yPosition += 20;
  
  // Expenses section
  doc.setFontSize(14);
  doc.text('CHARGES', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.text('Date', 20, yPosition);
  doc.text('Description', 60, yPosition);
  doc.text('Montant', 160, yPosition);
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 10;
  
  filteredExpenses.forEach((expense) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(expense.date, 20, yPosition);
    doc.text(expense.description.substring(0, 25), 60, yPosition);
    doc.text(`-${expense.amount} FCFA`, 160, yPosition);
    yPosition += 8;
  });
  
  yPosition += 5;
  doc.setFontSize(12);
  doc.text(`Sous-total charges: -${totalExpenses} FCFA`, 120, yPosition);
  yPosition += 20;
  
  // Balance
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  doc.setFontSize(16);
  const balanceColor = balance >= 0 ? [0, 128, 0] : [255, 0, 0];
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.text(`BÉNÉFICE NET: ${balance} FCFA`, 120, yPosition);
  
  // Save
  doc.save(`bilan-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export function generateBalanceReportHtml(sales: Sale[], expenses: Expense[], period: FilterPeriod, logoUri?: string, phone?: string, address?: string, email?: string): string {
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const net = totalSales - totalExpenses;
  const contactBlock = (phone || email || address)
    ? `<div class="contact">
        ${phone ? `<div>${phone}</div>` : ''}
        ${email ? `<div>${email}</div>` : ''}
        ${address ? `<div>${address}</div>` : ''}
      </div>`
    : '';
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { color: #8B5CF6; }
          .logo { float: right; margin-top: 0; margin-bottom: 16px; max-height: 60px; }
          .contact { text-align: right; font-size: 14px; color: #64748B; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px; font-size: 12px; }
          th { background: #F3F4F6; }
          tfoot td { font-weight: bold; background: #F3F4F6; }
        </style>
      </head>
      <body>
        ${logoUri && logoUri.startsWith('data:image/') ? `<img src="${logoUri}" class="logo" />` : ''}
        <h1>Bilan financier</h1>
        <p><strong>Période :</strong> ${getPeriodLabel(period)}</p>
        ${contactBlock}
        <p><strong>Date de génération :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <h2>Recettes</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Client</th><th>Montant</th></tr>
          </thead>
          <tbody>
            ${sales.map(sale => `
              <tr>
                <td>${sale.date}</td>
                <td>${sale.customerName}</td>
                <td>${sale.total} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="2">Sous-total recettes</td><td>${totalSales} FCFA</td></tr>
          </tfoot>
        </table>
        <h2>Charges</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Montant</th></tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td>${expense.date}</td>
                <td>${expense.description}</td>
                <td>-${expense.amount} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="2">Sous-total charges</td><td>-${totalExpenses} FCFA</td></tr>
          </tfoot>
        </table>
        <h2>Bénéfice net : ${net} FCFA</h2>
      </body>
    </html>
  `;
}

export const generateInvoice = (sale: Sale, logoUri?: string): void => {
  const shopSettings = getShopSettings();
  const doc = new jsPDF();
  
  // Logo
  addLogoToPDF(doc, logoUri);
  
  // Header
  doc.setFontSize(20);
  doc.text(`${shopSettings.name.toUpperCase()}`, 20, 20);
  doc.setFontSize(16);
  doc.text('FACTURE', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Facture N°: ${sale.id}`, 20, 45);
  doc.text(`Date: ${sale.date}`, 20, 55);
  doc.text(`Client: ${sale.customerName}`, 20, 65);
  
  const paymentText = sale.paymentMethod === 'cash' ? 'Espèces' : 
                     sale.paymentMethod === 'wave' ? 'Wave' :
                     sale.paymentMethod === 'orange' ? 'Orange Money' : 'Dette';
  doc.text(`Mode de paiement: ${paymentText}`, 20, 75);
  
  if (sale.paymentMethod === 'debt' && !sale.isPaid) {
    doc.setTextColor(255, 0, 0);
    doc.text('STATUT: NON PAYÉ', 120, 75);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.setTextColor(0, 128, 0);
    doc.text('STATUT: PAYÉ', 120, 75);
    doc.setTextColor(0, 0, 0);
  }
  
  // Table header
  let yPosition = 95;
  doc.setFontSize(10);
  doc.text('Article', 20, yPosition);
  doc.text('Quantité', 100, yPosition);
  doc.text('Prix unitaire', 130, yPosition);
  doc.text('Total', 170, yPosition);
  
  // Draw line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 10;
  
  // Table content
  sale.items.forEach((item) => {
    doc.text(item.productName, 20, yPosition);
    doc.text(item.quantity.toString(), 100, yPosition);
    doc.text(`${item.price} FCFA`, 130, yPosition);
    doc.text(`${item.price * item.quantity} FCFA`, 170, yPosition);
    yPosition += 8;
  });
  
  // Total
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  doc.setFontSize(14);
  doc.text(`TOTAL À PAYER: ${sale.total} FCFA`, 120, yPosition);
  
  // Footer
  yPosition += 30;
  doc.setFontSize(10);
  doc.text('Merci pour votre achat !', 20, yPosition);
  doc.text(`${shopSettings.name} - Gestion des ventes`, 20, yPosition + 10);
  
  // Save
  doc.save(`facture-${sale.id}-${sale.customerName.replace(/\s+/g, '-')}.pdf`);
};

export function generateInvoiceHtml(sale: Sale, logoUri?: string, phone?: string, address?: string, email?: string): string {
  const contactBlock = (phone || email || address)
    ? `<div class="contact">
        ${phone ? `<div>${phone}</div>` : ''}
        ${email ? `<div>${email}</div>` : ''}
        ${address ? `<div>${address}</div>` : ''}
      </div>`
    : '';
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { color: #8B5CF6; }
          .logo { float: right; margin-top: 0; margin-bottom: 16px; max-height: 60px; }
          .contact { clear: right; text-align: right; font-size: 14px; color: #64748B; margin-top: 70px; margin-bottom: 8px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px; font-size: 12px; }
          th { background: #F3F4F6; }
        </style>
      </head>
      <body>
        ${logoUri && logoUri.startsWith('data:image/') ? `<img src="${logoUri}" class="logo" />` : ''}
        <h1>Facture</h1>
        ${contactBlock}
        <p><strong>Facture N°:</strong> ${sale.id}</p>
        <p><strong>Date:</strong> ${sale.date}</p>
        <p><strong>Client:</strong> ${sale.customerName}</p>
        <p><strong>Mode de paiement:</strong> ${sale.paymentMethod === 'cash' ? 'Espèces' : sale.paymentMethod === 'wave' ? 'Wave' : sale.paymentMethod === 'orange' ? 'Orange Money' : 'Dette'}</p>
        <table>
          <thead>
            <tr><th>Article</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${item.price} FCFA</td>
                <td>${item.price * item.quantity} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h2>Total à payer : ${sale.total} FCFA</h2>
      </body>
    </html>
  `;
}