import { NavLink, useLocation } from "react-router-dom";
import styles from "./dashboard-sidebar.module.css";

export function DashboardSidebar() {
  const { pathname } = useLocation();

  const mainIdx =
    pathname === "/" || pathname === ""
      ? 0
      : pathname.startsWith("/calendar")
        ? 1
        : pathname.startsWith("/menu")
          ? 2
          : pathname.startsWith("/suppliers")
            ? 3
            : -1;

  return (
    <aside className={styles.sidebar} aria-label="Навигация">
      <div className={styles.sidebarTop}>
        <div className={styles.logo} title="РСХБ">
          <img src="/logo.svg" alt="РСХБ" />
        </div>

        <nav className={styles.navMain} aria-label="Основное меню">
          <NavLink
            to="/"
            end
            className={() =>
              `${styles.mainSlot} ${mainIdx === 0 ? styles.mainSlotActive : ""}`
            }
            aria-label="Главная"
          >
            <img
              src={
                mainIdx === 0
                  ? "/icons/home-accent-icon.svg"
                  : "/icons/home-icon.svg"
              }
              alt=""
            />
          </NavLink>
          <NavLink
            to="/calendar"
            className={() =>
              `${styles.mainSlot} ${mainIdx === 1 ? styles.mainSlotActive : ""}`
            }
            aria-label="Календарь"
          >
            <img
              src={
                mainIdx === 1
                  ? "/icons/calendar-accent-icon.svg"
                  : "/icons/calendar-icon.svg"
              }
              alt=""
            />
          </NavLink>
          <NavLink
            to="/menu"
            className={() =>
              `${styles.mainSlot} ${mainIdx === 2 ? styles.mainSlotActive : ""}`
            }
            aria-label="Меню и ингредиенты"
          >
            <img
              src={
                mainIdx === 2
                  ? "/icons/ingredients-accent-icon.svg"
                  : "/icons/ingredients-icon.svg"
              }
              alt=""
            />
          </NavLink>
          <NavLink
            to="/suppliers"
            className={() =>
              `${styles.mainSlot} ${mainIdx === 3 ? styles.mainSlotActive : ""}`
            }
            aria-label="Поставщики и поставки"
          >
            <img
              src={
                mainIdx === 3
                  ? "/icons/suppliers-accent-icon.svg"
                  : "/icons/suppliers-icon.svg"
              }
              alt=""
            />
          </NavLink>
        </nav>

        <nav className={styles.navSub} aria-label="Дополнительно">
          <button type="button" className={styles.icon} aria-label="Уведомления">
            <img src="/icons/notification-icon.svg" alt="" />
          </button>
          <button type="button" className={styles.icon} aria-label="Настройки">
            <img src="/icons/settings-icon.svg" alt="" />
          </button>
        </nav>
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.icon} aria-label="Выход">
          <img src="/icons/logout-icon.svg" alt="" />
        </button>
        <div className={styles.user} aria-hidden>
          <img src="/icons/account-icon.svg" alt="" />
        </div>
      </div>
    </aside>
  );
}
