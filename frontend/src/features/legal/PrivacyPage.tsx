import {
  LegalPageShell,
} from './LegalPageShell'


export function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      effectiveDate="2026-09-03"
      intro="This policy explains the categories of information Averlen processes to provide and secure the service."
    >
      <section>
        <h2>1. Information Averlen processes</h2>
        <ul>
          <li>Account information such as email address, name, workspace membership, role, and security-session information.</li>
          <li>Property and booking information that you enter or upload to your workspace.</li>
          <li>Uploaded profile or property media.</li>
          <li>Operational information such as audit events, request metadata, errors, and security activity.</li>
        </ul>
      </section>

      <section>
        <h2>2. How information is used</h2>
        <p>
          Information is processed to authenticate users, isolate workspaces, import booking data, calculate analytics, generate pricing and AI-assisted insights, manage team access, deliver notifications, troubleshoot errors, and protect the service.
        </p>
      </section>

      <section>
        <h2>3. Service providers</h2>
        <p>
          Averlen uses infrastructure providers to operate the application, including Render for application hosting, Neon for PostgreSQL, Upstash for Redis, Cloudinary for media storage, and OpenRouter for configured AI requests. Data sent to a provider is limited to what is needed for the relevant feature.
        </p>
      </section>

      <section>
        <h2>4. AI-assisted features</h2>
        <p>
          When you use AI insights, relevant request context may be sent to the configured AI provider so the feature can generate a response. Avoid submitting unnecessary sensitive or confidential information in free-form AI prompts.
        </p>
      </section>

      <section>
        <h2>5. Authentication and security</h2>
        <p>
          Averlen uses access controls, role-based permissions, organization-level isolation, session management, and other safeguards intended to protect workspace information. No online system can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>6. Retention and deletion</h2>
        <p>
          Workspace information is retained while needed to provide the service and maintain operational or audit history. Where product controls allow deletion, the related records are removed according to the selected action. Some security or audit records may be retained where reasonably necessary for integrity and abuse prevention.
        </p>
      </section>

      <section>
        <h2>7. Your choices</h2>
        <p>
          You can update supported profile information and manage active sessions from Averlen. Workspace administrators can manage members, properties, imports, and other workspace information according to their permissions.
        </p>
      </section>

      <section>
        <h2>8. Policy updates</h2>
        <p>
          This policy may be revised as Averlen changes. The effective version shown on this page identifies the policy associated with the current registration acceptance flow.
        </p>
      </section>
    </LegalPageShell>
  )
}
