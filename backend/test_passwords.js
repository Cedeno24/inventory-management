const bcrypt = require('bcrypt');

async function testPasswords() {
  const passwords = [
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/GTTnxYfFa',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/GTTnxYfFa',
    '$2a$12$IEoN83ew0aEtNp68MEAyZOwHVix8TXRxjsXbMHKg0Ql3yvpf5DMpi'
  ];

  const testPassword = 'admin123';

  for (let i = 0; i < passwords.length; i++) {
    const hash = passwords[i];
    console.log(`\n=== Test ${i + 1} ===`);
    console.log('Hash:', hash);
    console.log('Password:', testPassword);
    
    try {
      const isValid = await bcrypt.compare(testPassword, hash);
      console.log('Válido:', isValid);
    } catch (error) {
      console.log('Error:', error.message);
    }
  }

  // Generar nuevo hash
  console.log('\n=== Generando nuevo hash ===');
  const newHash = await bcrypt.hash('admin123', 10);
  console.log('Nuevo hash:', newHash);
  const testNew = await bcrypt.compare('admin123', newHash);
  console.log('Test nuevo hash:', testNew);
}

testPasswords();