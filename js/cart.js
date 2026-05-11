let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    const modalTotalEl = document.getElementById('cartModalTotal');
    const listEl = document.getElementById('cartItemsList');

    const totalCount = cart.reduce((sum, item) => sum + item.count, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.count), 0);

    if (countEl) countEl.textContent = totalCount;
    if (totalEl) totalEl.textContent = `${totalPrice} ₽`;
    if (modalTotalEl) modalTotalEl.textContent = `${totalPrice} ₽`;

    if (listEl) {
        if (cart.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 20px;">Корзина пуста</p>';
        } else {
            listEl.innerHTML = cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p style="font-size: 14px; color: var(--brand); margin: 4px 0 0;">${item.price} ₽</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="cart-btn" onclick="changeCount(${index}, -1)">-</button>
                        <span style="min-width: 20px; text-align: center;">${item.count}</span>
                        <button class="cart-btn" onclick="changeCount(${index}, 1)">+</button>
                    </div>
                </div>
            `).join('');
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
}

function showNotification(message, type = 'info') {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const n = document.createElement('div');
    const iconMap = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️'
    };
    
    n.className = `notification notification-${type}`;
    n.innerHTML = `
        <div class="notification-icon">${iconMap[type] || 'ℹ️'}</div>
        <div class="notification-content">${message}</div>
    `;
    
    // Вставляем в начало, чтобы новые были сверху
    container.prepend(n);
    
    // Анимация появления
    setTimeout(() => n.classList.add('show'), 10);
    
    // Удаление
    setTimeout(() => {
        n.classList.remove('show');
        setTimeout(() => n.remove(), 500);
    }, 4000);
}

function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.count++;
    } else {
        cart.push({ name, price: parseInt(price), count: 1 });
    }
    updateCartUI();
    
    showNotification(`Добавлено: ${name}`, 'success');
}

function changeCount(index, delta) {
    cart[index].count += delta;
    if (cart[index].count <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.classList.toggle('open');
}

function goToCheckout() {
    if (cart.length === 0) {
        alert('Сначала добавьте что-нибудь в корзину');
        return;
    }
    if (!localStorage.getItem('token')) {
        alert('Для оформления заказа необходимо войти в аккаунт');
        window.location.href = '/auth.html';
        return;
    }
    window.location.href = '/checkout.html';
}

// Инициализация кнопок на странице
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.menu-item');
            const name = item.getAttribute('data-name');
            const price = item.getAttribute('data-price');
            addToCart(name, price);
        });
    });
    updateCartUI();
});
