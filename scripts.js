let currentQuote = null;
let allQuotes = [];

// new: mapped quote indices for the three cards and active card index
let cardIndices = [null, null, null];
let activeCard = 0;

// DOM Elements (updated)
const quotesGrid = document.getElementById('quotesGrid');
const quoteCards = () => document.querySelectorAll('.quote-card');
const shareTwitter = document.getElementById('shareTwitter');
const shareFacebook = document.getElementById('shareFacebook');
const shareWhatsapp = document.getElementById('shareWhatsapp');
const copyBtn = document.getElementById('copyBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const openFavoritesBtn = document.getElementById('openFavoritesBtn');
const closeFavorites = document.getElementById('closeFavorites');
const clearFavorites = document.getElementById('clearFavorites');
const fontInc = document.getElementById('fontInc');
const fontDec = document.getElementById('fontDec');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    setupEventListeners();
});

// Setup Event Listeners (cards + controls)
function setupEventListeners() {
    document.getElementById('nextQuoteBtn').addEventListener('click', showRandomQuotes);
    if (shareTwitter) shareTwitter.addEventListener('click', shareOnTwitter);
    if (shareFacebook) shareFacebook.addEventListener('click', shareOnFacebook);
    if (shareWhatsapp) shareWhatsapp.addEventListener('click', shareOnWhatsApp);

    if (copyBtn) copyBtn.addEventListener('click', () => copyQuote(activeCard));
    if (favoriteBtn) favoriteBtn.addEventListener('click', () => toggleFavorite(activeCard));
    if (openFavoritesBtn) openFavoritesBtn.addEventListener('click', openFavoritesModal);
    if (closeFavorites) closeFavorites.addEventListener('click', closeFavoritesModal);
    if (clearFavorites) clearFavorites.addEventListener('click', clearAllFavorites);
    if (fontInc) fontInc.addEventListener('click', () => adjustFontSize(1));
    if (fontDec) fontDec.addEventListener('click', () => adjustFontSize(-1));

    // card selection
    quotesGrid && quotesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.quote-card');
        if (!card) return;
        const idx = Number(card.getAttribute('data-card-index'));
        setActiveCard(idx);
    });

    // keyboard for active interactions
    document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') toggleFavorite(activeCard);
        if (e.key === 'c' || e.key === 'C') copyQuote(activeCard);
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            showRandomQuotes();
        }
    });
}

// Load Quotes (same fetch)
async function loadQuotes() {
    try {
        showLoading();
        const response = await fetch('quotes.json');
        if (!response.ok) {
            throw new Error('Failed to fetch quotes from quotes.json');
        }
        allQuotes = await response.json();
        if (Array.isArray(allQuotes) && allQuotes.length > 0) {
            initFavorites();
            showQuoteOfTheDayAndFill(); // populate three cards
        } else {
            // show failure on cards
            document.querySelectorAll('[data-card-text]').forEach(el => el.textContent = 'No quotes available.');
            document.querySelectorAll('[data-card-author]').forEach(el => el.textContent = '');
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        document.querySelectorAll('[data-card-text]').forEach(el => el.textContent = 'Failed to load quotes.');
        document.querySelectorAll('[data-card-author]').forEach(el => el.textContent = '');
    }
}

// Show a deterministic quote for card 0 and fill other cards with unique randoms
function showQuoteOfTheDayAndFill() {
    if (!Array.isArray(allQuotes) || allQuotes.length === 0) return;

    // deterministic index for card 0
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    const mainIndex = seed % allQuotes.length;

    // pick two other unique indices
    const indices = new Set([mainIndex]);
    while (indices.size < 3 && indices.size < allQuotes.length) {
        indices.add(Math.floor(Math.random() * allQuotes.length));
    }
    const arr = Array.from(indices);
    // if less than 3 because quotes < 3, fill with repeats if needed
    while (arr.length < 3) arr.push(arr[arr.length - 1] || 0);

    cardIndices = [arr[0], arr[1], arr[2]];
    renderCards();
    setActiveCard(0);
}

// Show Random Quotes (all three replace)
function showRandomQuotes() {
    if (!Array.isArray(allQuotes) || allQuotes.length === 0) return;
    const chosen = new Set();
    while (chosen.size < Math.min(3, allQuotes.length)) {
        chosen.add(Math.floor(Math.random() * allQuotes.length));
    }
    const arr = Array.from(chosen);
    while (arr.length < 3) arr.push(arr[arr.length - 1]);
    cardIndices = [arr[0], arr[1], arr[2]];
    renderCards();
    setActiveCard(0);
}

// render card contents
function renderCards() {
    quoteCards().forEach(card => {
        const idx = Number(card.getAttribute('data-card-index'));
        const quoteIndex = cardIndices[idx];
        const textEl = card.querySelector('[data-card-text]');
        const authorEl = card.querySelector('[data-card-author]');
        if (typeof quoteIndex === 'number' && allQuotes[quoteIndex]) {
            textEl.textContent = `"${allQuotes[quoteIndex].quote}"`;
            authorEl.textContent = `— ${allQuotes[quoteIndex].author || ''}`;
        } else {
            textEl.textContent = '—';
            authorEl.textContent = '';
        }
    });
    updateFavoriteButton();
    updateCardZIndices();
}

// set active visual state
function setActiveCard(idx) {
    activeCard = idx;
    quoteCards().forEach(card => card.classList.toggle('active', Number(card.getAttribute('data-card-index')) === idx));
    updateFavoriteButton();
    updateCardZIndices();
}

// Copy to clipboard
async function copyQuote(cardIdx) {
    const quoteIndex = cardIndices[cardIdx];
    if (quoteIndex == null) return;
    const q = allQuotes[quoteIndex];
    const text = `"${q.quote}" — ${q.author}`;
    try {
        await navigator.clipboard.writeText(text);
        const btn = document.getElementById('copyBtn');
        if (btn) {
            const prev = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => btn.textContent = prev, 1200);
        }
    } catch (err) {
        console.error('Copy failed', err);
    }
}

