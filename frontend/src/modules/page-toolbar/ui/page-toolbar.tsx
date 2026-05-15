import { GlobalSearch } from "@/modules/global-search";
import { MenuPdfUpload } from "@/modules/menu-pdf-upload";
import shell from "@/shared/styles/page-shell.module.css";

export type PageToolbarProps = {
  title: string;
  subtitle: string;
  pdfInputId: string;
  searchDisabled?: boolean;
};

export function PageToolbar({
  title,
  subtitle,
  pdfInputId,
  searchDisabled = false,
}: PageToolbarProps) {
  return (
    <header className={shell.topHeader}>
      <div className={shell.titles}>
        <h1 className={shell.pageTitle}>{title}</h1>
        <p className={shell.pageSub}>{subtitle}</p>
      </div>
      <div className={shell.tools}>
        <div className={shell.toolsLead}>
          <MenuPdfUpload inputId={pdfInputId} />
        </div>
        <div className={shell.toolsSearch}>
          <GlobalSearch
            aria-label="Поиск по приложению"
            disabled={searchDisabled}
          />
        </div>
      </div>
    </header>
  );
}
