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
        if (!key && !d.memberDisplayName) return;
        if (!map[key]) {
            map[key] = { key, name, total: 0, count: 0, donors: [] };
        }
        map[key].total += amount;
        map[key].count += 1;
        map[key].donors.push({
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            amount: amount
        });
    });
    // Sort donors within each athlete by amount descending
    Object.values(map).forEach(a => {
        a.donors.sort((x, y) => y.amount - x.amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
}

function toggleDonors(btn) {
    const card = btn.closest('.athlete-card');
    const list = card.querySelector('.athlete-card__donors');
    const isOpen = card.classList.contains('is-expanded');

    if (isOpen) {
        card.classList.remove('is-expanded');
        list.style.maxHeight = '0';
    } else {
        card.classList.add('is-expanded');
        list.style.maxHeight = list.scrollHeight + 'px';
    }
}

function render(athletes, donations) {
    const grandTotal = athletes.reduce((s, a) => s + a.total, 0);
    els.totalDonations.textContent = `${grandTotal.toFixed(2)} $`;
    els.totalDonors.textContent = donations.length;

    if (athletes.length === 0) {
        els.grid.innerHTML = '<div class="empty"><p>Aucun don enregistré pour le moment.</p></div>';
        return;
    }

    els.grid.innerHTML = athletes.map((a, i) => {
        const pct = Math.min((a.total / 1000) * 100, 100);
        const donorRows = a.donors.map(d => {
            const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Anonyme';
            return `<div class="donor-row">
                <span class="donor-row__name">${name}</span>
                <span class="donor-row__amount">${d.amount.toFixed(2)} $</span>
            </div>`;
        }).join('');

        return `
            <div class="athlete-card" style="animation-delay:${i * 60}ms">
                <button class="athlete-card__toggle" onclick="toggleDonors(this)" aria-expanded="false" aria-label="Voir les donateurs de ${a.name}">
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
                        <svg class="athlete-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </button>
                <div class="athlete-card__donors" aria-hidden="true">
                    <div class="donor-list">
                        <div class="donor-list__header">
                            <span>Donateur</span>
                            <span>Montant</span>
                        </div>
                        ${donorRows}
                    </div>
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