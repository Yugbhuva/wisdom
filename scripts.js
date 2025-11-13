let currentQuote = null;
let allQuotes = [];
let cardIndices = [null, null, null];
let activeCard = 0;

// DOM Elements
const quotesGrid = document.getElementById('quotesGrid');
const quoteCards = () => document.querySelectorAll('.quote-card');
const shareTwitter = document.getElementById('shareTwitter');
const shareFacebook = document.getElementById('shareFacebook');
const shareWhatsapp = document.getElementById('shareWhatsapp');
const copyBtn = document.getElementById('copyBtn');
const fontInc = document.getElementById('fontInc');
const fontDec = document.getElementById('fontDec');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('nextQuoteBtn').addEventListener('click', showRandomQuotes);
    if (shareTwitter) shareTwitter.addEventListener('click', shareOnTwitter);
    if (shareFacebook) shareFacebook.addEventListener('click', shareOnFacebook);
    if (shareWhatsapp) shareWhatsapp.addEventListener('click', shareOnWhatsApp);
    if (copyBtn) copyBtn.addEventListener('click', () => copyQuote(activeCard));
    if (fontInc) fontInc.addEventListener('click', () => adjustFontSize(1));
    if (fontDec) fontDec.addEventListener('click', () => adjustFontSize(-1));

    quotesGrid && quotesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.quote-card');
        if (!card) return;
        const idx = Number(card.getAttribute('data-card-index'));
        setActiveCard(idx);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'c' || e.key === 'C') copyQuote(activeCard);
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            showRandomQuotes();
        }
    });
}

// Load Quotes from JSON
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
            showQuoteOfTheDayAndFill();
        } else {
            document.querySelectorAll('[data-card-text]').forEach(el => el.textContent = 'No quotes available.');
            document.querySelectorAll('[data-card-author]').forEach(el => el.textContent = '');
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        document.querySelectorAll('[data-card-text]').forEach(el => el.textContent = 'Failed to load quotes.');
        document.querySelectorAll('[data-card-author]').forEach(el => el.textContent = '');
    }
}

// Show Loading State
function showLoading() {
    document.querySelectorAll('[data-card-text]').forEach(el => el.textContent = 'Loading wisdom...');
    document.querySelectorAll('[data-card-author]').forEach(el => el.textContent = '— Please wait');
}

// Show Quote of the Day + Fill other cards
function showQuoteOfTheDayAndFill() {
    if (!Array.isArray(allQuotes) || allQuotes.length === 0) return;

    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const mainIndex = seed % allQuotes.length;

    const indices = new Set([mainIndex]);
    while (indices.size < 3 && indices.size < allQuotes.length) {
        indices.add(Math.floor(Math.random() * allQuotes.length));
    }
    const arr = Array.from(indices);
    while (arr.length < 3) arr.push(arr[arr.length - 1] || 0);

    cardIndices = [arr[0], arr[1], arr[2]];
    renderCards();
    setActiveCard(0);
}

// Show Random Quotes (replace all three)
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

// Render card contents
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
    updateCardZIndices();
}

// Set active card
function setActiveCard(idx) {
    activeCard = idx;
    quoteCards().forEach(card => card.classList.toggle('active', Number(card.getAttribute('data-card-index')) === idx));
    updateCardZIndices();
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

// Font-size adjustments
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

// Favorites handling
const FAVORITES_KEY = 'wisdom_favorites';

function initFavorites() {
    if (!localStorage.getItem(FAVORITES_KEY)) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
    }
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