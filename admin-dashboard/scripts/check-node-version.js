#!/usr/bin/env node

// Check Node.js version and provide upgrade instructions
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

console.log('🔍 Node.js Version Check');
console.log('========================');
console.log(`Current Node.js version: ${nodeVersion}`);
console.log(`Major version: ${majorVersion}`);

if (majorVersion < 14) {
  console.log('');
  console.log('❌ ERROR: Node.js version is too old!');
  console.log('');
  console.log('The nullish coalescing operator (??) requires Node.js 14 or higher.');
  console.log('Your current version is Node.js ' + majorVersion);
  console.log('');
  console.log('🔧 SOLUTIONS:');
  console.log('');
  console.log('1. Update Node.js to version 14 or higher:');
  console.log('   - Visit: https://nodejs.org/');
  console.log('   - Download and install the latest LTS version');
  console.log('');
  console.log('2. Or use the compatible script:');
  console.log('   node scripts/create-admin-compatible.js');
  console.log('');
  console.log('3. If using a package manager like nvm:');
  console.log('   nvm install 18');
  console.log('   nvm use 18');
  console.log('');
  console.log('4. If on Ubuntu/Debian:');
  console.log('   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
  console.log('   sudo apt-get install -y nodejs');
  console.log('');
  console.log('5. If on CentOS/RHEL:');
  console.log('   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -');
  console.log('   sudo yum install -y nodejs');
  
  process.exit(1);
} else {
  console.log('');
  console.log('✅ Node.js version is compatible!');
  console.log('You can run the original create-admin script:');
  console.log('node scripts/create-admin.js');
  console.log('');
  
  process.exit(0);
} 