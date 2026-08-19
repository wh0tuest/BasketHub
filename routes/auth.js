const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Brak email lub hasła' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (email, password, role) VALUES (?, ?, 'user')`;

        db.run(sql, [email, hashedPassword], function (err) {
            if (err) {
                return res.status(400).json({ message: 'Email już istnieje' });
            }
            res.status(201).json({ message: 'Użytkownik utworzony' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ message: 'Błędne dane' });

            const ok = await bcrypt.compare(password, user.password);
            if (!ok) return res.status(401).json({ message: 'Błędne dane' });

            const token = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: '2h' }
            );

            res.json({ token });
        }
    );
});

module.exports = router;