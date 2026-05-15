import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GLOBAL_SEARCH_MIN_LEN,
  buildGlobalSearchGroups,
} from "@/modules/global-search/lib";
import { useMenuData } from "@/shared/context/menu-data-context";
import { capitalizeProductName } from "@/shared/lib/text";
import styles from "./global-search.module.css";

type GlobalSearchProps = {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function GlobalSearch({
  placeholder = "Поиск",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Глобальный поиск",
}: GlobalSearchProps) {
  const navigate = useNavigate();
  const listboxId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const {
    search,
    setSearch,
    catalogProducts,
    menuProducts,
    cards,
    menuDishes,
    suppliers,
    hasMenu,
  } = useMenuData();

  const groups = useMemo(
    () =>
      buildGlobalSearchGroups({
        query: search,
        catalogProducts,
        menuProducts,
        cards,
        menuDishes,
        suppliers,
        hasMenu,
      }),
    [
      search,
      catalogProducts,
      menuProducts,
      cards,
      menuDishes,
      suppliers,
      hasMenu,
    ],
  );

  const flat = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  const showDropdown = open && !disabled;
  const qLen = search.trim().length;

  useEffect(() => {
    setActiveIndex(-1);
  }, [search, groups]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goTo = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || flat.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flat.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goTo(flat[activeIndex].to);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let flatOffset = 0;

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ""}`}>
      <div
        className={`${styles.search} ${showDropdown && (groups.length > 0 || qLen >= GLOBAL_SEARCH_MIN_LEN) ? styles.searchOpen : ""}`}
      >
        <img
          className={styles.searchIcon}
          src="/icons/search-icon.svg"
          alt=""
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {search.length > 0 && !disabled ? (
          <button
            type="button"
            className={styles.clearBtn}
            aria-label="Очистить поиск"
            onClick={() => {
              setSearch("");
              setOpen(false);
            }}
          >
            <img src="/icons/close-icon.svg" alt="" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          className={styles.dropdown}
          aria-label="Результаты поиска"
        >
          {qLen < GLOBAL_SEARCH_MIN_LEN ? (
            <p className={styles.hint}>
              Введите минимум {GLOBAL_SEARCH_MIN_LEN} символа
            </p>
          ) : groups.length === 0 ? (
            <p className={styles.empty}>Ничего не найдено</p>
          ) : (
            groups.map((group) => (
              <div key={group.id} className={styles.group} role="presentation">
                <p className={styles.groupLabel}>{group.label}</p>
                {group.items.map((item) => {
                  const idx = flatOffset;
                  flatOffset += 1;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={styles.resultBtn}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => goTo(item.to)}
                    >
                      <span className={styles.resultTitle}>
                        {capitalizeProductName(item.title)}
                      </span>
                      <span className={styles.resultSub}>{item.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
