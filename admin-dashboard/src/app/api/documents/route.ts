import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';



// Company information for PDFs
const COMPANY_INFO = {
  name: 'ecodeli',
  address: '242 Rue du Faubourg Saint-Antoine',
  city: 'Paris, 75012',
  phone: '+33 6 12 34 56 78',
  email: 'contact@ecodeli.fr',
  website: 'www.ecodeli.fr'
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// Helper function to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date);
}

// ---------- Modern PDF utilities (logo, header & footer) ----------
const PAGE_MARGIN_X = 20;
const PAGE_MARGIN_Y = 10;

let LOGO_BASE64: string | null = null;
// Default logo dimensions in mm (preserve aspect ratio below)
let LOGO_DIMENSIONS = { width: 15, height: 15 };
try {
  const localLogo = path.join(process.cwd(), 'public', 'LOGO_.png');
  const rootLogo = path.join(process.cwd(), '..', 'public', 'LOGO_.png');
  const logoPath = fs.existsSync(localLogo) ? localLogo : rootLogo;
  if (fs.existsSync(logoPath)) {
    LOGO_BASE64 = fs.readFileSync(logoPath, { encoding: 'base64' });
    // Compute natural dimensions to preserve aspect ratio
    try {
      const sizeOf = require('image-size');
      const dims = sizeOf(logoPath);
      if (dims.width && dims.height) {
        LOGO_DIMENSIONS.height = LOGO_DIMENSIONS.width * (dims.height / dims.width);
      }
    } catch (e) {
      // ignore if dimension lookup fails
    }
  }
} catch (err) {
  // Ignore logo loading issues
}

