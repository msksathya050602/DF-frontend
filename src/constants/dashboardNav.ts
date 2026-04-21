import { ROUTES } from './routes';

export type DashboardNavItem = { href: string; label: string; icon: string; exact?: boolean };

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: ROUTES.DASHBOARD, label: 'Home', icon: '⌂', exact: true },
  { href: ROUTES.DASHBOARD_PRODUCTS, label: 'Products', icon: '◻' },
  { href: ROUTES.DASHBOARD_CATEGORIES, label: 'Categories', icon: '◫' },
  { href: ROUTES.DASHBOARD_SERVICES, label: 'Services', icon: '⚙' },
  { href: ROUTES.DASHBOARD_PRICING, label: 'Pricing', icon: '₹' },
  { href: ROUTES.DASHBOARD_ORDERS, label: 'Orders', icon: '⌘' },
  { href: ROUTES.DASHBOARD_BRANCHES, label: 'Branches', icon: '⌖' },
];
