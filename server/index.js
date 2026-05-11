const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const crypto = require('crypto');
const XLSX = require('xlsx');
require('dotenv').config();

const sequelize = require('./db');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Order = require('./models/Order');
const Message = require('./models/Message');
const JobApplication = require('./models/JobApplication');
const MenuItem = require('./models/MenuItem');
const Log = require('./models/Log');
const Notification = require('./models/Notification');
const Setting = require('./models/Setting');

// --- Associations ---
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL === '1';
let databaseReadyPromise;

const ensureDatabaseReady = () => {
    if (!databaseReadyPromise) {
        databaseReadyPromise = sequelize.authenticate()
            .then(() => sequelize.sync({ alter: process.env.DB_SYNC_ALTER !== 'false' }));
    }

    return databaseReadyPromise;
};

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.use('/api', async (req, res, next) => {
    try {
        await ensureDatabaseReady();
        next();
    } catch (e) {
        console.error('Database init error:', e);
        res.status(500).json({ message: 'Database connection error' });
    }
});

// --- Helper: Create Log ---
const createLog = async (userId, userName, action, details) => {
    try {
        await Log.create({ userId, userName, action, details });
    } catch (e) { console.error('Log error:', e); }
};

// --- Middlewares ---
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Нет авторизации' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) { res.status(401).json({ message: 'Невалидный токен' }); }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Нет доступа' });
    next();
};

// --- AUTH API ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, birthDate, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, name, birthDate, role: role || 'user' });
        await createLog(user.id, name, 'РЕГИСТРАЦИЯ', `Создан аккаунт: ${email}`);
        res.status(201).json({ message: 'OK' });
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Ошибка' });
        
        if (user.isBlocked) return res.status(403).json({ message: 'Ваш аккаунт заблокирован' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET);
        await createLog(user.id, user.name, 'ВХОД', 'Пользователь вошел в систему');
        res.json({ token, role: user.role, name: user.name });
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // 1 час
        await user.save();

        const resetUrl = `http://${req.headers.host}/reset-password.html?token=${resetToken}`;
        
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Восстановление пароля — АэроКафе',
            text: `Вы получили это письмо, потому что вы (или кто-то другой) запросили сброс пароля.\n\n` +
                  `Пожалуйста, перейдите по ссылке для завершения процесса:\n\n` +
                  `${resetUrl}\n\n` +
                  `Если вы не запрашивали сброс, просто проигнорируйте это письмо.\n`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Ссылка для сброса пароля отправлена на ваш Email' });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ message: 'Ошибка при отправке письма' }); 
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ 
            where: { 
                resetToken: token,
                resetTokenExpires: { [Op.gt]: Date.now() }
            } 
        });

        if (!user) return res.status(400).json({ message: 'Токен недействителен или истек' });

        user.password = await bcrypt.hash(password, 10);
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.json({ message: 'Пароль успешно изменен' });
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

