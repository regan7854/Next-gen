const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'nextgen.db'));

db.all(
  'SELECT id, username, display_name, email, role, biography, avatar_color, created_at FROM users',
  (err, rows) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }

    console.log(`\n=== Registered Users (${rows.length}) ===\n`);
    console.table(rows);

    // Export CSV
    const header = 'ID,Username,Display Name,Email,Role,Biography,Created At';
    const csvRows = rows.map((u) =>
      [u.id, u.username, u.display_name, u.email, u.role, u.biography || '', u.created_at]
        .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
        .join(',')
    );
    const csv = header + '\n' + csvRows.join('\n');
    const outPath = path.join(__dirname, 'data', 'registered_users.csv');
    fs.writeFileSync(outPath, csv, 'utf8');
    console.log('\nExported to:', outPath);

    db.close();
  }
);
