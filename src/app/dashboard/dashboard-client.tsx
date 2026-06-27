"use client";

import { FormEvent, useEffect, useState } from "react";

type VolunteerRequest = {
  id: string;
  status: string;
  volunteer: {
    fullName: string;
    email: string;
  };
  event: {
    title: string;
    location: string;
  };
};

type EventForm = {
  title: string;
  location: string;
  date: string;
  description: string;
  capacity: string;
};

const initialEventForm: EventForm = {
  title: "",
  location: "",
  date: "",
  description: "",
  capacity: "",
};

export default function DashboardClient({ adminName }: { adminName: string }) {
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [message, setMessage] = useState("");

  async function fetchRequests() {
    const res = await fetch("/api/requests");

    if (!res.ok) {
      setMessage("Unable to load requests.");
      return;
    }

    const data = await res.json();
    setRequests(data);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Failed to update request.");
      return;
    }

    setMessage(`Request ${status.toLowerCase()}.`);
    fetchRequests();
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const res = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...eventForm,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? data.message ?? "Failed to create event.");
      return;
    }

    setEventForm(initialEventForm);
    setMessage("Event created.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1>Welcome, {adminName}</h1>
          <p>Publish volunteer opportunities and review incoming requests.</p>
        </div>
        <button className="button button-muted" onClick={logout} type="button">
          Log out
        </button>
      </header>

      {message && <p className="notice">{message}</p>}

      <section className="management-grid">
        <form className="panel" onSubmit={createEvent}>
          <h2>Create event</h2>
          <input
            placeholder="Title"
            value={eventForm.title}
            onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })}
          />
          <input
            placeholder="Location"
            value={eventForm.location}
            onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })}
          />
          <input
            type="date"
            value={eventForm.date}
            onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })}
          />
          <textarea
            placeholder="Description"
            value={eventForm.description}
            onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })}
          />
          <input
            min="1"
            placeholder="Capacity"
            type="number"
            value={eventForm.capacity}
            onChange={(event) => setEventForm({ ...eventForm, capacity: event.target.value })}
          />
          <button className="button" type="submit">
            Create event
          </button>
        </form>

        <section className="panel requests-panel">
          <h2>Volunteer requests</h2>
          {requests.length === 0 && <p className="empty-state">No requests yet.</p>}
          {requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div>
                <h3>{request.volunteer.fullName}</h3>
                <p>{request.volunteer.email}</p>
                <p>
                  {request.event.title} at {request.event.location}
                </p>
              </div>
              <span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span>
              {request.status === "PENDING" && (
                <div className="inline-actions">
                  <button className="button button-small" onClick={() => updateStatus(request.id, "APPROVED")} type="button">
                    Approve
                  </button>
                  <button
                    className="button button-small button-danger"
                    onClick={() => updateStatus(request.id, "REJECTED")}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}