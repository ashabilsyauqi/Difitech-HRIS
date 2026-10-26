import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getAuthenticatedUser();
  if (user?.role === "ADMIN" || user?.role === "MANAGER") {
    redirect("/dashboard/workspace?view=admin");
  }
  redirect("/dashboard/workspace?view=dashboard");
}
