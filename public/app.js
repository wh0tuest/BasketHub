const API = 'http://localhost:3000';
let activeTeamId = null, currentTournamentPage = 1;

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const getUserInfo = () => {
    try {
        return JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
    } catch { return { role: 'guest', id: null }; }
};

async function request(path, method = 'GET', body = null, auth = true) {
    const opts = { method, headers: auth ? getAuthHeaders() : { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    return res.ok ? data : Promise.reject(data);
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname, user = getUserInfo();
    const toggle = (id, show) => { const el = document.getElementById(id); if(el) el.style.display = show ? 'inline-block' : 'none'; };

    toggle('login-btn', user.role === 'guest');
    toggle('register-btn', user.role === 'guest');
    toggle('logout-btn', user.role !== 'guest');
    toggle('dashboard-link', user.role !== 'guest');

    const infoSpan = document.getElementById('user-info');
    if (infoSpan) infoSpan.innerText = user.role !== 'guest' ? `Rola: ${user.role}` : 'Gość';

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    if (path.includes('dashboard.html')) {
        if (user.role === 'guest') {
            window.location.href = 'login.html';
        } else {
            loadTournaments();
            loadMyTeam();
            const adminSection = document.getElementById('admin-section');
            if (adminSection) adminSection.style.display = user.role === 'admin' ? 'block' : 'none';
        }
    }
    if (path.includes('tournament.html')) loadTournamentDetails();
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) loadTournaments();
});

const login = () => request('/auth/login', 'POST', {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
}, false).then(data => {
    localStorage.setItem('token', data.token);
    window.location = 'dashboard.html';
}).catch(() => document.getElementById('msg').innerText = 'Błędne dane');

const register = () => request('/auth/register', 'POST', {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
}, false).then(data => document.getElementById('msg').innerText = data.message)
    .catch(err => alert(err.error));

const logout = () => { localStorage.removeItem('token'); window.location = 'index.html'; };

function loadTournaments(page = 1) {
    currentTournamentPage = page;
    request(`/tournaments?page=${page}&limit=5`, 'GET', null, false).then(res => {
        const container = document.getElementById('list');
        if (!container) return;
        container.innerHTML = res.data.map(t => `
            <div class="tournament-card">
                ${getUserInfo().role === 'admin' ? `<button class="btn-delete-admin" onclick="deleteTournament(${t.id})">🗑️</button>` : ''}
                <span class="badge">Basketball</span>
                <h3>${t.name}</h3>
                <div class="card-body">
                    <p>📍 ${t.location}</p>
                    <p>📅 ${t.start_date}</p>
                </div>
                <a href="tournament.html?id=${t.id}" class="btn-details">Szczegóły</a>
            </div>
        `).join('');
        renderPagination(res.page, Math.ceil(res.total / res.limit));
    });
}

function renderPagination(current, total) {
    const cont = document.getElementById('pagination');
    if (!cont) return;
    cont.innerHTML = `Strona ${current} z ${total} `;
    if (current > 1) cont.insertAdjacentHTML('afterbegin', `<button onclick="loadTournaments(${current - 1})">Poprzednia</button>`);
    if (current < total) cont.insertAdjacentHTML('beforeend', `<button onclick="loadTournaments(${current + 1})">Następna</button>`);
}

const addTournament = () => {
    const date = document.getElementById('date').value;
    const today = new Date().toISOString().split('T')[0];

    if (date < today) {
        return alert('Nie można utworzyć turnieju z datą wsteczną!');
    }

    request('/tournaments', 'POST', {
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        start_date: date
    }).then(() => {
        loadTournaments(currentTournamentPage);
        alert('Dodano turniej!');
    }).catch(err => alert(err.message));
};

const deleteTournament = (id) => confirm('Usunąć?') && request(`/tournaments/${id}`, 'DELETE').then(() => loadTournaments(currentTournamentPage));

