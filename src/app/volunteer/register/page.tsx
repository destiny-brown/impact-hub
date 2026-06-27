"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function VolunteerRegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Unable to create your account.");
      return;
    }

    window.location.href = "/events";
  }

  return (
    <main className="auth-page">
      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <Link className="brand" href="/">
          Impact Hub
        </Link>
        <div>
          <p className="eyebrow">Volunteer registration</p>
          <h1>Create your volunteer account</h1>
          <p>Tell the charity team who you are so they can review your event requests.</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-grid">
          <label>
            Full name
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              required
            />
          </label>
        </div>

        <label>
          Short bio
          <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </label>

        <button className="button" type="submit">
          Create account
        </button>
        <p className="auth-switch">
          Already registered? <Link href="/volunteer/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}