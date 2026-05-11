const sequelize = require('./server/db');
const User = require('./server/models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        await sequelize.authenticate();
        
        const email = 'admin@aerocafe.ru';
        const password = 'admin';
        const name = 'Администратор';
        
        const candidate = await User.findOne({ where: { email } });
        if (candidate) {
            console.log('Администратор с таким email уже существует.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'admin',
            birthDate: '1990-01-01'
        });

        console.log('--- УСПЕХ ---');
        console.log(`Администратор пересоздан!`);
        console.log(`Логин: ${email}`);
        console.log(`Пароль: ${password}`);
        console.log('-------------');
        process.exit(0);
    } catch (e) {
        console.error('Ошибка при создании администратора:', e);
        process.exit(1);
    }
}

createAdmin();
