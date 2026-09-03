import {
  LegalPageShell,
} from './LegalPageShell'


export function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      effectiveDate="2026-09-03"
      intro="These terms describe the conditions for using Averlen and its revenue-intelligence workspace."
    >
      <section>
        <h2>1. Using Averlen</h2>
        <p>
          You must provide accurate account information, keep your credentials secure, and use the service only for lawful business purposes. Workspace administrators are responsible for the members and permissions they manage.
        </p>
      </section>

      <section>
        <h2>2. Your workspace and data</h2>
        <p>
          You retain responsibility for the booking, property, account, and other business data you upload or enter. You should only submit data that you are authorized to use and process.
        </p>
      </section>

      <section>
        <h2>3. Revenue intelligence and AI features</h2>
        <p>
          Analytics, pricing recommendations, and AI-assisted insights are decision-support features. They may contain estimates or generated output and should be reviewed before being used for pricing, financial, operational, or customer decisions.
        </p>
      </section>

      <section>
        <h2>4. Acceptable use</h2>
        <ul>
          <li>Do not attempt to bypass access controls, tenant isolation, rate limits, or security protections.</li>
          <li>Do not upload malicious content or use Averlen to violate applicable law or third-party rights.</li>
          <li>Do not interfere with the service or attempt unauthorized access to another workspace.</li>
        </ul>
      </section>

      <section>
        <h2>5. Third-party infrastructure</h2>
        <p>
          Averlen relies on third-party infrastructure and service providers for hosting, databases, caching, media storage, and AI functionality. Availability of those services can affect Averlen.
        </p>
      </section>

      <section>
        <h2>6. Service changes and availability</h2>
        <p>
          Features may change as Averlen evolves. Maintenance, provider outages, or technical issues can occasionally interrupt availability. We may update these terms when the service or its legal requirements change.
        </p>
      </section>

      <section>
        <h2>7. Account restrictions</h2>
        <p>
          Access may be limited or suspended where necessary to protect the service, other users, or workspace data, or where use materially violates these terms.
        </p>
      </section>

      <section>
        <h2>8. Your responsibility for decisions</h2>
        <p>
          You are responsible for reviewing Averlen outputs and for the business decisions you make using them. The service is provided as a software tool and does not replace professional financial, legal, or other specialist advice.
        </p>
      </section>
    </LegalPageShell>
  )
}
