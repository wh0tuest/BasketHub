const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    db.get('SELECT COUNT(*) as total FROM teams', [], (err, countRow) => {
        if (err) return res.status(500).json({error: err.message});

        db.all('SELECT * FROM teams', [], (err, rows) => {
            if (err) return res.status(500).json({error: err.message});
            res.json({data: rows});
        });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT t.*, p.id as player_id, p.name as player_name, p.position
        FROM teams t
        LEFT JOIN players p ON t.id = p.team_id
        WHERE t.id = ?
    `;

    db.all(sql, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ message: 'Nie znaleziono' });

        const team = {
            id: rows[0].id,
            name: rows[0].name,
            city: rows[0].city,
            owner_id: rows[0].owner_id,
            players: rows.filter(r => r.player_id).map(r => ({
                id: r.player_id,
                name: r.player_name,
                position: r.position
            }))
        };
        res.json(team);
    });
});

router.post('/', authenticateJWT, (req, res) => {
    const { name, city } = req.body;
    const owner_id = req.user.id;

    if (!name || !city) return res.status(400).json({ message: 'Brak danych' });

    db.run(
        'INSERT INTO teams (name, city, owner_id) VALUES (?, ?, ?)',
        [name, city, owner_id],
        function (err) {
            if (err) {
                console.error("DEBUG SQL ERROR:", err.message);
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ message: 'Możesz posiadać tylko jedną drużynę!' });
                }
                return res.status(500).json({ message: 'Błąd serwera: ' + err.message });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

router.put('/:id', authenticateJWT, (req, res) => {
    const { name, city } = req.body;
    const teamId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const checkSql = 'SELECT owner_id FROM teams WHERE id = ?';
    db.get(checkSql, [teamId], (err, team) => {
        if (!team) return res.status(404).json({ message: 'Nie znaleziono' });

        if (team.owner_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'To nie Twoja drużyna!' });
        }

        db.run(
            'UPDATE teams SET name = ?, city = ? WHERE id = ?',
            [name, city, teamId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Zaktualizowano' });
            }
        );
    });
});

router.delete('/:id', authenticateJWT, (req, res) => {
    const teamId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    db.get('SELECT owner_id FROM teams WHERE id = ?', [teamId], (err, team) => {
        if (!team) return res.status(404).json({ message: 'Nie znaleziono drużyny' });

        if (userRole === 'admin' || team.owner_id === userId) {
            db.run('DELETE FROM teams WHERE id = ?', [teamId], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Drużyna usunięta' });
            });
        } else {
            res.status(403).json({ message: 'Nie masz uprawnień до tej akcji' });
        }
    });
});

module.exports = router;