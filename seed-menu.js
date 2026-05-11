const sequelize = require('./server/db');
const MenuItem = require('./server/models/MenuItem');

const foodItems = [
    // ЗАВТРАКИ
    { name: "Глазунья с беконом", price: 670, description: "яйцо глазунья с беконом, помидорами и шпинатом", category: "breakfast", image: "./photo/глазунья с беконом.jpg" },
    { name: "Блинчики с лососем", price: 850, description: "блинчики с лососем, сливочным кремом и зеленью", category: "breakfast", image: "./photo/блинчики с лососем.jpg" },
    // САЛАТЫ
    { name: "Поке боул с креветками", price: 1090, description: "тигровые креветки, японский рис, черри, огурец, кукуруза, брокколи, авокадо, соус унаги и соевый", category: "salad", image: "./photo/поке боул с креветкой.jpg" },
    { name: "Поке боул с лососем", price: 1090, description: "лосось, японский рис, черри, огурец, кукуруза, брокколи, авокадо, соус унаги и соевый", category: "salad", image: "./photo/поке боул с лососем.jpg" },
    { name: "Азиатский", price: 950, description: "говяжья вырезка, болгарский перец, огурец, кунжут, соус унаги, соевый соус, черри", category: "salad", image: "./photo/азиатский.jpg" },
    { name: "Греческий", price: 780, description: "помидор, огурец, айсберг, болгарский перец, маслины, фетакс, фиолетовый лук, заправка", category: "salad", image: "./photo/греческий.jpg" },
    { name: "Цезарь с креветками", price: 1050, description: "тигровые креветки, айсберг, черри, соус цезарь, пармезан, хлебные чипсы", category: "salad", image: "./photo/цезарь с креветками.jpg" },
    { name: "Цезарь с курицей", price: 890, description: "куриное филе, айсберг, черри, соус цезарь, пармезан, хлебные чипсы", category: "salad", image: "./photo/цезарь с курицей.jpg" },
    // СУПЫ
    { name: "Суп-лапша с грибами", price: 490, description: "шампиньоны, лук, домашняя лапша, зелень", category: "soup", image: "./photo/суп лапша с грибами.jpg" },
    { name: "Грибной крем-суп", price: 590, description: "шампиньоны, репчатый лук, сливки, хлебные чипсы", category: "soup", image: "./photo/грибной крем суп.jpg" },
    { name: "Солянка", price: 650, description: "карбонат, сервелат, ветчина, маслины, лимон, маринованный огурец, зелень, сметана", category: "soup", image: "./photo/солянка.jpg" },
    // ХОЛОДНЫЕ ЗАКУСКИ
    { name: "Мясная тарелка", price: 980, description: "карбонат, куриное филе, бекон, оливки, зелень / 200 г", category: "cold", image: "./photo/мясная тарелка.jpg" },
    { name: "Ассорти сыров", price: 1150, description: "камамбер, дор-блю, пармезан, мёд / 200 г", category: "cold", image: "./photo/сырная тарелка.jpg" },
    { name: "Лосось на губернском тосте", price: 890, description: "слабосолёный лосось, сливочный крем, лимон, зелень / 200 г", category: "cold", image: "./photo/лосось на губернском тосте.jpg" },
    // ГОРЯЧИЕ ЗАКУСКИ
    { name: "Картофельные дольки", price: 390, description: "картофель дольками / 150 г", category: "hot_snack", image: "./photo/картофельные дольки.jpg" },
    { name: "Картофель фри", price: 350, description: "картофель фри / 150 г", category: "hot_snack", image: "./photo/картофель фри.jpg" },
    { name: "Наггетсы", price: 590, description: "куриное филе в кляре, сухари панко / 160 г", category: "hot_snack", image: "./photo/наггетсы.jpg" },
    { name: "Куриные крылышки", price: 680, description: "крылья в соусе унаги, кунжут, специи / 270 г", category: "hot_snack", image: "./photo/куриные крылышки.jpg" },
    { name: "Креветки-темпура", price: 980, description: "тигровые креветки в кляре с панировкой панко / 120 г", category: "hot_snack", image: "./photo/креветки темпура.jpg" },
    // ПАСТА
    { name: "Фетучини с овощами", price: 870, description: "фетучини, болгарский перец, черри, кабачок, томатный соус, пармезан / 220 г", category: "pasta", image: "./photo/фетучини с овощами.jpg" },
    { name: "Фетучини с креветками", price: 1060, description: "фетучини, тигровые креветки, сливки, пармезан / 220 г", category: "pasta", image: "./photo/фетучини с креветками.jpg" },
    { name: "Фетучини в сливочном соусе", price: 770, description: "фетучини, сливочное масло, пармезан / 220 г", category: "pasta", image: "./photo/фетучини в сливочном соусе.jpg" },
    { name: "Карбонара", price: 980, description: "спагетти, бекон, сливки, пармезан / 220 г", category: "pasta", image: "./photo/карбонара.jpg" },
    // ПИЦЦА
    { name: "Пепперони", price: 1250, description: "тонкое тесто, рубленые томаты, моцарелла, пепперони, орегано / 500 г", category: "pizza", image: "./photo/пепперони.jpg" },
    { name: "Моцарелла фреш", price: 1250, description: "тонкое тесто, рубленые томаты, моцарелла, базилик, орегано, оливковое масло, чесночное масло / 450 г", category: "pizza", image: "./photo/моцарелла фреш.jpg" },
    { name: "Сырная", price: 1280, description: "тонкое тесто, соус бешамель, моцарелла, чеддер, дор-блю, пармезан, сливочный сыр, орегано / 500 г", category: "pizza", image: "./photo/сырная.jpg" },
    { name: "Четыре сезона", price: 1250, description: "тонкое тесто, ветчина, грибы, чёрные оливки, моцарелла, рубленые томаты, орегано, оливковое масло / 500 г", category: "pizza", image: "./photo/4 сезона.jpg" },
    // БУРГЕРЫ / ОСНОВНЫЕ
    { name: "Фишбургер", price: 890, description: "пшеничная булочка, котлета из трески в хрустящей панировке, маринованный огурец, сыр чеддер, соус тар-тар, соус спайси, салат айсберг / 300 г", category: "burger", image: "./photo/фишбургер.jpg" },
    { name: "Клаб сендвич", price: 950, description: "хрустящий тостовый хлеб, куриная грудка гриль, поджаренный бекон, айсберг, свежие томаты, маринованный огурец, сыр чеддер, соус Цезарь, сладкая горчица / 330 г", category: "burger", image: "./photo/клаб сендвич.jpg" },
    { name: "Стейк филе-миньон с овощами гриль", price: 1750, description: "говяжья вырезка, бекон, болгарский перец, кабачок, шампиньоны / 350 г", category: "main", image: "./photo/стейк миньон.jpg" },
    { name: "Лосось с соусом из печёных овощей", price: 1650, description: "лосось, стручковая фасоль, лук, соус, шпинат / 250 г", category: "main", image: "./photo/стейк лосось.jpg" }
];

