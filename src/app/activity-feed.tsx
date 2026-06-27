"use client";

import { useEffect, useState } from "react";

type PublicActivity = {
  id: string;
  label: string;
  detail: string;
  status: string;
  createdAt: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ActivityFeed() {
  const [activity, setActivity] = useState<PublicActivity[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      const res = await fetch("/api/activity", { cache: "no-store" });

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      if (isMounted) {
        setActivity(data);
      }
    }

    loadActivity();
    const interval = window.setInterval(loadActivity, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="activity-section" aria-label="Live request activity">
      <div className="section-heading activity-heading">
        <p className="eyebrow">Live activity</p>
        <h2>Public request updates as they happen.</h2>
        <p>Kafka request events are summarized here without exposing volunteer contact details.</p>
      </div>

      <div className="activity-feed">
        {activity.length === 0 && <p className="empty-state">No request activity yet.</p>}
        {activity.map((item) => (
          <article className="activity-item" key={item.id}>
            <span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span>
            <div>
              <h3>{item.label}</h3>
              <p>{item.detail}</p>
            </div>
            <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
          </article>
        ))}
      </div>
    </section>
  );
}