// --- SETTINGS API (PUBLIC) ---
app.get('/api/settings/public', async (req, res) => {
    try {
        const keys = ['contact_phone', 'admin_email', 'wait_time'];
        const settings = await Setting.findAll({ where: { key: keys } });
        const result = {};
        settings.forEach(s => result[s.key] = s.value);
        res.json(result);
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

// --- MENU API ---
app.get('/api/menu', async (req, res) => {
    try {
        const items = await MenuItem.findAll({ where: { available: true } });
        res.json(items);
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

app.get('/api/admin/menu', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const items = await MenuItem.findAll();
        res.json(items);
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

app.post('/api/admin/menu', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const item = await MenuItem.create(req.body);
        await createLog(req.user.id, req.user.name, 'ДОБАВЛЕНИЕ_МЕНЮ', `Добавлено блюдо: ${item.name}`);
        res.status(201).json(item);
    } catch (e) { res.status(400).json({ message: 'Ошибка' }); }
});

app.patch('/api/admin/menu/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const item = await MenuItem.findByPk(req.params.id);
        if (!item) return res.status(404).send();
        await item.update(req.body);
        await createLog(req.user.id, req.user.name, 'ИЗМЕНЕНИЕ_МЕНЮ', `Обновлено блюдо: ${item.name}`);
        res.json(item);
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

app.delete('/api/admin/menu/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const item = await MenuItem.findByPk(req.params.id);
        if (item) {
            await createLog(req.user.id, req.user.name, 'УДАЛЕНИЕ_МЕНЮ', `Удалено блюдо: ${item.name}`);
            await item.destroy();
        }
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

// --- ORDERS & PROFILE API ---
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    const user = await User.findByPk(req.user.id);
    res.json(user);
});

app.patch('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        
        await user.save();
        await createLog(user.id, user.name, 'ОБНОВЛЕНИЕ_ПРОФИЛЯ', `Изменено имя/телефон`);
        
        res.json({ message: 'Профиль обновлен', name: user.name, phone: user.phone });
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

app.get('/api/user/orders', authMiddleware, async (req, res) => {
    const orders = await Order.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(orders);
});

app.post('/api/orders', authMiddleware, async (req, res) => {
    const { items, totalAmount, paymentMethod } = req.body;
    const itemsWithStatus = items.map(i => ({ ...i, status: 'pending' }));
    const order = await Order.create({ userId: req.user.id, items: itemsWithStatus, totalAmount, paymentMethod });
    await createLog(req.user.id, req.user.name, 'НОВЫЙ_ЗАКАЗ', `Сумма: ${totalAmount} ₽`);
    res.status(201).json(order);
});

// --- NOTIFICATIONS API ---
app.get('/api/user/notifications', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(notifications);
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

app.post('/api/admin/notify/bulk', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { subject, title, message, buttonText, buttonUrl } = req.body;
        const users = await User.findAll({ where: { isBlocked: false } });
        
        const htmlTemplate = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div style="background: #003366; color: #87ceeb; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">АэроКафе</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6; color: #333;">
                    <h2 style="color: #003366;">${title}</h2>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    ${buttonText && buttonUrl ? `
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${buttonUrl}" style="background: #87ceeb; color: #003366; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">${buttonText}</a>
                        </div>
                    ` : ''}
                </div>
                <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    © 2026 АэроКафе. Все права защищены. <br>
                    Вы получили это письмо, так как зарегистрированы на сайте aerocafe.ru
                </div>
            </div>
        `;

        // В реальном проекте здесь лучше использовать очередь (bull, agenda), 
        // но для текущего масштаба отправим циклом или через BCC
        const emails = users.map(u => u.email);
        
        const mailOptions = {
            from: `"АэроКафе" <${process.env.EMAIL_USER}>`,
            bcc: emails, // Используем BCC для массовой рассылки
            subject: subject || 'Новости АэроКафе',
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);
        await createLog(req.user.id, req.user.name, 'МАССОВАЯ_РАССЫЛКА', `Тема: ${subject}, Получателей: ${emails.length}`);
        
        res.json({ message: `Рассылка отправлена ${emails.length} пользователям` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Ошибка при выполнении рассылки' });
    }
});

app.post('/api/admin/notify', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId, message } = req.body;
        const notification = await Notification.create({ userId, message });
        await createLog(req.user.id, req.user.name, 'ОТПРАВКА_УВЕДОМЛЕНИЯ', `Пользователю ${userId}: ${message}`);
        res.status(201).json(notification);
    } catch (e) { res.status(400).json({ message: 'Ошибка' }); }
});

// --- BOOKINGS API ---
app.get('/api/user/bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { userId: req.user.id },
            order: [['date', 'DESC'], ['time', 'DESC']]
        });
        res.json(bookings);
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const data = { ...req.body };
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                data.userId = decoded.id;
                console.log('--- DEBUG: Бронь привязана к UserID:', decoded.id);
            } catch (jwtErr) {
                console.error('--- DEBUG: Ошибка JWT:', jwtErr.message);
                // Если токен битый, лучше вернуть ошибку, чем создавать анонимную бронь
                return res.status(401).json({ message: 'Сессия истекла, войдите заново' });
            }
        } else {
            console.log('--- DEBUG: Анонимная бронь (нет заголовка)');
        }

        const booking = await Booking.create(data);
        res.status(201).json(booking);
    } catch (e) { 
        console.error('--- DEBUG: Ошибка БД:', e);
        res.status(400).json({ message: 'Ошибка при сохранении бронирования' }); 
    }
});

app.patch('/api/user/bookings/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!booking) return res.status(404).send();
        booking.status = 'cancelled';
        await booking.save();
        await createLog(req.user.id, req.user.name, 'ОТМЕНА_БРОНИ', `Кафе: ${booking.cafe}, Дата: ${booking.date}`);
        res.json(booking);
    } catch (e) { res.status(500).json(e); }
});

// --- MESSAGES & JOBS API (PUBLIC) ---
app.post('/api/messages', async (req, res) => {
    try {
        const message = await Message.create(req.body);
        res.status(201).json(message);
    } catch (e) { res.status(400).json({ message: 'Ошибка' }); }
});

app.post('/api/applications', async (req, res) => {
    try {
        const application = await JobApplication.create(req.body);
        res.status(201).json(application);
    } catch (e) { res.status(400).json({ message: 'Ошибка' }); }
});

// --- ADMIN API ---
app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json(orders);
});

app.get('/api/admin/bookings', authMiddleware, adminMiddleware, async (req, res) => {
    const bookings = await Booking.findAll({ order: [['createdAt', 'DESC']] });
    res.json(bookings);
});

app.get('/api/admin/messages', authMiddleware, adminMiddleware, async (req, res) => {
    const messages = await Message.findAll({ order: [['createdAt', 'DESC']] });
    res.json(messages);
});

app.get('/api/admin/applications', authMiddleware, adminMiddleware, async (req, res) => {
    const apps = await JobApplication.findAll({ order: [['createdAt', 'DESC']] });
    res.json(apps);
});

app.get('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const settings = await Setting.findAll();
        res.json(settings);
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

app.post('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { key, value } = req.body;
        await Setting.upsert({ key, value });
        await createLog(req.user.id, req.user.name, 'ИЗМЕНЕНИЕ_НАСТРОЕК', `Ключ: ${key}`);
        res.json({ message: 'Настройка сохранена' });
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: [
                'id', 'email', 'name', 'role', 'phone', 'isBlocked', 'createdAt',
                [sequelize.literal('(SELECT COUNT(*) FROM "Orders" WHERE "Orders"."userId" = "User"."id")'), 'ordersCount'],
                [sequelize.literal('(SELECT SUM("totalAmount") FROM "Orders" WHERE "Orders"."userId" = "User"."id")'), 'totalSpent']
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.patch('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        
        const { role, isBlocked } = req.body;
        if (role) user.role = role;
        if (isBlocked !== undefined) user.isBlocked = isBlocked;
        
        await user.save();
        await createLog(req.user.id, req.user.name, 'ИЗМЕНЕНИЕ_ПОЛЬЗОВАТЕЛЯ', `Пользователь ${user.email}: роль ${user.role}, заблокирован: ${user.isBlocked}`);
        res.json(user);
    } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); }
});

app.get('/api/admin/logs', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const logs = await Log.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
        res.json(logs);
    } catch (e) { res.status(500).json({ message: 'Ошибка' }); }
});

app.patch('/api/admin/applications/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const app = await JobApplication.findByPk(req.params.id);
        if (!app) return res.status(404).send();
        app.status = req.body.status;
        await app.save();
        await createLog(req.user.id, req.user.name, 'СТАТУС_ВАКАНСИИ', `Кандидат ${app.name}: ${app.status}`);
        res.json(app);
    } catch (e) { res.status(500).json(e); }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    const revenue = await Order.sum('totalAmount') || 0;
    const orders = await Order.count();
    const bookings = await Booking.count();
    const users = await User.count();
    res.json({ totalRevenue: revenue, ordersCount: orders, bookingsCount: bookings, usersCount: users });
});

// --- EXPORT API ---
app.get('/api/admin/export/bookings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.findAll({ raw: true });
        const ws = XLSX.utils.json_to_sheet(bookings);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bookings");
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
        res.send(buf);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/admin/export/applications', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const apps = await JobApplication.findAll({ raw: true });
        const ws = XLSX.utils.json_to_sheet(apps);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Applications");
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="applications.xlsx"');
        res.send(buf);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/admin/users/find', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.query.email } });
        if (!user) return res.status(404).json({ message: 'Не найден' });
        res.json({ id: user.id, name: user.name });
    } catch (e) { res.status(500).json(e); }
});

app.patch('/api/admin/orders/:id/item-status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { itemIndex, status } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).send();
        const newItems = [...order.items];
        if (newItems[itemIndex]) {
            newItems[itemIndex].status = status;
            order.items = newItems;
            order.changed('items', true);
            await order.save();
            await createLog(req.user.id, req.user.name, 'СТАТУС_БЛЮДА', `Заказ #${order.id.slice(0,6)}, Блюдо: ${newItems[itemIndex].name} -> ${status}`);
        }
        res.json(order);
    } catch (e) { res.status(500).json(e); }
});

// СИМУЛЯЦИЯ КУХНИ
const startKitchenSimulation = () => setInterval(async () => {
    try {
        const orders = await Order.findAll();
        const next = { 'pending': 'cooking', 'cooking': 'ready', 'ready': 'delivered' };
        for (const order of orders) {
            let changed = false;
            const items = [...order.items];
            items.forEach(i => {
                if (i.status !== 'delivered' && Math.random() > 0.8) {
                    i.status = next[i.status];
                    changed = true;
                }
            });
            if (changed) {
                order.items = items;
                order.changed('items', true);
                await order.save();
            }
        }
    } catch (e) {}
}, 15000);

// --- Flights API Proxy ---
app.get('/api/flights/:event', async (req, res) => {
    try {
        const { event } = req.params; // departure or arrival
        
        // Сначала ищем ключ в БД, если нет - берем из .env
        const dbApiKey = await Setting.findByPk('yandex_api_key');
        const apiKey = dbApiKey ? dbApiKey.value : process.env.YANDEX_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_YANDEX_API_KEY_HERE') {
            // Если ключа нет, возвращаем заглушку, похожую на реальные данные, 
            // но предупреждаем в консоли
            console.warn('YANDEX_API_KEY не настроен в .env');
            return res.json({ 
                error: 'API Key not configured',
                schedule: [] 
            });
        }

        const now = new Date();
        
        const getDateStr = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayStr = getDateStr(now);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getDateStr(tomorrow);

        const fetchSchedule = async (date) => {
            const url = `https://api.rasp.yandex.net/v3.0/schedule/?apikey=${apiKey}&station=REN&transport_types=plane&event=${event}&system=iata&lang=ru_RU&date=${date}`;
            const resp = await fetch(url);
            return await resp.json();
        };

        const [dataToday, dataTomorrow] = await Promise.all([
            fetchSchedule(todayStr),
            fetchSchedule(tomorrowStr)
        ]);

        let lastDateLabel = null;
        const resultSchedule = [];

        // Объединяем расписания
        const rawSchedule = [...(dataToday.schedule || []), ...(dataTomorrow.schedule || [])];
        
        for (const item of rawSchedule) {
            const rawTime = item.departure || item.arrival || item.scheduled || item.actual;
            let timeStr = '— : —';
            let flightDate = null;

            if (rawTime) {
                // В API с параметром date обычно приходят полные даты или время, привязанное к этой дате
                // Но мы всё равно будем осторожны
                flightDate = new Date(rawTime);
                if (isNaN(flightDate.getTime()) && rawTime.includes(':')) {
                    // Если всё же пришло только время HH:mm, нужно понять к какой дате (сегодня или завтра) оно относится
                    // Но обычно при наличии параметра date в запросе, API возвращает корректные данные.
                    // Для надежности, если это данные из dataTomorrow, привязываем к завтра
                    // Однако dataToday.schedule и dataTomorrow.schedule обычно содержат ISO строки.
                }

                if (!isNaN(flightDate.getTime())) {
                    timeStr = flightDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                }
            }

            if (!flightDate || isNaN(flightDate.getTime())) continue;

            const diffMs = flightDate - now;
            const diffMin = Math.floor(diffMs / 60000);

            // Если рейс уже улетел (прошло более 5 минут), скрываем его
            if (diffMin < -5) continue;

            // Логика разделителя дней
            const dateLabel = flightDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            if (lastDateLabel && lastDateLabel !== dateLabel) {
                resultSchedule.push({ isSeparator: true, label: `Рейсы на ${dateLabel}` });
            }
            lastDateLabel = dateLabel;

            let statusText = item.status || 'Ожидается';
            let statusClass = 'ontime';

            if (event === 'departure') {
                if (diffMin <= 0) {
                    statusText = 'Вылетел';
                } else if (diffMin <= 20) {
                    statusText = 'Посадка окончена';
                    statusClass = 'boarding';
                } else if (diffMin <= 40) {
                    statusText = 'Посадка';
                    statusClass = 'boarding';
                } else if (diffMin <= 60) {
                    statusText = 'Ожидается посадка';
                } else if (diffMin <= 180) {
                    const shoppingMin = diffMin - 40;
                    statusText = `Регистрация (Время на покупки ${shoppingMin} мин)`;
                }
            }

            let cityName = item.thread.title;
            if (item.thread.title.includes(' — ')) {
                const parts = item.thread.title.split(' — ');
                // Для вылетов (departure) нам нужен пункт назначения (вторая часть)
                // Для прилетов (arrival) нам нужен пункт отправления (первая часть)
                cityName = (event === 'departure') ? parts[1] : parts[0];
            }

            resultSchedule.push({
                code: item.thread.number,
                city: cityName,
                time: timeStr,
                status: statusText,
                class: statusClass
            });

            if (resultSchedule.filter(s => !s.isSeparator).length >= 9) break;
        }

        res.json({ schedule: resultSchedule });
    } catch (e) {
        console.error('Flights API error:', e);
        res.status(500).json({ message: 'Ошибка при получении данных о рейсах' });
    }
});

const start = async () => {
    try {
        await ensureDatabaseReady();
        startKitchenSimulation();
        app.listen(PORT, '0.0.0.0', () => console.log(`Сервер запущен на порту: ${PORT}`));
    } catch (e) { console.error(e); }
};
if (!isVercel) {
    start();
}

module.exports = app;