const drinkItems = [
    // КОФЕ
    { name: "Эспрессо", price: 280, description: "40 мл", category: "coffee" },
    { name: "Американо 120 мл", price: 350, description: "120 мл", category: "coffee" },
    { name: "Американо 300 мл", price: 450, description: "300 мл", category: "coffee" },
    { name: "Капучино 190 мл", price: 390, description: "190 мл", category: "coffee" },
    { name: "Капучино 390 мл", price: 490, description: "390 мл", category: "coffee" },
    { name: "Латте 200 мл", price: 390, description: "200 мл", category: "coffee" },
    { name: "Латте 390 мл", price: 490, description: "390 мл", category: "coffee" },
    { name: "Флет Уайт", price: 490, description: "300 мл", category: "coffee" },
    { name: "Айс-латте", price: 550, description: "390 мл", category: "coffee" },
    { name: "Арахисовый латте", price: 580, description: "390 мл", category: "coffee" },
    { name: "Раф", price: 630, description: "390 мл", category: "coffee" },
    { name: "Горячий шоколад", price: 590, description: "390 мл", category: "coffee" },

    // ЧАЙ
    { name: "Ассам 400 мл", price: 450, description: "Чёрный чай, 400 мл", category: "tea" },
    { name: "Ассам 800 мл", price: 650, description: "Чёрный чай, 800 мл", category: "tea" },
    { name: "Эрл-грей 400 мл", price: 450, description: "Чёрный чай с бергамотом, 400 мл", category: "tea" },
    { name: "Эрл-грей 800 мл", price: 650, description: "Чёрный чай с бергамотом, 800 мл", category: "tea" },
    { name: "Тигуань-инь 400 мл", price: 450, description: "Зелёный чай улун, 400 мл", category: "tea" },
    { name: "Тигуань-инь 800 мл", price: 650, description: "Зелёный чай улун, 800 мл", category: "tea" },
    { name: "Молочный улун 400 мл", price: 450, description: "400 мл", category: "tea" },
    { name: "Молочный улун 800 мл", price: 650, description: "800 мл", category: "tea" },
    { name: "Мао-фенг 400 мл", price: 450, description: "Китайский зелёный чай, 400 мл", category: "tea" },
    { name: "Мао-фенг 800 мл", price: 650, description: "Китайский зелёный чай, 800 мл", category: "tea" },
    { name: "Мятный Марракеш 400 мл", price: 450, description: "Мятный чай, 400 мл", category: "tea" },
    { name: "Мятный Марракеш 800 мл", price: 650, description: "Мятный чай, 800 мл", category: "tea" },
    { name: "Альпийские травы 400 мл", price: 450, description: "Травяной сбор, 400 мл", category: "tea" },
    { name: "Альпийские травы 800 мл", price: 650, description: "Травяной сбор, 800 мл", category: "tea" },
    { name: "Смородина-мята", price: 870, description: "Авторский ягодно-мятный чай, 800 мл", category: "tea" },
    { name: "Облепиха-мандарин", price: 870, description: "Авторский чай, 800 мл", category: "tea" },
    { name: "Клубника-альпийские травы", price: 870, description: "Авторский клубничный травяной чай, 800 мл", category: "tea" },

    // БЕЗАЛКОГОЛЬНЫЕ
    { name: "Апельсиновый фреш", price: 590, description: "Свежевыжатый сок", category: "soft_drink" },
    { name: "Бон-Аква (500 мл)", price: 230, description: "Газ/негаз", category: "soft_drink" },
    { name: "Байкал стекл. (250 мл)", price: 450, description: "Газ/негаз", category: "soft_drink" },
    { name: "Боржоми (500 мл)", price: 550, category: "soft_drink" },
    { name: "Кола Добрый (500 мл)", price: 350, category: "soft_drink" },
    { name: "Швепс (330 мл)", price: 350, description: "Тоник / биттер лимон", category: "soft_drink" },
    { name: "Бёрн 250 мл", price: 390, category: "soft_drink" },
    { name: "Бёрн 500 мл", price: 490, category: "soft_drink" },
    { name: "Доктор Пеппер Импорт (330 мл)", price: 550, category: "soft_drink" },
    { name: "Кока-Кола Импорт (330 мл)", price: 550, category: "soft_drink" },
    { name: "Сок Рич (200 мл)", price: 370, description: "В ассортименте", category: "soft_drink" },
    { name: "Холодный чай Рич (500 мл)", price: 350, description: "В ассортименте", category: "soft_drink" },

    // ПИВО
    { name: "Жигулевское (500 мл)", price: 450, description: "Россия, светл. фильтр.", category: "beer" },
    { name: "Грин Бит (500 мл)", price: 450, category: "beer" },
    { name: "Рудигер (500 мл)", price: 450, category: "beer" },
    { name: "Крон Бланш (500 мл)", price: 550, category: "beer" },
    { name: "Будайзер (500 мл, ж.б.)", price: 890, description: "Импорт, Германия", category: "beer" },
    { name: "Миллер (500 мл, ж.б.)", price: 890, description: "Германия", category: "beer" },
    { name: "Старопармен (500 мл, стекл.)", price: 890, description: "Германия", category: "beer" },
    { name: "Хайников Оригинал (500 мл)", price: 890, description: "Германия", category: "beer" },
    { name: "Корона Экстра (355 мл)", price: 750, description: "Мексика", category: "beer" },
    { name: "Пейл Эль (500 мл)", price: 550, description: "Загорская солодовня, нефильтр.", category: "beer" },
    { name: "Вайцен (500 мл)", price: 480, category: "beer" },
    { name: "Кёльш (500 мл)", price: 480, category: "beer" },
    { name: "Кристальное (500 мл)", price: 480, category: "beer" },
    { name: "Амбер Эль (500 мл)", price: 550, category: "beer" },
    { name: "Стаут (500 мл)", price: 550, category: "beer" },
    { name: "Жигулевское Самарское (500 мл)", price: 490, description: "Разливное", category: "beer" },

    // ЛИМОНАДЫ
    { name: "Клюква-черная смородина 500 мл", price: 500, category: "lemonade" },
    { name: "Клюква-черная смородина 1200 мл", price: 900, category: "lemonade" },
    { name: "Вишневый лимонад 500 мл", price: 500, category: "lemonade" },
    { name: "Вишневый лимонад 1200 мл", price: 900, category: "lemonade" },
    { name: "Грейпфрутовый лимонад 500 мл", price: 500, category: "lemonade" },
    { name: "Грейпфрутовый лимонад 1200 мл", price: 900, category: "lemonade" },
    { name: "Лимонады Загорская (500 мл)", price: 380, description: "В ассортименте", category: "lemonade" },

    // КОКТЕЙЛИ
    { name: "S-royal (300 мл)", price: 1390, description: "Ликёр, игристое, вермут, содовая, персик", category: "cocktail" },
    { name: "Мохито", price: 1250, description: "Ром, содовая, мята, лайм, сироп", category: "cocktail" },
    { name: "Спритц", price: 1300, description: "Аперитив, сироп, игристое, содовая, апельсин", category: "cocktail" },

    // КРЕПКИЙ АЛКОГОЛЬ
    { name: "Водка Organik (50 мл)", price: 400, category: "alcohol" },
    { name: "Водка Chaykovskiy (50 мл)", price: 400, category: "alcohol" },
    { name: "Водка Beluga (50 мл)", price: 400, category: "alcohol" },
    { name: "Водка Absolute (50 мл)", price: 400, category: "alcohol" },
    { name: "Ackanelis 5 лет (50 мл)", price: 590, category: "alcohol" },
    { name: "Aparat 5* (50 мл)", price: 590, category: "alcohol" },
    { name: "Boduen VSOP (50 мл)", price: 590, category: "alcohol" },
    { name: "Boduen XO (50 мл)", price: 590, category: "alcohol" },
    { name: "Merlet VS (50 мл)", price: 590, category: "alcohol" },
    { name: "Martell VSOP (50 мл)", price: 590, category: "alcohol" },
    { name: "Courvoisier VSOP (50 мл)", price: 590, category: "alcohol" },
    { name: "Havana Club 3 years (50 мл)", price: 790, category: "alcohol" },
    { name: "Oimeca Silver (50 мл)", price: 850, category: "alcohol" },
    { name: "Gold 1598 (50 мл)", price: 850, category: "alcohol" },
    { name: "Montevi Dessert Dolce (750 мл)", price: 4500, category: "alcohol" },
    { name: "Montevi Cuvee Brut (750 мл)", price: 4500, category: "alcohol" },
    { name: "Rising River Route (750 мл)", price: 5500, category: "alcohol" },
    { name: "Pinot Grigio (750 мл)", price: 5500, category: "alcohol" },
    { name: "Киндзмараули Асканели (750 мл)", price: 5500, category: "alcohol" },
    { name: "Montepulciano d’Abruzzo (750 мл)", price: 5500, category: "alcohol" },
    { name: "Chianti Cacciata (750 мл)", price: 5500, category: "alcohol" },
    { name: "Водка Минибар (250 мл)", price: 950, category: "alcohol" },
    { name: "Виски Fowler’s (200 мл)", price: 1450, category: "alcohol" },
    { name: "Beefeater London Dry (50 мл)", price: 1190, category: "alcohol" },
    { name: "Citadelle (50 мл)", price: 1190, category: "alcohol" },
    { name: "Jagermeister (50 мл)", price: 690, category: "alcohol" },
    { name: "Sauvignon Blanc Tagua (187 мл)", price: 2390, category: "alcohol" },
    { name: "Cabernet Sauvignon Tagua (187 мл)", price: 2390, category: "alcohol" }
];

async function seed() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        
        await MenuItem.destroy({ where: {} });
        
        const allItems = [...foodItems, ...drinkItems];
        
        for (const item of allItems) {
            await MenuItem.create(item);
        }
        
        console.log(`--- МЕНЮ ОБНОВЛЕНО: ${allItems.length} позиций ---`);
        process.exit(0);
    } catch (e) {
        console.error('Ошибка заполнения:', e);
        process.exit(1);
    }
}

seed();
