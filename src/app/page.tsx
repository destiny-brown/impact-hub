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
          <p className="eyebrow">Community charity coordination</p>
          <h1>Helping local volunteers meet real needs faster.</h1>
          <p>
            Impact Hub connects people who want to help with the charity events, outreach days,
            donation drives, and service projects that need them most.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/volunteer/register">
              Become a volunteer
            </Link>
            <Link className="button button-muted" href="/volunteer/login">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="impact-panel" aria-label="Charity impact summary">
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
            <p>admin portal for charity staff decisions</p>
          </div>
        </div>
      </section>

      <section className="info-grid" aria-label="How Impact Hub works">
        <article>
          <h2>For volunteers</h2>
          <p>Create an account, browse upcoming opportunities, and apply for the events where you can help.</p>
        </article>
        <article>
          <h2>For charity staff</h2>
          <p>Use the private admin portal to publish events and approve or reject volunteer requests.</p>
        </article>
        <article>
          <h2>For the community</h2>
          <p>Keep service work organized so every accepted volunteer has a clear place to show up.</p>
        </article>
      </section>
    </main>
  );
}
