// This is a login endpoint using Prisma for authentication
import { generateToken } from '../../../lib/auth';
import { COOKIE_MAX_AGE } from '../../../lib/auth-constants';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Assurer que la réponse est toujours du JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    // Get credentials from request body
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // For development testing, accept any valid email format with any password
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    // Check if user exists in database
    let user;
    
    try {
      // Query users table with Prisma
      user = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return res.status(500).json({ message: 'Database connection error' });
    }
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // Generate JWT token
    const token = await generateToken(user);

    // Set HTTP-only cookie with the token
    res.setHeader('Set-Cookie', `token=${token}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);

    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur interne est survenue'
    });
  }
}
