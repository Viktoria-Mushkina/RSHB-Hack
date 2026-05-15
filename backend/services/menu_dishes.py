from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

from services.text_processor import text_processor

_SECTION_TITLE_PATTERNS: Tuple[str, ...] = (
    r"^горячие\s+блюд",
    r"^холодные\s+блюд",
    r"^горячие\s+закуск",
    r"^холодные\s+закуск",
    r"^салат[ыа]?\s*$",
    r"^суп[ыа]?\s*$",
    r"^закуск",
    r"^десерт",
    r"^гарнир",
    r"^напит",
    r"^выпечк",
    r"^завтрак",
    r"^меню\s*$",
    r"блюд[ао]\s*$",
)

_SECTION_WORDS = frozenset(
    {
        "салаты",
        "салат",
        "супы",
        "суп",
        "закуски",
        "закуска",
        "десерты",
        "десерт",
        "гарниры",
        "гарнир",
        "напитки",
        "напиток",
        "блюда",
        "блюдо",
        "горячие",
        "холодные",
        "выпечка",
        "меню",
        "завтраки",
        "закуски",
    }
)

def _strip_title_decor(title: str) -> str:
    return re.sub(r"^[\s\-–—.:]+|[\s\-–—.:]+$", "", title.strip())

def is_menu_section_header(title: str) -> bool:
    raw = title.strip()
    if not raw or len(raw) < 2:
        return True

    inner = _strip_title_decor(raw)
    if not inner:
        return True

    low = inner.lower()
    dash_wrapped = bool(re.match(r"^[\s\-–—].+[\s\-–—]\s*$", raw))

    if dash_wrapped and len(inner) <= 50:
        for pat in _SECTION_TITLE_PATTERNS:
            if re.search(pat, low):
                return True

    for pat in _SECTION_TITLE_PATTERNS:
        if re.search(pat, low) and len(inner) <= 45:
            return True

    if len(inner) <= 45 and inner.isupper() and not re.search(r"\d", inner):
        words = [w for w in re.split(r"\s+", inner) if w]
        if not words or len(words) > 5:
            return False
        if re.search(r"[(),/]", inner):
            return False
        lowered = [w.lower() for w in words]
        if all(w in _SECTION_WORDS for w in lowered):
            return True
        if len(words) == 1 and lowered[0] in _SECTION_WORDS:
            return True
        if dash_wrapped and len(words) <= 2 and any(w in _SECTION_WORDS for w in lowered):
            return True

    return False

def extract_dish_blocks(raw_text: str) -> List[Tuple[str, str, str]]:
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    parts = re.split(r"\n\s*\n+", text)
    blocks: List[Tuple[str, str, str]] = []

    for part in parts:
        lines = [ln.strip() for ln in part.split("\n") if ln.strip()]
        if len(lines) < 1:
            continue
        title = lines[0][:120]
        if is_menu_section_header(title):
            continue
        raw_joined = " ".join(lines)
        body_lower = raw_joined.lower()
        body_norm = (
            text_processor.normalize_text(raw_joined)
            if text_processor.is_available
            else body_lower
        )
        if len(body_lower) < 12:
            continue
        blocks.append((title, body_lower, body_norm))

    return blocks

def enrich_product_for_matching(p: Dict[str, Any]) -> Dict[str, Any]:
    d = dict(p)
    name = p["name"].lower()
    d["_norm_form"] = text_processor.normalize_word(name) if text_processor.is_available else name
    return d
