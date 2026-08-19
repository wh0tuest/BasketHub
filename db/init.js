const fs = require('fs');
const path = require('path');
const db = require('./database');

const initSql = fs.readFileSync(
    path.join(__dirname, 'init.sql'),
    'utf8'
);

db.exec(initSql, (err) => {
    if (err) {
        console.error('Błąd inicjalizacji DB:', err.message);
    } else {
        console.log('Baza danych zainicjalizowana');
    }
});
