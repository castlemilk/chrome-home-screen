// Landing Page JavaScript

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Widget tabs functionality
const tabButtons = document.querySelectorAll('.tab-button');
const widgetPreviews = document.querySelectorAll('.widget-preview');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const widgetId = button.dataset.widget;
        
        // Remove active class from all
        tabButtons.forEach(btn => btn.classList.remove('active'));
        widgetPreviews.forEach(preview => preview.classList.remove('active'));
        
        // Add active class to clicked
        button.classList.add('active');
        const targetPreview = document.getElementById(widgetId);
        if (targetPreview) {
            targetPreview.classList.add('active');
        }
    });
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Animated counter for stats
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current + (element.dataset.suffix || '');
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

// Trigger stat animations when visible
const stats = document.querySelectorAll('.stat strong');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            const text = entry.target.textContent;
            const value = parseInt(text.replace(/\D/g, ''));
            if (!isNaN(value)) {
                entry.target.dataset.suffix = text.replace(/\d/g, '');
                animateValue(entry.target, 0, value, 1000);
            }
        }
    });
}, { threshold: 0.5 });

stats.forEach(stat => statsObserver.observe(stat));

// Add installation tracking
document.querySelectorAll('.cta-button[href*="chrome.google.com"]').forEach(button => {
    button.addEventListener('click', () => {
        // Track installation attempt
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                'event_category': 'CTA',
                'event_label': 'Install Extension',
                'value': 1
            });
        }
        
        // Store installation attempt in localStorage for retargeting
        localStorage.setItem('chrome_home_install_attempted', Date.now());
    });
});

// Check if extension is already installed (optional)
// This would require the extension to inject a marker on the page
if (document.documentElement.dataset.chromeHomeInstalled) {
    document.querySelectorAll('.cta-button.primary').forEach(button => {
        button.textContent = '✓ Already Installed';
        button.style.background = '#10b981';
        button.style.pointerEvents = 'none';
    });
}

// Lazy load images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        }
    });
}, { rootMargin: '50px' });

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});