const els = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    grid: document.getElementById('athleteGrid'),
    totalDonations: document.getElementById('totalDonations'),
    totalDonors: document.getElementById('totalDonors')
};

function initFirebase() {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    return firebase.firestore();
}

async function fetchDonations(db) {
    const snapshot = await db.collection('donations').get();
    return snapshot.docs.map(doc => doc.data());
}

function aggregateByAthlete(donations) {
    const map = {};

    donations.forEach(d => {
        const key = d.member;
        const name = d.memberDisplayName || key;
        const amount = Number(d.amount) || 0;

        if (!map[key]) {
            map[key] = { key, name, total: 0, count: 0 };
        }
        map[key].total += amount;
        map[key].count += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
}

function render(athletes, donations) {
    const grandTotal = athletes.reduce((s, a) => s + a.total, 0);
    els.totalDonations.textContent = `${grandTotal.toFixed(2)} $`;
    els.totalDonors.textContent = donations.length;

    if (athletes.length === 0) {
        els.grid.innerHTML = '<div class="empty"><p>Aucun don enregistré pour le moment.</p></div>';
        return;
    }

    const maxTotal = athletes[0].total;

    els.grid.innerHTML = athletes.map((a, i) => {
        const pct = Math.min((a.total / 1000) * 100, 100);
        return `
            <div class="athlete-card" style="animation-delay:${i * 60}ms">
                <div class="athlete-card__info">
                    <div class="athlete-card__name">${a.name}</div>
                    <div class="athlete-card__bar-track">
                        <div class="athlete-card__bar-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="athlete-card__meta">
                        <span>${a.count} don${a.count > 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="athlete-card__amount">
                    <div class="athlete-card__total">${a.total.toFixed(2)} $</div>
                </div>
            </div>`;
    }).join('');
}

async function init() {
    try {
        const db = initFirebase();
        const donations = await fetchDonations(db);
        const athletes = aggregateByAthlete(donations);

        els.loading.hidden = true;
        render(athletes, donations);
    } catch (err) {
        console.error('Dashboard error:', err);
        els.loading.hidden = true;
        els.error.hidden = false;
    }
}

document.addEventListener('DOMContentLoaded', init);
