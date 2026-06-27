"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type LoginFormProps = {
  role: "ADMIN" | "VOLUNTEER";
  title: string;
  subtitle: string;
  redirectTo: string;
};

export default function AuthLoginForm({ role, title, subtitle, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Unable to log in.");
      return;
    }

    window.location.href = redirectTo;
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Link className="brand" href="/">
          Impact Hub
        </Link>
        <div>
          <p className="eyebrow">{role === "ADMIN" ? "Charity staff" : "Volunteer"}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <label>
          Email
          <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Password
          <input
            autoComplete={role === "ADMIN" ? "current-password" : "current-password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="button" type="submit">
          Log in
        </button>

        {role === "VOLUNTEER" && (
          <p className="auth-switch">
            New here? <Link href="/volunteer/register">Create a volunteer account</Link>
          </p>
        )}
      </form>
    </main>
  );
}