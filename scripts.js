let currentQuote = null;
let allQuotes = [];

// DOM Elements
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const nextQuoteBtn = document.getElementById('nextQuoteBtn');
const quoteContainer = document.getElementById('quoteContainer');
const shareTwitter = document.getElementById('shareTwitter');
const shareFacebook = document.getElementById('shareFacebook');
const shareWhatsapp = document.getElementById('shareWhatsapp');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    nextQuoteBtn.addEventListener('click', showRandomQuote);
    shareTwitter.addEventListener('click', shareOnTwitter);
    shareFacebook.addEventListener('click', shareOnFacebook);
    shareWhatsapp.addEventListener('click', shareOnWhatsApp);
}

// Load Quotes from quotes.json
async function loadQuotes() {
    try {
        showLoading();
        const response = await fetch('quotes.json');
        if (!response.ok) {
            throw new Error('Failed to fetch quotes from quotes.json');
        }
        allQuotes = await response.json();
        if (Array.isArray(allQuotes) && allQuotes.length > 0) {
            showRandomQuote();
        } else {
            quoteText.textContent = 'No quotes available.';
            quoteAuthor.textContent = '';
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        quoteText.textContent = 'Failed to load quotes.';
        quoteAuthor.textContent = '';
    }
}

// Show Loading State
function showLoading() {
    quoteContainer.classList.add('loading');
    quoteText.textContent = 'Loading wisdom...';
    quoteAuthor.textContent = '— Please wait';
}

// Show Random Quote
function showRandomQuote() {
    if (allQuotes.length === 0) {
        return;
    }
    
    // Remove animation class temporarily
    const quoteContent = document.querySelector('.quote-content');
    quoteContent.style.animation = 'none';
    
    setTimeout(() => {
        // Get random quote
        const randomIndex = Math.floor(Math.random() * allQuotes.length);
        currentQuote = allQuotes[randomIndex];
        
        // Update DOM
        quoteText.textContent = `"${currentQuote.quote}"`;
        quoteAuthor.textContent = `— ${currentQuote.author}`;
        
        // Remove loading state
        quoteContainer.classList.remove('loading');
        
        // Restart animation
        quoteContent.style.animation = 'fadeIn 0.8s ease forwards';
    }, 50);
}

// Share Functions
function shareOnTwitter() {
    if (!currentQuote) return;
    const text = `"${currentQuote.quote}" — ${currentQuote.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
}

function shareOnFacebook() {
    if (!currentQuote) return;
    const text = `"${currentQuote.quote}" — ${currentQuote.author}`;
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
}

function shareOnWhatsApp() {
    if (!currentQuote) return;
    const text = `"${currentQuote.quote}" — ${currentQuote.author}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Keyboard shortcut: Space bar for next quote
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' /* && e.target.tagName !== 'SELECT' */) {
        e.preventDefault();
        showRandomQuote();
    }
});