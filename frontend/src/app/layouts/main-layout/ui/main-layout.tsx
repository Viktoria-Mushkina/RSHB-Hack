import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "../../../../modules/dashboard-sidebar";
import layout from "../../../../shared/styles/app-layout.module.css";

export function MainLayout() {
  return (
    <div className={layout.root}>
      <DashboardSidebar />
      <div className={layout.main}>
        <Outlet />
      </div>
    </div>
  );
}
