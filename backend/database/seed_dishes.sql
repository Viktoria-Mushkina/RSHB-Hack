
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

UNION ALL SELECT d.id, p.id FROM dishes d JOIN products p ON p.name = 'лук' WHERE d.name = 'Говядина с овощами'

ON CONFLICT (dish_id, product_id) DO NOTHING;


