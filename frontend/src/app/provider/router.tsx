import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "../../pages/home-page";
import { MenuDishesPage } from "../../pages/menu-dishes-page";
import { SeasonCalendarPage } from "../../pages/season-calendar-page";
import { SuppliersDeliveriesPage } from "../../pages/suppliers-deliveries-page";
import { MenuShell } from "./menu-shell";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MenuShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "calendar", element: <SeasonCalendarPage /> },
      { path: "menu", element: <MenuDishesPage /> },
      { path: "suppliers", element: <SuppliersDeliveriesPage /> },
    ],
  },
]);
