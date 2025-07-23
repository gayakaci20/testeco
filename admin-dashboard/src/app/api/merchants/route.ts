import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Merchants API: Starting request...')
    const session = await getServerSession(authOptions)
    console.log('Merchants API: Session:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.email) {
      console.log('Merchants API: No session or email found')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('Merchants API: Session email:', session.user.email)

    // Vérifier que l'utilisateur est un admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    console.log('Merchants API: User found:', user ? `${user.email} (${user.role})` : 'Not found')

    if (!user || user.role !== 'ADMIN') {
      console.log('Merchants API: Access denied - user not admin')
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer tous les marchands avec le nombre de produits
    const merchants = await prisma.user.findMany({
      where: {
        role: 'MERCHANT'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phoneNumber: true,
        address: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      merchants,
      total: merchants.length
    })

  } catch (error) {
    console.error('Merchants API error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des marchands' },
      { status: 500 }
    )
  }
} 