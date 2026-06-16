"use client";

import { useEffect, useState } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  // 👉 replace with ONE real volunteer ID from your DB
  const volunteerId = "YOUR_VOLUNTEER_ID";

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    }

    fetchEvents();
  }, []);

  async function handleApply(eventId: string) {
    await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        volunteerId,
        eventId,
        message: "I want to help",
      }),
    });

    alert("Applied!");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Events</h1>

      {events.map((event) => (
        <div key={event.id} style={{ marginBottom: 20 }}>
          <h2>{event.title}</h2>
          <p>{event.location}</p>
          <p>{new Date(event.date).toLocaleDateString()}</p>

          <button onClick={() => handleApply(event.id)}>
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}