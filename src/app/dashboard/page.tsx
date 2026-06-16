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
      <h1>Requests Dashboard</h1>

      {requests.map((r) => (
        <div key={r.id} style={{ marginBottom: 20 }}>
          <p>Volunteer: {r.volunteerId}</p>
          <p>Event: {r.eventId}</p>
          <p>Status: {r.status}</p>

          {r.status === "PENDING" && (
            <>
              <button onClick={() => updateStatus(r.id, "APPROVED")}>
                Approve
              </button>

              <button onClick={() => updateStatus(r.id, "REJECTED")}>
                Reject
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}