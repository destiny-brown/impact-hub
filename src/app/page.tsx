import Link from "next/link";
import ActivityFeed from "./activity-feed";

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="site-nav">
        <Link className="brand" href="/">
          Impact Hub
        </Link>
        <div className="nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#organizers">For organizers</a>
        </div>
        <div className="nav-actions">
          <Link href="/volunteer/login">Volunteer login</Link>
          <Link className="button button-secondary" href="/admin/login">
            Admin portal
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Volunteer coordination platform</p>
          <h1>Coordinate community events without losing track of people.</h1>
          <p>
            Impact Hub helps organizers create events, onboard volunteers, review requests,
            and keep every status transparent from signup to approval.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/volunteer/register">
              Join as a volunteer
            </Link>
            <Link className="button button-muted" href="/admin/login">
              Open admin portal
            </Link>
          </div>
          <div className="hero-proof" aria-label="Platform capabilities">
            <span>Role-based access</span>
            <span>Request lifecycle tracking</span>
            <span>Kafka event feedback</span>
          </div>
        </div>

        <div className="product-preview" aria-label="Impact Hub dashboard preview">
          <div className="preview-header">
            <div>
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot" />
            </div>
            <p>Live dashboard</p>
          </div>
          <div className="preview-metrics">
            <div>
              <span>24</span>
              <p>Events</p>
            </div>
            <div>
              <span>68</span>
              <p>Requests</p>
            </div>
            <div>
              <span>12</span>
              <p>Pending</p>
            </div>
          </div>
          <div className="preview-card">
            <div>
              <h2>Community food drive</h2>
              <p>Sat, 9:00 AM - Downtown Center</p>
            </div>
            <span className="status-pill status-pending">PENDING</span>
          </div>
          <div className="preview-card">
            <div>
              <h2>School supplies packing</h2>
              <p>Volunteer request approved</p>
            </div>
            <span className="status-pill status-approved">APPROVED</span>
          </div>
          <div className="system-feedback">
            <span>Kafka</span>
            Request update published
          </div>
        </div>
      </section>

      <section className="impact-strip" aria-label="Platform summary">
        <div>
          <span>24</span>
          <p>active community events</p>
        </div>
        <div>
          <span>4</span>
          <p>request states tracked clearly</p>
        </div>
        <div>
          <span>2</span>
          <p>focused roles for admins and volunteers</p>
        </div>
      </section>

      <section className="section-heading" id="features">
        <p className="eyebrow">Main benefits</p>
        <h2>Everything organizers need to move from signup to service.</h2>
        <p>
          A focused MVP for publishing events, collecting volunteer interest, and making admin decisions without spreadsheet drift.
        </p>
      </section>

      <section className="info-grid" aria-label="Impact Hub features">
        <article>
          <span>01</span>
          <h2>Create and manage events</h2>
          <p>Publish opportunities with location, date, descriptions, and capacity context.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Onboard volunteers</h2>
          <p>Let volunteers register, sign in, and apply using their own profile.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Track request lifecycles</h2>
          <p>Follow every request through PENDING, APPROVED, REJECTED, or WITHDRAWN.</p>
        </article>
        <article>
          <span>04</span>
          <h2>Moderate in one dashboard</h2>
          <p>Admins can review requests, approve volunteers, and keep participation organized.</p>
        </article>
        <article>
          <span>05</span>
          <h2>Separate user roles</h2>
          <p>Volunteers see opportunities while admins manage events and request decisions.</p>
        </article>
        <article>
          <span>06</span>
          <h2>Show system feedback</h2>
          <p>Kafka events can signal when requests are created or updated in the platform.</p>
        </article>
      </section>

      <section className="mission-band" id="workflow">
        <div>
          <p className="eyebrow">Workflow</p>
          <h2>Clear status from first click to final decision.</h2>
        </div>
        <div className="workflow-line" aria-label="Volunteer request lifecycle">
          <span>PENDING</span>
          <span>APPROVED</span>
          <span>REJECTED</span>
          <span>WITHDRAWN</span>
        </div>
      </section>

      <ActivityFeed />

      <section className="organizer-panel" id="organizers">
        <div>
          <p className="eyebrow">For organizers</p>
          <h2>Review requests faster with a dedicated admin portal.</h2>
          <p>
            Keep event creation and moderation behind an admin login while volunteers use a simple public onboarding path.
          </p>
        </div>
        <Link className="button" href="/admin/login">
          Go to admin portal
        </Link>
      </section>
    </main>
  );
}
