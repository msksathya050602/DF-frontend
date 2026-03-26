"use client";

type DashboardHeaderProps = {
  adminName: string;
  onLogout: () => void;
};

export function DashboardHeader({ adminName, onLogout }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <h1>Welcome back, {adminName || "Admin"}</h1>
        <p>Operations overview and management console</p>
      </div>
      <button type="button" onClick={onLogout}>
        Logout
      </button>
    </header>
  );
}
