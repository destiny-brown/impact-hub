import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="site-nav">
        <Link className="brand" href="/">
          Impact Hub
        </Link>
        <div className="nav-actions">
          <Link href="/volunteer/login">Volunteer login</Link>
          <Link className="button button-secondary" href="/admin/login">
            Admin portal
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Charity organization</p>
          <h1>Give children and families a stronger future.</h1>
          <p>
            Impact Hub helps your charity publish opportunities, welcome volunteers, and keep
            every request organized from signup to approval.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/volunteer/register">
              Join as a volunteer
            </Link>
            <Link className="button button-muted" href="/volunteer/login">
              Volunteer login
            </Link>
          </div>
        </div>
      </section>

      <section className="impact-strip" aria-label="Charity impact summary">
        <div>
          <span>24</span>
          <p>active outreach opportunities</p>
        </div>
        <div>
          <span>180+</span>
          <p>volunteer hours coordinated monthly</p>
        </div>
        <div>
          <span>1</span>
          <p>private admin portal for charity staff</p>
        </div>
      </section>

      <section className="info-grid" aria-label="How Impact Hub works">
        <article>
          <span>01</span>
          <h2>Support the mission</h2>
          <p>Volunteers create an account, browse upcoming opportunities, and apply for events where they can help.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Manage requests</h2>
          <p>Use the private admin portal to publish events and approve or reject volunteer requests.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Serve with clarity</h2>
          <p>Keep service work organized so every accepted volunteer has a clear place to show up.</p>
        </article>
      </section>

      <section className="mission-band">
        <div>
          <p className="eyebrow">What we do</p>
          <h2>Simple tools for real community care.</h2>
        </div>
        <p>
          The public page introduces the charity, volunteers use their own login, and the admin portal stays separate for trusted staff.
        </p>
      </section>
    </main>
  );
}
