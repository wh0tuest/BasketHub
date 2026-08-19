const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

router.get('/', (req, res) => {
    db.all('SELECT * FROM players', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', authenticateJWT, (req, res) => {
    const { name, position, team_id } = req.body;
    const userId = req.user.id;

    if (!name || !position || !team_id) {
        return res.status(400).json({ message: 'Brak wymaganych danych (imię, pozycja, team_id)' });
    }

    db.get('SELECT owner_id FROM teams WHERE id = ?', [team_id], (err, team) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!team) return res.status(404).json({ message: 'Drużyna nie istnieje' });

        if (team.owner_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Możesz dodawać graczy tylko do własnej drużyny!' });
        }

        const sql = `INSERT INTO players (name, position, team_id) VALUES (?, ?, ?)`;
        db.run(sql, [name, position, team_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Gracz dodany' });
        });
    });
});

router.delete('/:id', authenticateJWT, (req, res) => {
    const playerId = req.params.id;
    const userId = req.user.id;

    const checkSql = `
        SELECT t.owner_id 
        FROM players p 
        JOIN teams t ON p.team_id = t.id 
        WHERE p.id = ?
    `;

    db.get(checkSql, [playerId], (err, row) => {
        if (!row) return res.status(404).json({ message: 'Gracz nie istnieje' });

        if (row.owner_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Brak uprawnień' });
        }

        db.run('DELETE FROM players WHERE id = ?', [playerId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Gracz usunięty' });
        });
    });
});

router.put('/:id', authenticateJWT, (req, res) => {
    const { name, position } = req.body;
    const playerId = req.params.id;

    if (!name || !position) {
        return res.status(400).json({ message: 'Brak wymaganych danych' });
    }

    db.run(
        'UPDATE players SET name = ?, position = ? WHERE id = ?',
        [name, position, playerId],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Gracz nie znaleziony' });
            }

            res.json({ message: 'Zaktualizowano dane gracza' });
        }
    );
});

module.exports = router;