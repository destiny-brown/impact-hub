import AuthLoginForm from "@/app/auth-login-form";

export default function AdminLoginPage() {
  return (
    <AuthLoginForm
      role="ADMIN"
      title="Admin portal"
      subtitle="Log in to manage charity events and volunteer requests."
      redirectTo="/dashboard"
    />
  );
}