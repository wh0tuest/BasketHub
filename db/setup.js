const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.db');
const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.exec(initSql, (err) => {
        if (err) {
            console.error('Database initialization failed:', err.message);
            process.exitCode = 1;
            return;
        }
        db.exec(seedSql, (seedErr) => {
            if (seedErr) {
                console.error('Database seeding failed:', seedErr.message);
                process.exitCode = 1;
                return;
            }
            console.log(`Database ready: ${dbPath}`);
            db.close();
        });
    });
});
