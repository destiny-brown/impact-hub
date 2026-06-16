"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [requests, setRequests] = useState<any[]>([]);

  async function fetchRequests() {
    const res = await fetch("/api/requests");
    const data = await res.json();
    setRequests(data);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        status,
      }),
    });

    fetchRequests(); // refresh list
  }

  return (
  <div style={{ padding: 20 }}>
    <h1 style={{ fontSize: 28, marginBottom: 20 }}>
      Requests Dashboard
    </h1>
    <div style={{ marginBottom: 20 }}>
      <a href="/events" style={{ marginRight: 10 }}>
      Events
      </a>
      |{" "}
      <a href="/dashboard" style={{ marginRight: 10 }}>
      Dashboard
      </a>
      </div>


    {requests.map((r) => (
      <div
        key={r.id}
        style={{
          border: "1px solid #ccc",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <p><strong>Volunteer:</strong> {r.volunteer.fullName}</p>
        <p><strong>Event:</strong> {r.event.title}</p>
        <p><strong>Location:</strong> {r.event.location}</p>

        {/* Styled status */}
        <p>
          <strong>Status:</strong>{" "}
          <span
            style={{
              color:
                r.status === "APPROVED"
                  ? "green"
                  : r.status === "REJECTED"
                  ? "red"
                  : "orange",
              fontWeight: "bold",
            }}
          >
            {r.status}
          </span>
        </p>

        {/* Buttons */}
        {r.status === "PENDING" && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => updateStatus(r.id, "APPROVED")}
              style={{
                marginRight: 10,
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "green",
                color: "white",
                cursor: "pointer",
              }}
            >
              Approve
            </button>

            <button
              onClick={() => updateStatus(r.id, "REJECTED")}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "red",
                color: "white",
                cursor: "pointer",
              }}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
);
}