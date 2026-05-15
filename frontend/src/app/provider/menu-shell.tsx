import { MenuDataProvider } from "../../shared/context/menu-data-context";
import { MainLayout } from "../layouts/main-layout";

export function MenuShell() {
  return (
    <MenuDataProvider>
      <MainLayout />
    </MenuDataProvider>
  );
}
