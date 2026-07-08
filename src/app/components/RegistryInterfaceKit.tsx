import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  MapPinned,
  PlusCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  WalletCards
} from "lucide-react";

type Tone = "blue" | "green" | "red" | "yellow" | "gray" | "navy";

export function SkiperPanel({
  children,
  className = "",
  tone = "navy"
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return <div className={`skiper-panel skiper-panel-${tone} ${className}`}>{children}</div>;
}

export function SkiperMotionFrame({
  children,
  label,
  className = ""
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`skiper-motion-frame ${className}`}>
      {label ? <span className="skiper-frame-label">{label}</span> : null}
      {children}
    </div>
  );
}

export function SkiperTickerRail({
  items,
  tone = "navy"
}: {
  items: string[];
  tone?: Tone;
}) {
  return (
    <div className={`skiper-ticker-rail skiper-panel-${tone}`} aria-label="Canlı bilgi akışı">
      <div>
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function SkiperLogoShowcase({
  items,
  label = "Referans ve iş ortağı logoları"
}: {
  items: { title: string; imageUrl?: string; meta?: string }[];
  label?: string;
}) {
  const safeItems = items.length ? items : [{ title: "Şeflek Tur" }];
  const rows = [
    safeItems,
    [...safeItems.slice(3), ...safeItems.slice(0, 3)],
    [...safeItems.slice(6), ...safeItems.slice(0, 6)]
  ];

  return (
    <section className="skiper-logo-showcase" aria-label={label}>
      <div className="skiper-logo-showcase-head">
        <span>Referans Ağı</span>
        <strong>Kurumsal iş ortaklığı vitrini</strong>
      </div>
      <div className="skiper-logo-rows" aria-hidden="true">
        {rows.map((row, rowIndex) => (
          <div className="skiper-logo-row" style={{ "--row-index": rowIndex } as CSSProperties} key={`row-${rowIndex}`}>
            {[...row, ...row].map((item, index) => (
              <span className="skiper-logo-pill" key={`${item.title}-${rowIndex}-${index}`}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <b>{item.title}</b>}
                <small>{item.meta || "Referans"}</small>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Auth01Panel({
  title,
  body,
  mode = "transitos"
}: {
  title: string;
  body: string;
  mode?: "transitos" | "site";
}) {
  return (
    <div className={`auth01-panel auth01-${mode}`}>
      <div className="auth01-icon">
        {mode === "site" ? <Sparkles size={24} /> : <ShieldCheck size={24} />}
      </div>
      <div>
        <span>{mode === "site" ? "Kurumsal İçerik Yönetimi" : "TransitOS Güvenli Giriş"}</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </div>
  );
}

export function OnboardingScreen({
  eyebrow,
  title,
  body,
  steps,
  actionHref,
  actionLabel,
  compact = false
}: {
  eyebrow: string;
  title: string;
  body: string;
  steps: { title: string; body: string }[];
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}) {
  return (
    <section className={`onboarding-screen ${compact ? "compact" : ""}`}>
      <div>
        <span className="registry-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        {actionHref && actionLabel ? (
          <a className="registry-action" href={actionHref}>
            {actionLabel}
            <ArrowRight size={17} />
          </a>
        ) : null}
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step.title}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>
              <strong>{step.title}</strong>
              <small>{step.body}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ExpandableProfileCard({
  title,
  subtitle,
  meta,
  avatar,
  badge,
  children,
  defaultOpen = false,
  compact = false
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  avatar?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  return (
    <details className={`expandable-profile-card ${compact ? "compact" : ""}`} open={defaultOpen}>
      <summary>
        <span className="profile-avatar">{avatar ?? <UserRound size={20} />}</span>
        <span className="profile-main">
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
          {meta ? <em>{meta}</em> : null}
        </span>
        {badge ? <span className="profile-badge">{badge}</span> : null}
        <ChevronDown className="profile-chevron" size={18} />
      </summary>
      {children ? <div className="profile-expanded">{children}</div> : null}
    </details>
  );
}

export function InlineDisclosureMenu({
  label = "İşlemler",
  children,
  tone = "gray"
}: {
  label?: ReactNode;
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <details className={`inline-disclosure-menu disclosure-${tone}`}>
      <summary>
        <span>{label}</span>
        <ChevronDown size={16} />
      </summary>
      <div>{children}</div>
    </details>
  );
}

export function AddCashDisclosure({
  title,
  amount,
  description,
  children,
  tone = "green"
}: {
  title: string;
  amount: string;
  description?: string;
  children?: ReactNode;
  tone?: Tone;
}) {
  return (
    <details className={`add-cash-disclosure skiper-panel-${tone}`}>
      <summary>
        <span className="cash-icon"><WalletCards size={19} /></span>
        <span>
          <strong>{title}</strong>
          {description ? <small>{description}</small> : null}
        </span>
        <b>{amount}</b>
        <ChevronDown size={16} />
      </summary>
      {children ? <div className="cash-disclosure-body">{children}</div> : null}
    </details>
  );
}

export function ViewOnMap({
  title,
  subtitle,
  href,
  embedUrl,
  children,
  actionLabel = "Haritada aç"
}: {
  title: string;
  subtitle?: string;
  href?: string;
  embedUrl?: string;
  children?: ReactNode;
  actionLabel?: string;
}) {
  return (
    <section className="view-on-map">
      <div className="view-on-map-head">
        <span><MapPinned size={18} /></span>
        <div>
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {actionLabel}
            <ArrowRight size={15} />
          </a>
        ) : null}
      </div>
      {embedUrl ? (
        <iframe
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
          title={title}
        />
      ) : children ? (
        <div className="view-on-map-body">{children}</div>
      ) : null}
    </section>
  );
}

export function FrequencySelector({
  name,
  label,
  options,
  defaultValue
}: {
  name: string;
  label: string;
  options: { value: string; label: string; tone?: Tone }[];
  defaultValue?: string;
}) {
  return (
    <fieldset className="frequency-selector">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label className={`frequency-option frequency-${option.tone ?? "gray"}`} key={option.value}>
            <input name={name} type="radio" value={option.value} defaultChecked={(defaultValue ?? options[0]?.value) === option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AdaptiveSlider({
  name,
  label,
  min,
  max,
  step = 1,
  defaultValue,
  helper
}: {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number | string;
  helper?: string;
}) {
  return (
    <label className="adaptive-slider">
      <span>
        <SlidersHorizontal size={16} />
        <strong>{label}</strong>
      </span>
      <input name={name} type="range" min={min} max={max} step={step} defaultValue={defaultValue ?? min} />
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

export function FloatingInput({
  name,
  label,
  type = "text",
  defaultValue,
  required = false,
  autoComplete,
  inputMode,
  min,
  max
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "search" | "url";
  min?: number;
  max?: number;
}) {
  return (
    <label className="floating-input">
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        placeholder=" "
      />
      <span>{label}</span>
    </label>
  );
}

export function RegistryStatusPills({
  items
}: {
  items: { label: string; value: string | number; tone?: Tone }[];
}) {
  return (
    <div className="registry-status-pills">
      {items.map((item) => (
        <span className={`status-pill status-${item.tone ?? "gray"}`} key={item.label}>
          <CheckCircle2 size={15} />
          <b>{item.value}</b>
          <small>{item.label}</small>
        </span>
      ))}
    </div>
  );
}

export function QuickCreateCard({
  title,
  body,
  children
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="quick-create-card">
      <span><PlusCircle size={20} /></span>
      <div>
        <strong>{title}</strong>
        <small>{body}</small>
      </div>
      {children}
    </section>
  );
}

export function CalendarMiniPanel({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="calendar-mini-panel">
      <CalendarDays size={18} />
      <span>
        <strong>{title}</strong>
        <small>{body}</small>
      </span>
    </div>
  );
}
