import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN" || user.role === "MANAGER") {
    redirect("/manager");
  } else {
    redirect("/dashboard");
  }
}
