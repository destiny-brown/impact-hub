import AuthLoginForm from "@/app/auth-login-form";

export default function VolunteerLoginPage() {
  return (
    <AuthLoginForm
      role="VOLUNTEER"
      title="Volunteer login"
      subtitle="Access upcoming opportunities and track the requests you submit."
      redirectTo="/events"
    />
  );
}