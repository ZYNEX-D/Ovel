import { redirect } from "next/navigation";

// Password recovery uses Clerk's verified code flow inside the sign-in form.
export default function ForgotPasswordPage() {
  redirect("/login");
}
