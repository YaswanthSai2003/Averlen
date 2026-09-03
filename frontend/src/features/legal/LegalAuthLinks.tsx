import {
  Link,
} from 'react-router'


type LegalAuthLinksProps = {
  className?: string
}


export function LegalAuthLinks({
  className = '',
}: LegalAuthLinksProps) {
  return (
    <nav
      aria-label="Legal"
      className={`flex items-center justify-center gap-2 text-xs text-slate-400 ${className}`}
    >
      <Link
        to="/terms"
        target="_blank"
        rel="noreferrer"
        className="transition hover:text-brand-700"
      >
        Terms of Service
      </Link>

      <span aria-hidden="true">
        ·
      </span>

      <Link
        to="/privacy"
        target="_blank"
        rel="noreferrer"
        className="transition hover:text-brand-700"
      >
        Privacy Policy
      </Link>
    </nav>
  )
}
