#!/usr/bin/env node

// Script to fix Prisma client compatibility issues
const { exec } = require('child_process');
const path = require('path');

console.log('🔧 Fixing Prisma client compatibility...');
console.log('=====================================');

// Function to run command and return promise
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      console.log(`✅ ${description} completed`);
      if (stdout) {
        console.log(stdout);
      }
      resolve();
    });
  });
}

async function fixPrismaCompatibility() {
  try {
    // Step 1: Clean existing generated files
    console.log('🧹 Cleaning existing generated files...');
    await runCommand('rm -rf src/generated/prisma', 'Cleaning generated files');
    
    // Step 2: Install dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm install', 'Installing dependencies');
    
    // Step 3: Generate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    await runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Step 4: Check if we can create admin now
    console.log('🧪 Testing admin creation...');
    await runCommand('node scripts/create-admin.js', 'Testing admin creation');
    
    console.log('');
    console.log('✅ Prisma compatibility fix completed!');
    console.log('');
    console.log('If you still have issues, try:');
    console.log('1. node scripts/check-node-version.js');
    console.log('2. node scripts/create-admin-compatible.js');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.log('');
    console.log('🔧 Alternative solutions:');
    console.log('1. Update Node.js to version 14 or higher');
    console.log('2. Use: node scripts/create-admin-compatible.js');
    console.log('3. Check Node.js version: node scripts/check-node-version.js');
    
    process.exit(1);
  }
}

fixPrismaCompatibility(); 