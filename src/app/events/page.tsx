"use client";

import { useEffect, useState } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  // state for creating events
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  // Testing as Alice for now
  const volunteerId = "cmq89psvf000150y4wstg8iyn";

  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data);
  }

  useEffect(() => {
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

  // Create event function
  async function createEvent() {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        location,
        date,
      }),
    });

    if (res.ok) {
      alert("Event created ");
      
      setTitle("");
      setLocation("");
      setDate("");
      setDescription("");

      window.location.reload(); 
    } else {
      alert("Failed to create event");
      console.error(await res.json());
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Events</h1>

      {/* CREATE EVENT FORM */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h2>Create Event</h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginRight: 10 }}
        />
        
        <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ marginRight: 10 }}
        />


        <button
          onClick={createEvent}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#0070f3",
            color: "white",
            cursor: "pointer",
          }}
        >
          Create
        </button>
      </div>

      {/*EVENTS LIST */}
      {events.map((event) => (
        <div
          key={event.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h2>{event.title}</h2>
          <p>📍 {event.location}</p>
          <p>📅 {new Date(event.date).toLocaleDateString()}</p>

          <button
            onClick={() => handleApply(event.id)}
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#0070f3",
              color: "white",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}