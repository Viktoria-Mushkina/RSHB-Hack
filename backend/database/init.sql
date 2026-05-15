\c rshb_db

DROP TABLE IF EXISTS dish_ingredients CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS menu_products CASCADE;
DROP TABLE IF EXISTS menu_uploads CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    cuisine_types TEXT[] DEFAULT '{}',
    seasons TEXT[] DEFAULT '{}',
    image_url VARCHAR(500)
);

CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) DEFAULT 'блюдо',
    description TEXT,
    image_url VARCHAR(500)
);

CREATE TABLE dish_ingredients (
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (dish_id, product_id)
);

CREATE INDEX idx_dish_ingredients_product ON dish_ingredients(product_id);
CREATE INDEX idx_dishes_category ON dishes(category);

CREATE TABLE menu_uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farmers (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    region VARCHAR(255) NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    product_url VARCHAR(500),
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE menu_products (
    id SERIAL PRIMARY KEY,
    menu_upload_id INTEGER REFERENCES menu_uploads(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255),
    match_type VARCHAR(50) DEFAULT 'auto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_farmers_product_name ON farmers(product_name);
CREATE INDEX idx_farmers_category ON farmers(category);
CREATE INDEX idx_farmers_organization ON farmers(organization_id);

INSERT INTO products (name, category, cuisine_types, seasons, image_url) VALUES
('картофель', 'овощи', '{"русская","европейская"}', '{"осень","зима","весна"}', '/ingredients/potato.png'),
('помидор', 'овощи', '{"итальянская","средиземноморская"}', '{"лето","осень"}', '/ingredients/tomato.png'),
('морковь', 'овощи', '{"русская","европейская"}', '{"осень","зима","весна"}', '/ingredients/carrot.png'),
('лук', 'овощи', '{"русская","европейская"}', '{"круглый год"}', '/ingredients/onion.png'),
('капуста', 'овощи', '{"русская","европейская"}', '{"осень","зима"}', '/ingredients/cabbage.png'),
('свекла', 'овощи', '{"русская"}', '{"осень","зима"}', '/ingredients/beet.png'),
('чеснок', 'овощи', '{"русская","европейская"}', '{"круглый год"}', '/ingredients/garlic.png'),
('редис', 'овощи', '{"русская","европейская"}', '{"лето"}', '/ingredients/radish.png'),
('горошек зеленый', 'овощи', '{"русская","европейская"}', '{"круглый год"}', '/ingredients/green_pea.png'),
('перепелиное яйцо', 'яйца', '{"русская","французская"}', '{"круглый год"}', '/ingredients/quail_egg.png'),
('шампиньоны', 'грибы', '{"европейская","русская"}', '{"круглый год"}', '/ingredients/champignon.png'),
('лисички', 'грибы', '{"русская"}', '{"лето","осень"}', '/ingredients/chanterelle.png'),
('белые грибы', 'грибы', '{"русская"}', '{"осень"}', '/ingredients/porcini.png'),
('говядина', 'мясо', '{"европейская","американская"}', '{"круглый год"}', '/ingredients/beef.png'),
('курица', 'мясо', '{"русская","европейская"}', '{"круглый год"}', '/ingredients/chicken.png'),
('клубника', 'ягоды', '{"европейская"}', '{"лето"}', '/ingredients/strawberry.png'),
('вишня', 'ягоды', '{"русская"}', '{"лето"}', '/ingredients/cherry.png'),
('малина', 'ягоды', '{"русская"}', '{"лето"}', '/ingredients/raspberry.png'),
('семга', 'рыба', '{"японская","европейская"}', '{"осень","зима"}', '/ingredients/salmon.png'),
('треска', 'рыба', '{"европейская"}', '{"круглый год"}', '/ingredients/cod.png')
ON CONFLICT (name) DO NOTHING;

INSERT INTO dishes (name, category, description) VALUES
('Дачный салат', 'салаты', 'картофель, редис, перепелиные яйца, зелёный горошек'),
('Грибы А-ля пулеть', 'закуски', 'шампиньоны, лисички, белые грибы'),
('Блинчики с ягодами', 'десерты', 'клубника, вишня, малина'),
('Рыбная тарелка', 'основное', 'семга, треска'),
('Овощное рагу', 'основное', 'картофель, морковь, помидор, лук, чеснок'),
('Запечённые овощи', 'гарниры', 'картофель, морковь, помидор, чеснок'),
('Говядина с овощами', 'основное', 'говядина, картофель, морковь, лук')
ON CONFLICT (name) DO NOTHING;

INSERT INTO dish_ingredients (dish_id, product_id)
SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'картофель' WHERE d.name = 'Дачный салат'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'редис' WHERE d.name = 'Дачный салат'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'перепелиное яйцо' WHERE d.name = 'Дачный салат'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'горошек зеленый' WHERE d.name = 'Дачный салат'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'шампиньоны' WHERE d.name = 'Грибы А-ля пулеть'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'лисички' WHERE d.name = 'Грибы А-ля пулеть'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'белые грибы' WHERE d.name = 'Грибы А-ля пулеть'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'клубника' WHERE d.name = 'Блинчики с ягодами'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'вишня' WHERE d.name = 'Блинчики с ягодами'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'малина' WHERE d.name = 'Блинчики с ягодами'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'семга' WHERE d.name = 'Рыбная тарелка'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'треска' WHERE d.name = 'Рыбная тарелка'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'картофель' WHERE d.name = 'Овощное рагу'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'морковь' WHERE d.name = 'Овощное рагу'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'помидор' WHERE d.name = 'Овощное рагу'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'лук' WHERE d.name = 'Овощное рагу'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'чеснок' WHERE d.name = 'Овощное рагу'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'картофель' WHERE d.name = 'Запечённые овощи'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'морковь' WHERE d.name = 'Запечённые овощи'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'помидор' WHERE d.name = 'Запечённые овощи'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'чеснок' WHERE d.name = 'Запечённые овощи'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'говядина' WHERE d.name = 'Говядина с овощами'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'картофель' WHERE d.name = 'Говядина с овощами'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'морковь' WHERE d.name = 'Говядина с овощами'
UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'лук' WHERE d.name = 'Говядина с овощами';

