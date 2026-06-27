"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date: string;
  capacity: number | null;
  volunteerRequests?: { id: string; status: string }[];
};

export default function EventsClient({ volunteerName }: { volunteerName: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [message, setMessage] = useState("");
  const [applyingEventId, setApplyingEventId] = useState<string | null>(null);
  const [appliedEventIds, setAppliedEventIds] = useState<Set<string>>(new Set());

  async function fetchEvents() {
    const [eventsRes, requestsRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/requests"),
    ]);

    const eventsData = await eventsRes.json();
    setEvents(eventsData);

    if (requestsRes.ok) {
      const requestsData = await requestsRes.json();
      setAppliedEventIds(new Set(requestsData.map((request: { eventId: string }) => request.eventId)));
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleApply(eventId: string) {
    if (applyingEventId || appliedEventIds.has(eventId)) {
      return;
    }

    setApplyingEventId(eventId);
    setMessage("Submitting your request...");

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
      setApplyingEventId(null);
      return;
    }

    setAppliedEventIds(new Set([...appliedEventIds, eventId]));
    setMessage("Your request was submitted.");
    setApplyingEventId(null);
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
        {events.map((event) => {
          const isApplying = applyingEventId === event.id;
          const hasApplied = appliedEventIds.has(event.id);

          return (
            <article className="event-card" key={event.id}>
              <div>
                <p className="event-date">{new Date(event.date).toLocaleDateString()}</p>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <p className="event-meta">
                  {event.location}
                  {event.capacity !== null ? ` · ${event.capacity} spots` : ""}
                </p>
              </div>
              <button
                className="button"
                disabled={isApplying || hasApplied}
                onClick={() => handleApply(event.id)}
                type="button"
              >
                {isApplying ? "Applying..." : hasApplied ? "Applied" : "Apply"}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}