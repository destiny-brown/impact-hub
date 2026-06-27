"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date: string;
  capacity: number | null;
};

export default function EventsClient({ volunteerName }: { volunteerName: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [message, setMessage] = useState("");

  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleApply(eventId: string) {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        message: "I want to help",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Could not submit your request.");
      return;
    }

    setMessage("Your request was submitted.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Volunteer opportunities</p>
          <h1>Hi, {volunteerName}</h1>
          <p>Browse active charity events and apply for the ones that fit your availability.</p>
        </div>
        <button className="button button-muted" onClick={logout} type="button">
          Log out
        </button>
      </header>

      {message && <p className="notice">{message}</p>}

      <section className="event-list">
        {events.map((event) => (
          <article className="event-card" key={event.id}>
            <div>
              <p className="event-date">{new Date(event.date).toLocaleDateString()}</p>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <p className="event-meta">{event.location}</p>
            </div>
            <button className="button" onClick={() => handleApply(event.id)} type="button">
              Apply
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}