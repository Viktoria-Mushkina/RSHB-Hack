from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

SEASON_MONTHS: Dict[str, set[int]] = {
    "весна": {3, 4, 5},
    "лето": {6, 7, 8},
    "осень": {9, 10, 11},
    "зима": {12, 1, 2},
}

RU_MONTHS = (
    "",
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
)

SOON_DAYS = 45

def _seasons_lower(product: Dict[str, Any]) -> List[str]:
    return [str(s).lower().strip() for s in product.get("seasons") or []]

def in_season_on_date(product: Dict[str, Any], d: date) -> bool:
    sl = _seasons_lower(product)
    if "круглый год" in sl:
        return True
    m = d.month
    for key, months in SEASON_MONTHS.items():
        if key in sl and m in months:
            return True
    return False

def days_until_next_enter(product: Dict[str, Any], today: date) -> Optional[int]:
    if in_season_on_date(product, today):
        return None
    for i in range(1, 370):
        if in_season_on_date(product, today + timedelta(days=i)):
            return i
    return None

def days_until_next_exit(product: Dict[str, Any], today: date) -> Optional[int]:
    if not in_season_on_date(product, today):
        return None
    for i in range(1, 370):
        if not in_season_on_date(product, today + timedelta(days=i)):
            return i
    return None

def first_in_season_date(product: Dict[str, Any], today: date) -> Optional[date]:
    di = days_until_next_enter(product, today)
    if di is None:
        return None
    return today + timedelta(days=di)

def last_in_season_date(product: Dict[str, Any], today: date) -> Optional[date]:
    de = days_until_next_exit(product, today)
    if de is None:
        return None
    return today + timedelta(days=de - 1)

def format_ru_date(d: date) -> str:
    return f"{d.day} {RU_MONTHS[d.month]}"

@dataclass
class IngredientSeasonInfo:
    label: str
    hint: str
    days_enter: Optional[int]
    days_exit: Optional[int]

def classify_ingredient(product: Dict[str, Any], today: date) -> IngredientSeasonInfo:
    inside = in_season_on_date(product, today)
    d_enter = days_until_next_enter(product, today)
    d_exit = days_until_next_exit(product, today)

    soon_in = d_enter is not None and d_enter <= SOON_DAYS and d_enter > 0
    soon_out = d_exit is not None and d_exit <= SOON_DAYS and d_exit > 0

    if inside:
        if soon_out:
            ld = last_in_season_date(product, today)
            hint = (
                f"Сезон заканчивается через {d_exit} дн."
                if ld is None
                else f"до {format_ru_date(ld)}"
            )
            return IngredientSeasonInfo("Скоро сезон", hint, None, d_exit)
        return IngredientSeasonInfo("Сезон", "В сезоне сейчас", None, None)

    if soon_in:
        fd = first_in_season_date(product, today)
        hint = (
            f"Сезон начинается через {d_enter} дн."
            if fd is None
            else f"с {format_ru_date(fd)}"
        )
        return IngredientSeasonInfo("Скоро сезон", hint, d_enter, None)

    return IngredientSeasonInfo("Не сезон", "Вне основного сезона", d_enter, d_exit)

def seasonality_percent(products: List[Dict[str, Any]], today: date) -> int:
    if not products:
        return 0
    ok = 0
    for p in products:
        if in_season_on_date(p, today):
            ok += 1
    return int(round(100.0 * ok / len(products)))

def map_products_to_dishes(
    dish_blocks: List[Tuple[str, str, str]], products: List[Dict[str, Any]]
) -> Dict[int, List[str]]:
    from services.menu_dishes import is_menu_section_header

    out: Dict[int, List[str]] = {p["id"]: [] for p in products}
    for p in products:
        pid = p["id"]
        name = p["name"].lower()
        nf = p.get("_norm_form")
        if not nf:
            nf = name
        for title, body, body_norm in dish_blocks:
            t = title.strip()
            if not t or is_menu_section_header(t):
                continue
            if name in body or (nf and nf in body_norm):
                if t not in out[pid]:
                    out[pid].append(t)
    return out

