import jsPDF from 'jspdf';

// Company information
const COMPANY_INFO = {
  name: 'ecodeli',
  address: '242 Rue du Faubourg Saint-Antoine',
  city: 'Paris, 75012',
  phone: '+33 6 12 34 56 78',
  email: 'contact@ecodeli.fr',
  website: 'www.ecodeli.fr'
};

// ------------ Modern PDF utilities (logo, header & footer) ------------
const PAGE_MARGIN_X = 20;
const PAGE_MARGIN_Y = 10;

let LOGO_BASE64 = null;
if (typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(process.cwd(), 'public', 'LOGO_.png');
    if (fs.existsSync(logoPath)) {
      LOGO_BASE64 = fs.readFileSync(logoPath, { encoding: 'base64' });
    }
  } catch (err) {
    /* Gracefully ignore logo loading issues on the server */
  }
}

/**
 * Draws the company header with logo and basic contact information.
 * Returns the Y-coordinate where page content should start.
 */
function drawProfessionalHeader(doc, title) {
  // Logo
  if (LOGO_BASE64) {
    doc.addImage(`data:image/png;base64,${LOGO_BASE64}`, 'PNG', PAGE_MARGIN_X, PAGE_MARGIN_Y, 35, 15);
  }

  // Company name (bold)
  const headerBaseY = PAGE_MARGIN_Y + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(COMPANY_INFO.name, PAGE_MARGIN_X, headerBaseY);

  // Company contact details (small, grey)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text([
    COMPANY_INFO.address,
    COMPANY_INFO.city,
    COMPANY_INFO.phone,
    COMPANY_INFO.email
  ], PAGE_MARGIN_X, headerBaseY + 6);

  // Document title on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(title.toUpperCase(), 210 - PAGE_MARGIN_X, PAGE_MARGIN_Y + 12, { align: 'right' });

  return headerBaseY + 20; // content start Y
}

/**
 * Adds a footer with page number and website information to every page.
 */
function drawProfessionalFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${COMPANY_INFO.name} - ${COMPANY_INFO.website}`, PAGE_MARGIN_X, 287);
    doc.text(`Page ${i}/${pageCount}`, 210 - PAGE_MARGIN_X, 287, { align: 'right' });
  }
}

// Helper function to format currency
function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Helper function to format date
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Generate invoice PDF
export function generateInvoicePDF(invoiceData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Common header
  const contentStartY = drawProfessionalHeader(doc, 'Facture');
  
  // Invoice meta (top-right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let metaY = contentStartY - 10;
  doc.text(`Numéro : ${invoiceData.number}`, 210 - PAGE_MARGIN_X, metaY, { align: 'right' });
  metaY += 5;
  doc.text(`Date : ${formatDate(invoiceData.date)}`, 210 - PAGE_MARGIN_X, metaY, { align: 'right' });
  metaY += 5;
  doc.text(`Échéance : ${formatDate(invoiceData.dueDate)}`, 210 - PAGE_MARGIN_X, metaY, { align: 'right' });
  
  // Customer information
  let y = contentStartY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Facturé à :', PAGE_MARGIN_X, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.customer.name, PAGE_MARGIN_X, y);
  if (invoiceData.customer.address) {
    y += 5;
    doc.text(invoiceData.customer.address, PAGE_MARGIN_X, y);
  }
  y += 5;
  doc.text(invoiceData.customer.email, PAGE_MARGIN_X, y);
  
  // Table header
  const tableTop = y + 15;
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(40, 40, 40);
  doc.rect(PAGE_MARGIN_X, tableTop, 170, 8, 'F');
  
  doc.text('Description', PAGE_MARGIN_X + 5, tableTop + 5);
  doc.text('Quantité', PAGE_MARGIN_X + 80, tableTop + 5);
  doc.text('Prix unitaire', PAGE_MARGIN_X + 110, tableTop + 5);
  doc.text('Total', PAGE_MARGIN_X + 145, tableTop + 5);
  
  // Table rows
  let currentY = tableTop + 10;
  doc.setTextColor(40, 40, 40);
  doc.setFillColor(245, 245, 245);
  
  invoiceData.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(PAGE_MARGIN_X, currentY - 4, 170, 8, 'F');
    }
    
    doc.text(item.description, PAGE_MARGIN_X + 5, currentY);
    doc.text(item.quantity.toString(), PAGE_MARGIN_X + 83, currentY);
    doc.text(formatCurrency(item.unitPrice), PAGE_MARGIN_X + 115, currentY);
    doc.text(formatCurrency(item.total), PAGE_MARGIN_X + 150, currentY);
    
    currentY += 8;
  });
  
  // Totals section
  currentY += 5;
  doc.setFontSize(10);
  if (invoiceData.subtotal) {
    doc.text('Sous-total :', PAGE_MARGIN_X + 110, currentY);
    doc.text(formatCurrency(invoiceData.subtotal), PAGE_MARGIN_X + 150, currentY);
    currentY += 5;
  }
  
  if (invoiceData.tax) {
    doc.text(`TVA (${invoiceData.taxRate} %) :`, PAGE_MARGIN_X + 110, currentY);
    doc.text(formatCurrency(invoiceData.tax), PAGE_MARGIN_X + 150, currentY);
    currentY += 5;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total :', PAGE_MARGIN_X + 110, currentY + 5);
  doc.text(formatCurrency(invoiceData.total), PAGE_MARGIN_X + 150, currentY + 5);
  
  // Thank-you note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Merci pour votre confiance !', PAGE_MARGIN_X, currentY + 25);
  
  // Footer (applied to all pages)
  drawProfessionalFooter(doc);
  
  return doc;
}

// Generate delivery note PDF
export function generateDeliveryNotePDF(deliveryData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const contentStartY = drawProfessionalHeader(doc, 'Bon de livraison');
  
  // Delivery meta (top-right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Numéro : ${deliveryData.number}`, 210 - PAGE_MARGIN_X, contentStartY - 10, { align: 'right' });
  doc.text(`Date : ${formatDate(deliveryData.date)}`, 210 - PAGE_MARGIN_X, contentStartY - 5, { align: 'right' });
  
  // Package information
  let y = contentStartY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Informations du colis :', PAGE_MARGIN_X, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 10;
  doc.text(`Titre : ${deliveryData.package.title}`, PAGE_MARGIN_X, y);
  y += 5;
  doc.text(`Description : ${deliveryData.package.description}`, PAGE_MARGIN_X, y);
  if (deliveryData.package.weight) {
    y += 5;
    doc.text(`Poids : ${deliveryData.package.weight} kg`, PAGE_MARGIN_X, y);
  }
  if (deliveryData.package.dimensions) {
    y += 5;
    doc.text(`Dimensions : ${deliveryData.package.dimensions}`, PAGE_MARGIN_X, y);
  }
  
  // Addresses
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Adresse de collecte :', PAGE_MARGIN_X, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(deliveryData.package.pickupAddress, PAGE_MARGIN_X, y);
  
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse de livraison :', PAGE_MARGIN_X, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(deliveryData.package.deliveryAddress, PAGE_MARGIN_X, y);
  
  // Carrier information
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Transporteur :', PAGE_MARGIN_X, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`${deliveryData.carrier.firstName} ${deliveryData.carrier.lastName}`, PAGE_MARGIN_X, y);
  y += 5;
  doc.text(deliveryData.carrier.email, PAGE_MARGIN_X, y);
  if (deliveryData.carrier.phoneNumber) {
    y += 5;
    doc.text(deliveryData.carrier.phoneNumber, PAGE_MARGIN_X, y);
  }
  
  // Signature boxes
  y += 25;
  doc.setFontSize(10);
  doc.text('Signature expéditeur :', PAGE_MARGIN_X, y);
  doc.rect(PAGE_MARGIN_X, y + 5, 60, 20);
  doc.text('Signature destinataire :', PAGE_MARGIN_X + 90, y);
  doc.rect(PAGE_MARGIN_X + 90, y + 5, 60, 20);
  
  // Footer
  drawProfessionalFooter(doc);
  return doc;
}