async function loadTournamentDetails() {
    const id = new URLSearchParams(window.location.search).get('id');
    const user = getUserInfo();
    try {
        const t = await request(`/tournaments/${id}`, 'GET', null, false);
        document.getElementById('title').innerText = t.name;
        document.getElementById('info').innerText = `📍 ${t.location} | 📅 ${t.start_date}`;

        const apps = t.applications || [];
        const accepted = apps.filter(a => a.status === 'accepted');
        document.getElementById('teams').innerHTML = accepted.map(a => `<li>🏀 ${a.name} (${a.city})</li>`).join('') || '<li>Brak drużyn</li>';

        const myApp = apps.find(a => a.owner_id === user.id);
        const toggle = (id, show) => { const el = document.getElementById(id); if(el) el.style.display = show ? 'block' : 'none'; };

        toggle('edit-tournament-form', false);
        toggle('guest-msg', user.role === 'guest');

        const isAdmin = user.role === 'admin';
        const isLogged = user.role !== 'guest';

        toggle('admin-management-section', isAdmin);
        toggle('show-edit-btn', isAdmin);
        if (isAdmin) renderAdminPanel(apps);

        toggle('user-status-section', isLogged && !!myApp);
        if (myApp) document.getElementById('my-app-status').innerText = myApp.status;

        const canApply = isLogged && !myApp;
        toggle('application-section', canApply);
        if (canApply) await loadMyTeamsForSelect();

    } catch (e) { console.error(e); }
}

function toggleEditForm(show) {
    const user = getUserInfo();
    if (user.role !== 'admin') return;

    const form = document.getElementById('edit-tournament-form');
    const btn = document.getElementById('show-edit-btn');

    if (form) form.style.display = show ? 'block' : 'none';
    if (btn) btn.style.display = show ? 'none' : 'block';

    if (show) {
        document.getElementById('edit-name').value = document.getElementById('title').innerText;
        const infoText = document.getElementById('info').innerText;
        document.getElementById('edit-location').value = infoText.split('|')[0].replace('📍', '').trim();

        const editDateInput = document.getElementById('edit-date');
        if (editDateInput) {
            editDateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
        }
    }
}

async function saveTournamentEdit() {
    const id = new URLSearchParams(window.location.search).get('id');
    const date = document.getElementById('edit-date').value;
    const today = new Date().toISOString().split('T')[0];

    if (date < today) return alert("Data nie może być w przeszłości!");

    const body = {
        name: document.getElementById('edit-name').value,
        location: document.getElementById('edit-location').value,
        start_date: date
    };

    try {
        await request(`/tournaments/${id}`, 'PUT', body);
        alert('Turniej zaktualizowany!');
        location.reload();
    } catch (e) {
        alert('Błąd: ' + (e.message || "Brak uprawnień"));
    }
}

function loadMyTeam() {
    const userInfo = getUserInfo();
    if (userInfo.role === 'guest') return;

    fetch(`${API}/teams`)
        .then(res => res.json())
        .then(res => {
            const container = document.getElementById('my-team-details');
            if (!container) return;

            const myTeam = res.data.find(t => t.owner_id === userInfo.id);

            if (myTeam) {
                activeTeamId = myTeam.id;
                container.innerHTML = `
                    <div class="card" style="border: 2px solid var(--red); padding: 15px; margin-top: 20px;">
                        <h4>Twój zespół: ${myTeam.name}</h4>
                        <p>Miasto: ${myTeam.city}</p>
                        <button class="btn-primary" onclick="togglePlayerManagement()">Zarządzaj graczami</button>
                    </div>
                `;

                const createTeamSection = document.getElementById('user-section');
                if (createTeamSection) createTeamSection.style.display = 'none';
            }
        });
}

function loadPlayersList() {
    if(!activeTeamId) return;
    request(`/teams/${activeTeamId}`).then(team => {
        const p = team.players || [];
        const countInfo = document.getElementById('player-count-info');
        if(countInfo) countInfo.innerText = `Skład: ${p.length} / 5`;
        document.getElementById('current-players-list').innerHTML = p.map(player => `
            <li class="player-item">
                <div><strong>${player.name}</strong> — ${player.position}</div>
                <div>
                    <button class="btn-edit-small" onclick="editPlayer(${player.id}, '${player.name}', '${player.position}')">✏️</button>
                    <button class="btn-delete-small" onclick="deletePlayer(${player.id})">🗑️</button>
                </div>
            </li>`).join('') || '<li>Brak graczy</li>';
    });
}

