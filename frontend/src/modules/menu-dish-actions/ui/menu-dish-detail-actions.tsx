import styles from "./menu-dish-detail-actions.module.css";

export type MenuDishDetailActionsProps = {
  isInMenu: boolean;
  onEdit: () => void;
  onRemoveFromMenu: () => void;
  onAddToMenu: () => void;
};

export function MenuDishDetailActions({
  isInMenu,
  onEdit,
  onRemoveFromMenu,
  onAddToMenu,
}: MenuDishDetailActionsProps) {
  return (
    <div className={styles.footer}>
      <button type="button" className={styles.btnEdit} onClick={onEdit}>
        Редактировать
      </button>
      {isInMenu ? (
        <button
          type="button"
          className={styles.btnRemove}
          onClick={onRemoveFromMenu}
        >
          Убрать из меню
        </button>
      ) : (
        <button type="button" className={styles.btnAdd} onClick={onAddToMenu}>
          Добавить в меню
        </button>
      )}
    </div>
  );
}
