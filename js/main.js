document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeMenuFilters();
    initializeBookingSystem();
    initializeAnimations();
    initializeLazyLoading();
    initializeSearch();
    handleContactForm();
    
    if (document.getElementById('flightsContainer')) {
        updateBoard('departure');
    }
});

// --- СИСТЕМА БРОНИРОВАНИЯ (С ВАЛИДАЦИЕЙ) ---
function initializeBookingSystem() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    const openBtns = document.querySelectorAll('.booking-open-btn');
    const closeBtn = modal.querySelector('.close');
    const form = modal.querySelector('.booking-form');
    const cafeInput = modal.querySelector('.booking-cafe-input');
    const phoneInput = form?.querySelector('input[name="phone"]');
    const dateInput = form?.querySelector('input[name="date"]');

    // Ограничение даты
    if (dateInput) {
        dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

    // Валидация телефона (только цифры, макс 11)
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            e.target.value = val;
        });
    }

    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (cafeInput) cafeInput.value = btn.dataset.cafe || 'Манго';
            
            // Автозаполнение для авторизованных
            const storedName = localStorage.getItem('userName');
            const storedPhone = localStorage.getItem('userPhone'); // Если сохраняли
            if (storedName && form.name) form.name.value = storedName;
            
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);
        });
    });

    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    window.onclick = (e) => { if (e.target === modal) closeModal(); };

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form));
            
            if (data.phone.length < 11) {
                showNotification('Введите 11 цифр номера телефона', 'error');
                return;
            }

            try {
                const headers = { 'Content-Type': 'application/json' };
                const token = localStorage.getItem('token');
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    showNotification('Бронирование успешно отправлено!', 'success');
                    form.reset();
                    closeModal();
                } else {
                    const errData = await res.json();
                    showNotification(errData.message || 'Ошибка при бронировании', 'error');
                }
            } catch (err) {
                showNotification('Ошибка связи с сервером', 'error');
            }
        };
    }
}

// --- ТАБЛО РЕЙСОВ ОРЕНБУРГ (REN) ---
let flightsData = {
    departure: [],
    arrival: []
};

let currentBoardType = 'departure';

async function updateBoard(type) {
    currentBoardType = type;
    const container = document.getElementById('flightsContainer');
    if (!container) return;
    
    // Обновляем активную вкладку
    document.querySelectorAll('.board-tab').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase() === (type === 'departure' ? 'вылет' : 'прилет'));
    });

    try {
        const response = await fetch(`/api/flights/${type}`);
        const data = await response.json();
        
        if (data.schedule && data.schedule.length > 0) {
            flightsData[type] = data.schedule;
        } else if (data.error === 'API Key not configured') {
            console.warn('Используются демо-данные, так как API ключ не настроен.');
            if (flightsData[type].length === 0) {
                flightsData = getDemoFlights();
            }
        }
    } catch (err) {
        console.error('Ошибка при загрузке реального табло:', err);
        if (flightsData[type].length === 0) {
            flightsData = getDemoFlights();
        }
    }

    const flights = flightsData[type];
    container.innerHTML = flights.map(f => {
        if (f.isSeparator) {
            return `<div class="board-day-separator">${f.label}</div>`;
        }
        return `
            <div class="board-grid flight-row">
                <div style="font-weight: 700; color: var(--brand)">${f.code}</div>
                <div>${f.city}</div>
                <div>${f.time}</div>
                <div class="flight-status status-${f.class}">${f.status}</div>
            </div>
        `;
    }).join('');
}

function getDemoFlights() {
    return {
        departure: [
            { code: 'SU 1245', city: 'Москва (SVO)', time: '06:10', status: 'Вылетел', class: 'ontime' },
            { code: 'N4 078', city: 'Москва (VKO)', time: '11:45', status: 'Посадка', class: 'boarding' },
            { code: 'SU 6452', city: 'Санкт-Петербург (LED)', time: '13:20', status: 'Ожидается', class: 'ontime' },
            { code: 'DP 432', city: 'Москва (DME)', time: '15:50', status: 'Ожидается', class: 'ontime' },
            { code: 'N4 531', city: 'Сочи (AER)', time: '18:10', status: 'Задержан', class: 'delayed' }
        ],
        arrival: [
            { code: 'SU 1244', city: 'Москва (SVO)', time: '05:20', status: 'Прибыл', class: 'ontime' },
            { code: 'N4 077', city: 'Москва (VKO)', time: '10:50', status: 'Приземлился', class: 'ontime' },
            { code: 'EO 431', city: 'Санкт-Петербург (LED)', time: '12:35', status: 'В пути', class: 'boarding' }
        ]
    };
}