def build_dish_ingredient_map(
    dish_blocks: List[Tuple[str, str, str]], products: List[Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    from services.menu_dishes import is_menu_section_header

    dm: Dict[str, List[Dict[str, Any]]] = {}
    for title, body, body_norm in dish_blocks:
        t = title.strip()
        if not t or is_menu_section_header(t):
            continue
        found: List[Dict[str, Any]] = []
        for p in products:
            name = p["name"].lower()
            nf = p.get("_norm_form") or name
            if name in body or (nf and nf in body_norm):
                found.append(p)
        if found:
            dm[t] = found
    return dm

@dataclass
class DishChange:
    dish_name: str
    days: int
    subtitle: str
    ingredients: List[str]

def pick_seasonal_dish_changes(
    dish_map: Dict[str, List[Dict[str, Any]]],
    today: date,
    entering: bool,
    limit: int = 3,
) -> List[DishChange]:
    scored: List[Tuple[int, str, str, List[str]]] = []

    for dish_name, plist in dish_map.items():
        best_days: Optional[int] = None
        picked_sub = ""
        names: List[str] = []

        for p in plist:
            info = classify_ingredient(p, today)
            if entering:
                if info.days_enter is None:
                    continue
                d = info.days_enter
                fd = first_in_season_date(p, today)
                sub = f"с {format_ru_date(fd)}" if fd else f"через {d} дн."
            else:
                if info.days_exit is None:
                    continue
                d = info.days_exit
                ld = last_in_season_date(p, today)
                sub = f"до {format_ru_date(ld)}" if ld else f"через {d} дн."

            names.append(p["name"])
            if best_days is None or d < best_days:
                best_days = d
                picked_sub = sub

        if best_days is not None:
            scored.append((best_days, dish_name, picked_sub, names[:5]))

    scored.sort(key=lambda x: x[0])
    result: List[DishChange] = []
    for d, dish_name, sub, ing in scored[:limit]:
        result.append(DishChange(dish_name, d, sub, ing))
    return result

def fallback_ingredient_changes(
    products: List[Dict[str, Any]],
    today: date,
    entering: bool,
    limit: int = 3,
) -> List[DishChange]:
    rows: List[Tuple[int, str, str, List[str]]] = []
    for p in products:
        info = classify_ingredient(p, today)
        if entering:
            if info.days_enter is None:
                continue
            d = info.days_enter
            fd = first_in_season_date(p, today)
            sub = f"с {format_ru_date(fd)}" if fd else f"через {d} дн."
        else:
            if info.days_exit is None:
                continue
            d = info.days_exit
            ld = last_in_season_date(p, today)
            sub = f"до {format_ru_date(ld)}" if ld else f"через {d} дн."
        raw = (p.get("name") or "").strip()
        title = raw[:1].upper() + raw[1:] if raw else raw
        rows.append((d, title, sub, [p["name"]]))
    rows.sort(key=lambda x: x[0])
    out: List[DishChange] = []
    for d, title, sub, ing in rows[:limit]:
        out.append(DishChange(title, d, sub, ing))
    return out

def global_dictionary_changes(
    products: List[Dict[str, Any]],
    today: date,
    entering: bool,
    limit: int = 3,
) -> List[DishChange]:
    rows: List[Tuple[int, str, str, List[str]]] = []
    for p in products:
        info = classify_ingredient(p, today)
        raw = (p.get("name") or "").strip()
        title = raw[:1].upper() + raw[1:] if raw else raw
        if entering:
            if info.days_enter is None:
                continue
            d = info.days_enter
            fd = first_in_season_date(p, today)
            sub = f"с {format_ru_date(fd)}" if fd else f"через {d} дн."
        else:
            if info.days_exit is None:
                continue
            d = info.days_exit
            ld = last_in_season_date(p, today)
            sub = f"до {format_ru_date(ld)}" if ld else f"через {d} дн."
        rows.append((d, title, sub, [raw]))
    rows.sort(key=lambda x: x[0])
    return [DishChange(t, d, s, ing) for d, t, s, ing in rows[:limit]]

def supplier_badge_for_row(frow: dict, pmap: dict, today: date) -> str:
    pid = frow.get("product_id")
    if not pid or pid not in pmap:
        return ""
    p = pmap[pid]
    if in_season_on_date(p, today):
        de = days_until_next_exit(p, today)
        if de is not None and de <= 45:
            ld = last_in_season_date(p, today)
            return f"До {format_ru_date(ld)}" if ld else "Скоро конец"
        return "В сезоне"
    di = days_until_next_enter(p, today)
    if di is not None and di <= 45:
        fd = first_in_season_date(p, today)
        return f"С {format_ru_date(fd)}" if fd else f"Через {di} дн."
    return ""
