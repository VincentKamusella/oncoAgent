# oncoAgent

oncoAgent is a patient-first clinical workspace designed to reduce registration friction and make longitudinal medical records easier to trust, review, and maintain.

The current product focus is oncology, with workflows tailored for cancer care teams and multidisciplinary review. The platform is intentionally designed to expand to other specialties over time.

## Problem

Hospital registration is often fragmented, repetitive, and slow:

- Patients repeatedly provide the same information across visits and departments.
- Clinicians spend time reconciling disconnected records instead of delivering care.
- Administrative inefficiency increases waiting times and operational cost.

In oncology, this problem is amplified because care is long-running, multi-specialist, and highly sensitive to timeline accuracy.

## Solution

oncoAgent introduces an automated, patient-first registration and record workflow:

- Patients enter and update core information through a guided interface.
- Patients can choose what data to share and maintain visibility into their own medical history.
- Hospitals and clinical teams can update records during visits with a traceable change history.

The product models records as a versioned system so that every clinically meaningful update can be reviewed in context.

## What Makes oncoAgent Different

- **Patient-controlled sharing:** data access is consent-aware, not assumed.
- **Versioned medical history:** record changes are tracked over time so clinicians can see what changed, when, and why.
- **Review-oriented workflow:** proposed updates can be surfaced like reviewable changes before becoming part of the active chart.
- **Cancer care first:** the initial workflow and language are optimized for oncology teams and tumor board-style collaboration.

## Current Product Scope

This repository includes the UI and interaction model for:

- patient vaults and structured patient context
- pull-request style clinical updates and conflict states
- timeline-style change provenance
- meeting and follow-up flows for care coordination
- specialist-facing navigation across a patient record

## Tech Stack

- [Next.js](https://nextjs.org) `16`
- [React](https://react.dev) `19`
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) `4`
- [ESLint](https://eslint.org)

## Requirements

- Node.js `20+` recommended
- npm (lockfiles for npm and pnpm are present; npm is used in examples)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build for production
- `npm run start` - run production build
- `npm run lint` - run lint checks

## Vision

oncoAgent starts with cancer care, where data quality and collaboration pressure are highest. The longer-term goal is a reusable patient-first record workflow that can support other hospital departments without sacrificing consent, traceability, or clinical clarity.
