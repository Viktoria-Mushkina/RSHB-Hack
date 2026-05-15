CREATE TABLE IF NOT EXISTS dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) DEFAULT 'блюдо',
    description TEXT,
    image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS dish_ingredients (
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (dish_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_dish_ingredients_product ON dish_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);