setInterval(() => updateBoard(currentBoardType), 60000);

// --- Глобальные настройки ---
async function applyGlobalSettings() {
    try {
        const res = await fetch('/api/settings/public');
        const settings = await res.json();
        
        if (settings.contact_phone) {
            const footerPhone = document.querySelector('.site-footer p');
            if (footerPhone) {
                footerPhone.innerHTML = `© 2025 АэроКафе | Тел: <a href="tel:${settings.contact_phone.replace(/\D/g,'')}" style="color:var(--brand)">${settings.contact_phone}</a>`;
            }
            const contactPagePhone = document.getElementById('displayContactPhone');
            if (contactPagePhone) contactPagePhone.textContent = settings.contact_phone;
        }
    } catch (e) { console.error('Ошибка применения настроек'); }
}

function initializeNavigation() {
    applyGlobalSettings();
    syncNavigation();
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    if (navToggle && nav) {
        navToggle.onclick = () => nav.classList.toggle('open');
        document.querySelectorAll('.nav-list a').forEach(l => l.onclick = () => nav.classList.remove('open'));
    }
}

function syncNavigation() {
    const navList = document.querySelector('.nav-list');
    if (!navList) return;

    const isSubdir = window.location.pathname.includes('/cafes/');
    const base = isSubdir ? '../' : './';
    const cafeBase = isSubdir ? './' : './cafes/';

    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const role = localStorage.getItem('role');
    
    let authLabel = 'Войти / Регистрация';
    let authHref = base + 'auth.html';
    
    if (token) {
        authLabel = userName || 'Личный кабинет';
        authHref = role === 'admin' ? base + 'admin.html' : base + 'profile.html';
    }

    navList.innerHTML = `
        <li><a href="${base}index.html">Главная</a></li>
        <li><a href="${cafeBase}mango.html">Манго</a></li>
        <li><a href="${cafeBase}monte-carlo.html">Монте Карло</a></li>
        <li><a href="${cafeBase}kakadu.html">Какаду</a></li>
        <li><a href="${base}menu.html">Меню</a></li>
        <li><a href="${base}contacts.html">Контакты</a></li>
        <li class="nav-auth-group">
            <a href="${authHref}" id="navAuthBtn" class="nav-auth-link primary">${authLabel}</a>
        </li>
    `;
}

function initializeMenuFilters() {
    const menuItems = document.querySelectorAll('.menu-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            const cat = btn.dataset.category;
            menuItems.forEach(item => {
                item.style.display = (cat === 'all' || item.dataset.category === cat) ? 'grid' : 'none';
            });
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });
}

function initializeAnimations() {
    const blocks = document.querySelectorAll('.cafe-card, .service-card, .schedule-card, .flight-board-section, .menu-section, .about, .cafes-overview, .services, .schedule, .reviews, .booking-section, .header-cover');
    blocks.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { 
            if (e.isIntersecting) {
                e.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initializeLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const target = e.target;
                if (target.tagName === 'IMG' && target.dataset.src) {
                    target.src = target.dataset.src;
                    target.classList.remove('lazy');
                    target.classList.add('loaded');
                }
                if (target.classList.contains('reveal')) {
                    target.classList.add('revealed');
                }
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('img[data-src], .menu-item, .reveal').forEach(img => observer.observe(img));
}

function initializeSearch() {
    const input = document.querySelector('.search-input');
    if (input) {
        input.oninput = debounce((e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.menu-item').forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(query) ? 'grid' : 'none';
            });
        }, 300);
    }
}

function handleContactForm() {
    const form = document.querySelector('.contact-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            showNotification('Спасибо! Сообщение отправлено.', 'success');
            form.reset();
        };
    }
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
