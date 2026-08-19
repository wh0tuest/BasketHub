const express = require('express');
const app = express();

require('./db/init');

app.use(express.json());
app.use(express.static('public'));


app.use('/auth', require('./routes/auth'));
app.use('/tournaments', require('./routes/tournaments'));
app.use('/teams', require('./routes/teams'));
app.use('/applications', require('./routes/applications'));
app.use('/players', require('./routes/players'))


app.get('/', (req, res) => {
    res.json({ message: 'API działa' });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});