// Generate contract PDF
export function generateContractPDF(contractData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const contentStartY = drawProfessionalHeader(doc, 'Contrat de service');
  
  // Contract details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  let y = contentStartY + 5;
  doc.text(`Contrat N° : ${contractData.number}`, PAGE_MARGIN_X, y);
  y += 6;
  doc.text(`Date : ${formatDate(contractData.date)}`, PAGE_MARGIN_X, y);
  
  // Parties
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ENTRE LES PARTIES SUIVANTES :', PAGE_MARGIN_X, y);
  
  // Prestataire
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Le prestataire :', PAGE_MARGIN_X, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(COMPANY_INFO.name, PAGE_MARGIN_X + 10, y);
  y += 5;
  doc.text(COMPANY_INFO.address, PAGE_MARGIN_X + 10, y);
  y += 5;
  doc.text(COMPANY_INFO.city, PAGE_MARGIN_X + 10, y);
  
  // Client
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Le client :', PAGE_MARGIN_X, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(contractData.merchant.name, PAGE_MARGIN_X + 10, y);
  if (contractData.merchant.address) {
    y += 5;
    doc.text(contractData.merchant.address, PAGE_MARGIN_X + 10, y);
  }
  y += 5;
  doc.text(contractData.merchant.email, PAGE_MARGIN_X + 10, y);
  
  // Contract content
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OBJET DU CONTRAT :', PAGE_MARGIN_X, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const contentLines = doc.splitTextToSize(contractData.content, 170);
  doc.text(contentLines, PAGE_MARGIN_X, y);
  
  // Terms
  y += contentLines.length * 5 + 10;
  if (contractData.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS :', PAGE_MARGIN_X, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(contractData.terms, 170);
    doc.text(termsLines, PAGE_MARGIN_X, y);
    y += termsLines.length * 5;
  }
  
  // Signatures
  y += 15;
  doc.setFontSize(10);
  doc.text('Signature du prestataire :', PAGE_MARGIN_X, y);
  doc.text('Signature du client :', PAGE_MARGIN_X + 90, y);
  y += 35;
  
  // Footer
  drawProfessionalFooter(doc);
  return doc;
}

// Generate service certificate PDF
export function generateServiceCertificatePDF(serviceData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const contentStartY = drawProfessionalHeader(doc, 'Certificat de service');
  
  // Certificate details (centered)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Certificat N° : ${serviceData.number}`, 105, contentStartY - 5, { align: 'center' });
  doc.text(`Date d'émission : ${formatDate(serviceData.date)}`, 105, contentStartY, { align: 'center' });
  
  // Body
  let y = contentStartY + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CERTIFIE QUE :', 105, y, { align: 'center' });
  
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`${serviceData.provider.firstName} ${serviceData.provider.lastName}`, 105, y, { align: 'center' });
  y += 15;
  doc.text('A fourni le service suivant :', 105, y, { align: 'center' });
  
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(serviceData.service.name, 105, y, { align: 'center' });
  
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Pour : ${serviceData.customer.firstName} ${serviceData.customer.lastName}`, 105, y, { align: 'center' });
  y += 7;
  doc.text(`Date du service : ${formatDate(serviceData.serviceDate)}`, 105, y, { align: 'center' });
  if (serviceData.rating) {
    y += 7;
    doc.text(`Évaluation : ${serviceData.rating}/5 étoiles`, 105, y, { align: 'center' });
  }
  
  // Footer (issuer)
  y += 30;
  doc.setFontSize(12);
  doc.text('Délivré par :', 105, y, { align: 'center' });
  y += 10;
  doc.text(COMPANY_INFO.name, 105, y, { align: 'center' });
  y += 10;
  doc.text(formatDate(new Date()), 105, y, { align: 'center' });
  
  // Footer with page numbers
  drawProfessionalFooter(doc);
  return doc;
}

// Save PDF to file system
export function savePDFToFile(doc, filename, directory = 'public/documents') {
  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  
  const filePath = path.join(directory, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
} 