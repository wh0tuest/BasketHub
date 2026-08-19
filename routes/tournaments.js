const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    db.get('SELECT COUNT(*) as total FROM tournaments', [], (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(
            'SELECT id, name, location, start_date FROM tournaments LIMIT ? OFFSET ?',
            [limit, offset],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    page,
                    limit,
                    total: countRow ? countRow.total : 0,
                    data: rows || []
                });
            }
        );
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const tournamentSql = `SELECT * FROM tournaments WHERE id = ?`;

    const teamsSql = `
        SELECT t.id AS team_id, t.name, t.city, t.owner_id, a.status, a.id AS application_id
        FROM teams t
                 JOIN applications a ON t.id = a.team_id
        WHERE a.tournament_id = ?
    `;

    db.get(tournamentSql, [id], (err, tournament) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tournament) return res.status(404).json({ message: 'Nie znaleziono turnieju' });

        db.all(teamsSql, [id], (err, applications) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...tournament, applications: applications || [] });
        });
    });
});

router.post('/', authenticateJWT, isAdmin, (req, res) => {
    const { name, location, start_date } = req.body;

    if (!name || !location || !start_date) {
        return res.status(400).json({ message: 'Brak wymaganych pól' });
    }

    const selectedDate = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return res.status(400).json({ message: 'Nie można utworzyć turnieju z datą wsteczną' });
    }

    db.run(
        'INSERT INTO tournaments (name, location, start_date) VALUES (?, ?, ?)',
        [name, location, start_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
});

router.put('/:id', authenticateJWT, isAdmin, (req, res) => {
    const { name, location, start_date } = req.body;
    db.run(
        'UPDATE tournaments SET name = ?, location = ?, start_date = ? WHERE id = ?',
        [name, location, start_date, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Nie znaleziono' });
            res.json({ message: 'Zaktualizowano' });
        }
    );
});

router.delete('/:id', authenticateJWT, isAdmin, (req, res) => {
    db.run('DELETE FROM tournaments WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usunięto' });
    });
});

router.post('/:id/teams', authenticateJWT, isAdmin, (req, res) => {
    const tournamentId = req.params.id;
    const { team_id } = req.body;

    db.run(
        'INSERT INTO applications (tournament_id, team_id, status) VALUES (?, ?, ?)',
        [tournamentId, team_id, 'accepted'],
        function (err) {
            if (err) return res.status(400).json({ message: 'Błąd przypisania' });
            res.status(201).json({ message: 'Drużyna dodana' });
        }
    );
});

module.exports = router;