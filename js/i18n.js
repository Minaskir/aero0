const translations = {
    ru: {
        // Navigation
        nav_home: "Главная",
        nav_mango: "Манго",
        nav_monte: "Монте Карло",
        nav_kakadu: "Какаду",
        nav_menu: "Меню",
        nav_contacts: "Контакты",
        nav_auth: "Войти / Регистрация",
        nav_profile: "Личный кабинет",
        nav_admin: "Админ-панель",

        // Hero
        hero_title: "АэроКафе",
        hero_subtitle: "Ваш уютный уголок в ожидании рейса",
        hero_lead: "Три уникальных концепции в одном аэропорту. Насладитесь вкусом перед полетом.",

        // Menu Page
        menu_title: "Меню",
        menu_subtitle: "Изысканные блюда и напитки для вашего путешествия",
        menu_search_placeholder: "Поиск по названию или составу блюда...",
        menu_all: "Все позиции",
        menu_loading: "Подготовка меню...",
        menu_add: "Добавить",
        menu_cart: "Корзина",
        menu_total: "Итого",
        menu_checkout: "Оформить и оплатить",

        // Categories
        cat_breakfast: "Завтраки",
        cat_salad: "Салаты",
        cat_soup: "Супы",
        cat_cold: "Холодные закуски",
        cat_hot_snack: "Горячие закуски",
        cat_pasta: "Паста",
        cat_pizza: "Пицца",
        cat_burger: "Бургеры и Сэндвичи",
        cat_main: "Основные блюда",
        cat_coffee: "Кофе",
        cat_tea: "Чайная карта",
        cat_soft_drink: "Безалкогольные напитки",
        cat_beer: "Пиво",
        cat_lemonade: "Лимонады",
        cat_cocktail: "Алкогольные коктейли",
        cat_alcohol: "Крепкий алкоголь и Вино",

        // Flights
        flights_title: "Табло рейсов",
        flights_departure: "Вылет",
        flights_arrival: "Прилет",
        flights_code: "Рейс",
        flights_city: "Направление",
        flights_time: "Время",
        flights_status: "Статус",

        // Footer
        footer_rights: "Все права защищены",
        
        // Notifications
        notif_added: "Добавлено в корзину",
        notif_error: "Ошибка"
    },
    en: {
        // Navigation
        nav_home: "Home",
        nav_mango: "Mango",
        nav_monte: "Monte Carlo",
        nav_kakadu: "Kakadu",
        nav_menu: "Menu",
        nav_contacts: "Contacts",
        nav_auth: "Login / Register",
        nav_profile: "My Profile",
        nav_admin: "Admin Panel",

        // Hero
        hero_title: "AeroCafe",
        hero_subtitle: "Your cozy corner while waiting for your flight",
        hero_lead: "Three unique concepts in one airport. Enjoy the taste before your flight.",

        // Menu Page
        menu_title: "Menu",
        menu_subtitle: "Exquisite dishes and drinks for your journey",
        menu_search_placeholder: "Search by name or ingredients...",
        menu_all: "All items",
        menu_loading: "Preparing menu...",
        menu_add: "Add",
        menu_cart: "Cart",
        menu_total: "Total",
        menu_checkout: "Checkout",

        // Categories
        cat_breakfast: "Breakfast",
        cat_salad: "Salads",
        cat_soup: "Soups",
        cat_cold: "Cold Starters",
        cat_hot_snack: "Hot Starters",
        cat_pasta: "Pasta",
        cat_pizza: "Pizza",
        cat_burger: "Burgers & Sandwiches",
        cat_main: "Main Courses",
        cat_coffee: "Coffee",
        cat_tea: "Tea Card",
        cat_soft_drink: "Soft Drinks",
        cat_beer: "Beer",
        cat_lemonade: "Lemonades",
        cat_cocktail: "Cocktails",
        cat_alcohol: "Spirits & Wine",

        // Flights
        flights_title: "Flight Board",
        flights_departure: "Departure",
        flights_arrival: "Arrival",
        flights_code: "Flight",
        flights_city: "Destination",
        flights_time: "Time",
        flights_status: "Status",

        // Footer
        footer_rights: "All rights reserved",

        // Notifications
        notif_added: "Added to cart",
        notif_error: "Error"
    }
};

let currentLang = localStorage.getItem('lang') || 'ru';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    
    // Перерисовываем навигацию и специфические элементы
    if (typeof syncNavigation === 'function') syncNavigation();
    if (typeof renderMenu === 'function' && typeof allMenuItems !== 'undefined') renderMenu(allMenuItems);
    if (typeof updateBoard === 'function') updateBoard(currentBoardType);
}

function applyTranslations() {
    const langData = translations[currentLang];
    
    // Ищем все элементы с атрибутом data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langData[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = langData[key];
            } else {
                el.textContent = langData[key];
            }
        }
    });

    // Обновляем текст на кнопках переключения
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});
