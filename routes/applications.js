const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

router.post('/', authenticateJWT, (req, res) => {
    const { team_id, tournament_id } = req.body;
    const userId = req.user.id;

    if (!team_id || !tournament_id) {
        return res.status(400).json({ message: 'Brak danych' });
    }

    db.get('SELECT owner_id FROM teams WHERE id = ?', [team_id], (err, team) => {
        if (!team) return res.status(404).json({ message: 'Drużyna nie istnieje' });

        if (team.owner_id !== userId) {
            return res.status(403).json({ message: 'Możesz zgłaszać tylko własną drużynę!' });
        }

        db.run(
            `INSERT INTO applications (team_id, tournament_id, status) VALUES (?, ?, 'pending')`,
            [team_id, tournament_id],
            function (err) {
                if (err) return res.status(400).json({ message: 'Zgłoszenie już istnieje' });
                res.status(201).json({ message: 'Zgłoszenie wysłane, czeka na akceptację' });
            }
        );
    });
});

router.get('/', authenticateJWT, isAdmin, (req, res) => {
    db.all(`
        SELECT a.id, t.name AS team, tr.name AS tournament, a.status, a.applied_at
        FROM applications a
                 JOIN teams t ON a.team_id = t.id
                 JOIN tournaments tr ON a.tournament_id = tr.id
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.put('/:id', authenticateJWT, isAdmin, (req, res) => {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Błędny status' });
    }

    db.run(
        'UPDATE applications SET status = ? WHERE id = ?',
        [status, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Nie znaleziono zgłoszenia' });
            res.json({ message: 'Status zmieniony pomyślnie' });
        }
    );
});

module.exports = router;