function drawHeader(doc: jsPDF, title: string): number {
  // Logo on the left
  if (LOGO_BASE64) {
    doc.addImage(
      `data:image/png;base64,${LOGO_BASE64}`,
      'PNG',
      PAGE_MARGIN_X,
      PAGE_MARGIN_Y,
      LOGO_DIMENSIONS.width,
      LOGO_DIMENSIONS.height
    );
  }
  const headerBaseY = PAGE_MARGIN_Y + 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(COMPANY_INFO.name, PAGE_MARGIN_X, headerBaseY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text([
    COMPANY_INFO.address,
    COMPANY_INFO.city,
    COMPANY_INFO.phone,
    COMPANY_INFO.email
  ], PAGE_MARGIN_X, headerBaseY + 6);

  // Title on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(title.toUpperCase(), 210 - PAGE_MARGIN_X, PAGE_MARGIN_Y + 12, { align: 'right' });

  return headerBaseY + 20;
}

function drawFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${COMPANY_INFO.name} - ${COMPANY_INFO.website}`, PAGE_MARGIN_X, 287);
    doc.text(`Page ${i}/${pages}`, 210 - PAGE_MARGIN_X, 287, { align: 'right' });
  }
}

// ---------- Improved Contract PDF generator ----------
function generateContractPDF(contractData: any): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const startY = drawHeader(doc, 'Contrat de service');

  // Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  let y = startY + 5;
  doc.text(`Contrat N° : ${contractData.number}`, PAGE_MARGIN_X, y);
  y += 6;
  doc.text(`Date : ${formatDate(new Date(contractData.date))}`, PAGE_MARGIN_X, y);

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
  y += 5;
  doc.text(`Email : ${COMPANY_INFO.email}`, PAGE_MARGIN_X + 10, y);
  y += 5;
  doc.text(`Tél : ${COMPANY_INFO.phone}`, PAGE_MARGIN_X + 10, y);

  // Client
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Le client :', PAGE_MARGIN_X, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const merchantName = contractData.merchant.companyName ||
    `${contractData.merchant.firstName || ''} ${contractData.merchant.lastName || ''}`.trim() ||
    contractData.merchant.name || contractData.merchant.email;
  doc.text(merchantName, PAGE_MARGIN_X + 10, y);
  if (contractData.merchant.address) {
    y += 5;
    doc.text(contractData.merchant.address, PAGE_MARGIN_X + 10, y);
  }
  y += 5;
  doc.text(`Email : ${contractData.merchant.email}`, PAGE_MARGIN_X + 10, y);
  if (contractData.merchant.phoneNumber) {
    y += 5;
    doc.text(`Tél : ${contractData.merchant.phoneNumber}`, PAGE_MARGIN_X + 10, y);
  }

  // Objet
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OBJET DU CONTRAT :', PAGE_MARGIN_X, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const contentLines = doc.splitTextToSize(contractData.content || contractData.description || '', 170);
  doc.text(contentLines, PAGE_MARGIN_X, y);
  y += contentLines.length * 5 + 10;

  // Conditions
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS :', PAGE_MARGIN_X, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const termsLines = doc.splitTextToSize(contractData.terms || '', 170);
  doc.text(termsLines, PAGE_MARGIN_X, y);
  y += termsLines.length * 5 + 10;

  // Valeur
  if (contractData.value) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Valeur du contrat : ${formatCurrency(contractData.value)}`, PAGE_MARGIN_X, y);
    y += 10;
  }

  // Dates
  if (contractData.startDate) {
    doc.text(`Date de début : ${formatDate(new Date(contractData.startDate))}`, PAGE_MARGIN_X, y);
    y += 6;
  }
  if (contractData.endDate) {
    doc.text(`Date de fin : ${formatDate(new Date(contractData.endDate))}`, PAGE_MARGIN_X, y);
    y += 6;
  }

  // Signatures
  y = Math.max(y + 20, 240);
  doc.setFontSize(10);
  doc.text('Signature du prestataire :', PAGE_MARGIN_X, y);
  doc.text('Signature du client :', PAGE_MARGIN_X + 90, y);

  // Footer
  drawFooter(doc);
  return doc;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const relatedEntityType = searchParams.get('relatedEntityType');

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (relatedEntityType) where.relatedEntityType = relatedEntityType;

    const documents = await prisma.document.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enrich documents with related entity info if needed
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        let relatedEntity = null;
        if (doc.relatedEntityType === 'contract' && doc.relatedEntityId) {
          relatedEntity = await prisma.contract.findUnique({
            where: { id: doc.relatedEntityId },
            select: {
              id: true,
              title: true,
              status: true
            }
          });
        }
        return { ...doc, relatedEntity };
      })
    );

    return NextResponse.json(enrichedDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, type = 'CONTRACT' } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Fetch contract with merchant details
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (!contract.merchant) {
      return NextResponse.json(
        { error: 'Contract merchant not found' },
        { status: 404 }
      );
    }

    if (contract.merchant.userType !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'PDFs can only be generated for PROFESSIONAL users' },
        { status: 400 }
      );
    }

    // Generate PDF data
    const pdfData = {
      number: `CONT-${contract.id.substring(0, 8)}`,
      title: contract.title,
      content: contract.content,
      terms: contract.terms,
      value: contract.value,
      expiresAt: contract.expiresAt,
      date: contract.createdAt,
      merchant: contract.merchant
    };

    // Generate PDF
    const doc = generateContractPDF(pdfData);
    const filename = `contract_${contract.id}_${Date.now()}.pdf`;

    // Ensure documents directory exists
    const documentsDir = path.join(process.cwd(), 'public', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    // Save PDF to file system
    const filePath = path.join(documentsDir, filename);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId: contract.merchant.id,
        type: type as any,
        title: `Contrat ${contract.title}`,
        description: `PDF généré pour le contrat ${contract.title}`,
        fileName: filename,
        filePath: `/documents/${filename}`,
        fileSize,
        mimeType: 'application/pdf',
        relatedEntityId: contract.id,
        relatedEntityType: 'contract',
        isPublic: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true
          }
        }
      }
    });

    // Add related entity info
    const relatedEntity = {
      id: contract.id,
      title: contract.title,
      status: contract.status
    };

    return NextResponse.json({ ...document, relatedEntity }, { status: 201 });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document info before deletion
    const document = await prisma.document.findUnique({
      where: { id },
      select: { fileName: true, filePath: true }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const fullPath = path.join(process.cwd(), 'public', document.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 