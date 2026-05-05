# SOCA V1 — Non-Goals

This document defines what is explicitly **OUT OF SCOPE** for SOCA V1. It covers both product non-goals and delivery/operational boundaries. Use it to prevent scope creep and to avoid hidden infrastructure/ops/delivery assumptions during implementation.

---

## Part 1 — Product Non-Goals

Do not implement these features as part of the MVP.

### Content & Social

- **Stories** — Ephemeral short-form content
- **Reels** — Short-form video feed format
- **Live streaming** — Real-time video broadcasts

### Notifications & Communication

- **Push notifications** — Out-of-app alerts
- **Media attachments in chat** — Images, videos, or files within messages

### Account & Roles

- **Multi-role switching** — Single user with multiple roles; user must have one role in V1

### Events & Commerce

- **Event ticketing** — Paid or reserved event attendance
- **Event monetization** — Paid events, RSVP monetization
- **Payments** — Any payment processing, subscriptions, or monetization

### Football Operations

- **Contracts or player transfers** — Formal contract management
- **Agent management systems** — Agent-specific workflows or dashboards

### AI & Analytics

- **Advanced AI scouting analysis** — Deep ML-based player evaluation
- **Computer vision player analysis** — Automated video analysis (e.g. tracking, metrics extraction)
- **Advanced analytics dashboards** — Complex reporting or business intelligence

### Platform

- **Full separate web platform** — If mobile-first, a full-featured web app expansion is out of scope for V1

---

## Part 2 — Delivery & Operational Boundaries

These boundaries affect implementation assumptions. Do not assume they are in scope unless explicitly added.

### Deployment & Distribution

- **App Store deployment** — App Store / Google Play / TestFlight publishing is not part of core product behavior scope
- **Distribution pipelines** — Compliance/review cycles, distribution automation

### Hosting & Operations

- **Hosting/ops ownership** — Ongoing hosting, monitoring, analytics, and operational support are outside implementation assumptions unless explicitly added
- **Post-delivery operational support** — Not part of MVP scope

### Ownership & Integrations

- **Third-party accounts** — Client-owned third-party service accounts (auth, storage, etc.) should be assumed; developer may have temporary collaborator access
- **Post-delivery enhancements** — Additional features, web version, deployment assistance, continued development are separate scope

### Implementation Assumptions

- **Portable, maintainable architecture** — Prefer source-code-first architecture suitable for handover
- **No hidden ops dependencies** — Do not build in assumptions about deployment, hosting, or ongoing ops that were never part of the intended scope

---

## Purpose

This document exists to keep Cursor agents and implementers focused on the agreed MVP scope and to stop agents from making hidden infrastructure/ops/delivery assumptions. When in doubt, defer to this list and the product-behavior specification.