async function editPlayer(playerId, oldName, oldPosition) {
    const name = prompt("Nowe imię:", oldName);
    const pos = prompt("Nowa pozycja:", oldPosition);
    if (name && pos) {
        await request(`/players/${playerId}`, 'PUT', { name, position: pos });
        loadPlayersList();
    }
}

const deletePlayer = (id) => confirm('Usunąć?') && request(`/players/${id}`, 'DELETE').then(loadPlayersList);

async function loadMyTeamsForSelect() {
    const select = document.getElementById('teams-select');
    if (!select) return;
    const res = await request('/teams');
    const myTeams = res.data.filter(t => t.owner_id === getUserInfo().id);
    select.innerHTML = '<option value="">-- Wybierz drużynę --</option>' +
        myTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

async function sendApplication() {
    const teamId = document.getElementById('teams-select').value;
    const tournamentId = new URLSearchParams(window.location.search).get('id');
    if (!teamId) return alert('Wybierz drużynę!');
    await request('/applications', 'POST', { team_id: teamId, tournament_id: tournamentId });
    alert('Wysłano!');
    location.reload();
}

function renderAdminPanel(apps) {
    const list = document.getElementById('admin-apps-list');
    if(!list) return;
    const pending = apps.filter(a => a.status === 'pending');
    list.innerHTML = pending.map(a => `
        <li class="player-item">
            <span><strong>${a.name}</strong> (${a.city})</span>
            <div>
                <button onclick="updateStatus(${a.application_id}, 'accepted')" style="color:green">✔</button>
                <button onclick="updateStatus(${a.application_id}, 'rejected')" style="color:red">✖</button>
            </div>
        </li>`).join('') || '<li>Brak wniosków</li>';
}

const updateStatus = (id, status) => request(`/applications/${id}`, 'PUT', { status }).then(loadTournamentDetails);
const togglePlayerManagement = () => {
    const s = document.getElementById('manage-players-section');
    if(s) {
        s.style.display = s.style.display === 'none' ? 'block' : 'none';
        if(s.style.display === 'block') loadPlayersList();
    }
};

async function addPlayerToTeam() {
    const nameInput = document.getElementById('player-name-input');
    const posInput = document.getElementById('player-position-input');

    if (!nameInput || !posInput) return;

    const name = nameInput.value.trim();
    const position = posInput.value;

    if (!name) return alert("Podaj imię i nazwisko gracza!");

    try {
        const team = await request(`/teams/${activeTeamId}`);
        if (team.players && team.players.length >= 5) {
            return alert("Osiągnięto limit 5 graczy w drużynie!");
        }

        await request('/players', 'POST', {
            name: name,
            position: position,
            team_id: activeTeamId
        });

        nameInput.value = '';
        alert("Gracz został dodany!");
        loadPlayersList();

    } catch (err) {
        console.error("Błąd podczas dodawania gracza:", err);
        alert("Wystąpił błąd: " + (err.message || "Brak uprawnień"));
    }
}

function addTeam() {
    const nameInput = document.getElementById('team-name');
    const cityInput = document.getElementById('team-city');

    fetch(`${API}/teams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: nameInput.value, city: cityInput.value })
    })
        .then(res => res.json())
        .then(data => {
            if (data.id) {
                alert('Drużyna dodana!');
                loadMyTeam();
            } else {
                alert(data.message);
            }
        });
}

async function deleteTeam(teamId) {

    const idToDelete = teamId || activeTeamId;

    if (!idToDelete) return alert("Błąd: Nie znaleziono ID drużyny.");

    if (!confirm("Czy na pewno chcesz usunąć swoją drużynę? Wszystkie zgłoszenia na turnieje zostaną anulowane.")) {
        return;
    }

    try {
        await request(`/teams/${idToDelete}`, 'DELETE');
        alert("Drużyna została pomyślnie usunięta.");

        location.reload();
    } catch (err) {
        console.error("Błąd usuwania drużyny:", err);
        alert("Wystąpił błąd: " + (err.message || "Nie masz uprawnień"));
    }
}

