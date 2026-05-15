import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./menu-dish-actions-menu.module.css";

export type MenuDishActionsMenuProps = {
  isInMenu: boolean;
  onEdit: () => void;
  onRemoveFromMenu: () => void;
  onAddToMenu: () => void;
  
  ariaLabel?: string;
};

export function MenuDishActionsMenu({
  isInMenu,
  onEdit,
  onRemoveFromMenu,
  onAddToMenu,
  ariaLabel = "Действия с блюдом",
}: MenuDishActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
    onEdit();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
    onRemoveFromMenu();
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
    onAddToMenu();
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.menuBtn}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
      >
        <img src="/icons/dots-icon.svg" alt="" />
      </button>
      {open ? (
        <div id={menuId} className={styles.dropdown} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.option}
            onClick={handleEdit}
          >
            Редактировать
          </button>
          {isInMenu ? (
            <button
              type="button"
              role="menuitem"
              className={`${styles.option} ${styles.optionDanger}`}
              onClick={handleRemove}
            >
              Убрать из меню
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={`${styles.option} ${styles.optionAdd}`}
              onClick={handleAdd}
            >
              Добавить в меню
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
