import { useMenuData } from "@/shared/context/menu-data-context";
import layout from "@/shared/styles/app-layout.module.css";
import styles from "./menu-pdf-upload.module.css";

type MenuPdfUploadProps = {
  inputId: string;
};

export function MenuPdfUpload({ inputId }: MenuPdfUploadProps) {
  const { hasMenu, isLoading, filename, handleFileChange } = useMenuData();

  return (
    <div className={styles.wrap}>
      <input
        id={inputId}
        type="file"
        accept=".pdf"
        className={layout.headerFileInput}
        onChange={handleFileChange}
      />
      {!hasMenu ? (
        <label
          htmlFor={inputId}
          className={`${layout.uploadMenuBtn} ${isLoading ? layout.uploadMenuBusy : ""}`}
          aria-busy={isLoading}
        >
          <img src="/icons/add-icon.svg" alt="" />
          {isLoading ? "Анализ…" : "Загрузить меню"}
        </label>
      ) : (
        <button
          type="button"
          className={layout.menuIconBtn}
          aria-label={
            filename ? `Заменить меню (${filename})` : "Заменить меню"
          }
          title={filename || "Заменить меню"}
          disabled={isLoading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <img src="/icons/menu-icon.svg" alt="" />
        </button>
      )}
    </div>
  );
}
