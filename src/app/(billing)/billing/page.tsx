import { ROUTES } from "@constants/routes";
import { redirect } from "next/navigation";

export default function BillingPage() {
  redirect(ROUTES.BILLING_TODAY);
}