// favorites operate on per-card mapped quote
function isCardFavorited(cardIdx) {
    const quoteIndex = cardIndices[cardIdx];
    if (quoteIndex == null) return false;
    const q = allQuotes[quoteIndex];
    const favs = getFavorites();
    return favs.some(f => f.quote === q.quote && f.author === q.author);
}

function toggleFavorite(cardIdx) {
    const quoteIndex = cardIndices[cardIdx];
    if (quoteIndex == null) return;
    const q = allQuotes[quoteIndex];
    const favs = getFavorites();
    const exists = favs.findIndex(f => f.quote === q.quote && f.author === q.author);
    if (exists >= 0) favs.splice(exists, 1);
    else favs.unshift({ quote: q.quote, author: q.author });
    saveFavorites(favs);
    updateFavoriteButton();
}

// Update favorite button UI based on active card
function updateFavoriteButton() {
    const favBtn = document.getElementById('favoriteBtn');
    if (!favBtn) return;
    if (isCardFavorited(activeCard)) {
        favBtn.textContent = '❤️';
        favBtn.title = 'Remove from favorites';
    } else {
        favBtn.textContent = '♡';
        favBtn.title = 'Add to favorites';
    }
}

// Favorites modal
function openFavoritesModal() {
    const modal = document.getElementById('favoritesModal');
    const listEl = document.getElementById('favoritesList');
    if (!modal || !listEl) return;
    const favs = getFavorites();
    if (favs.length === 0) {
        listEl.innerHTML = '<p>No favorites yet.</p>';
    } else {
        listEl.innerHTML = favs.map((q, idx) =>
            `<div class="fav-item" data-idx="${idx}">
                <p class="fav-quote">"${escapeHtml(q.quote)}"</p>
                <p class="fav-author">— ${escapeHtml(q.author)}</p>
                <div class="fav-actions">
                    <button class="btn small" data-action="copy" data-idx="${idx}">Copy</button>
                    <button class="btn small" data-action="show" data-idx="${idx}">Show</button>
                    <button class="btn small" data-action="remove" data-idx="${idx}">Remove</button>
                </div>
            </div>`
        ).join('');
    }
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    listEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const action = btn.getAttribute('data-action');
            const idx = Number(btn.getAttribute('data-idx'));
            handleFavAction(action, idx);
        });
    });
}

function closeFavoritesModal() {
    const modal = document.getElementById('favoritesModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

function handleFavAction(action, idx) {
    const favs = getFavorites();
    const item = favs[idx];
    if (!item) return;
    if (action === 'copy') {
        navigator.clipboard.writeText(`"${item.quote}" — ${item.author}`);
    } else if (action === 'show') {
        const quoteIdx = allQuotes.findIndex(q => q.quote === item.quote && q.author === item.author);
        if (quoteIdx >= 0) {
            cardIndices[activeCard] = quoteIdx;
            renderCards();
        }
        closeFavoritesModal();
    } else if (action === 'remove') {
        favs.splice(idx, 1);
        saveFavorites(favs);
        openFavoritesModal();
        updateFavoriteButton();
    }
}

function clearAllFavorites() {
    saveFavorites([]);
    openFavoritesModal();
    updateFavoriteButton();
}

// Favorites handling (localStorage)
const FAVORITES_KEY = 'wisdom_favorites';

function initFavorites() {
    if (!localStorage.getItem(FAVORITES_KEY)) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
    }
    updateFavoriteButton();
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch {
        return [];
    }
}

function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

// small helper to escape HTML when rendering
function escapeHtml(str) {
    return String(str).replace(/[&<>"'`=\/]/g, s => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
    })[s]);
}

// Font-size adjustments (persists in localStorage)
const FONT_KEY = 'wisdom_font_size';
function adjustFontSize(delta) {
    const current = Number(localStorage.getItem(FONT_KEY)) || 0;
    const newVal = Math.min(3, Math.max(-2, current + delta));
    localStorage.setItem(FONT_KEY, String(newVal));
    applyFontSize();
}

function applyFontSize() {
    const base = 18;
    const diff = Number(localStorage.getItem(FONT_KEY)) || 0;
    const size = base + diff * 2;
    document.documentElement.style.setProperty('--quote-font-size', `${size}px`);
}

applyFontSize();

// Share Functions
function shareOnTwitter() {
    const quoteIndex = cardIndices[activeCard];
    if (quoteIndex == null) return;
    const q = allQuotes[quoteIndex];
    const text = `"${q.quote}" — ${q.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
}

function shareOnFacebook() {
    const quoteIndex = cardIndices[activeCard];
    if (quoteIndex == null) return;
    const q = allQuotes[quoteIndex];
    const text = `"${q.quote}" — ${q.author}`;
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
}

function shareOnWhatsApp() {
    const quoteIndex = cardIndices[activeCard];
    if (quoteIndex == null) return;
    const q = allQuotes[quoteIndex];
    const text = `"${q.quote}" — ${q.author}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Show Loading State
function showLoading() {
    document.querySelectorAll('[data-card-text]').forEach(el => el.textContent = 'Loading wisdom...');
    document.querySelectorAll('[data-card-author]').forEach(el => el.textContent = '— Please wait');
}

// Update z-index for stacking
function updateCardZIndices() {
    const cards = Array.from(quoteCards());
    cards.forEach((card, i) => {
        let z = 10 + i;
        if (Number(card.getAttribute('data-card-index')) === activeCard) z = 100;
        card.style.zIndex = z;
    });
}