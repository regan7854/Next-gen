const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportUsers() {
  const rows = await prisma.user.findMany({
    select: {
      id: true, username: true, displayName: true, email: true,
      role: true, biography: true, avatarColor: true, createdAt: true,
    },
  });

  console.log(`\n=== Registered Users (${rows.length}) ===\n`);
  console.table(rows.map(u => ({
    id: u.id, username: u.username, display_name: u.displayName,
    email: u.email, role: u.role, biography: u.biography, created_at: u.createdAt,
  })));

  // Export CSV
  const header = 'ID,Username,Display Name,Email,Role,Biography,Created At';
  const csvRows = rows.map((u) =>
    [u.id, u.username, u.displayName, u.email, u.role, u.biography || '', u.createdAt]
      .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
      .join(',')
  );
  const csv = header + '\n' + csvRows.join('\n');
  const outPath = path.join(__dirname, 'data', 'registered_users.csv');
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log('\nExported to:', outPath);

  await prisma.$disconnect();
}

exportUsers().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
