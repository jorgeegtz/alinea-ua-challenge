# Alinea Invest — UA Manager Take-Home System

**Author:** Jorge E. Gutiérrez Hernández (`jorgeegtzhdz@gmail.com`)  
**Live Interactive Web App:** [https://alinea-ua-assestment.vercel.app](https://alinea-ua-assestment.vercel.app)  
**Companion Live Google Spreadsheet Model:** [Open Google Sheet](https://docs.google.com/spreadsheets/d/1VdTnJMs2p4NLGI6j1Mb_CovsykTevPdEmVDoL3xnqY4/edit)

## Overview
An interactive UA Operating System & Financial/Signal-Volume Simulator built for the **Alinea Invest UA Manager Take-Home Challenge**.

### What's Covered
1. **Account Structure & Optimization Events (with Signal-Volume Math)**
   - Why optimizing for `Purchase` on Day 1 fails due to both signal starvation (<50 events/ad set/week) and the **7-Day Free Trial vs. 7-Day Click (7DC) attribution cliff**.
   - Full $100,000 / 30-day campaign architecture across iOS (70%) and Android (30%), Scaling CBO (70%) and Creative Testing ABO (30%).
   - Mathematical progression from `Bank Linked` ($28.80 CPA) -> `Trial Start` ($48.00 CPT, generating 97–121 events/week/ad set) -> `Funded Trial / Synthetic pLTV`.
2. **Creative Testing & Scaling System (50 New Ads / Week)**
   - Testing 10 concepts × 5 variations (50 ads/week) on a $7,000/week ABO budget using Concept-Clustered Ad Sets and a 2x/week (Tuesday/Friday) launch cadence.
   - 4-stage automated stop-loss/kill rules, Post-ID graduation protocol, horizontal/vertical scaling, and fatigue management.
3. **Measurement & Navigating the 7-Day Free Trial Lag**
   - Predictive Day-1 Cohort CAC formula (`pCAC`) combining Cohort CPT (`<= $48.00`), Day-0 Funded Trial Ratio (`Bank Deposit / Trial Start >= 65%`), and 24-hour Auto-Renew Survival (`>= 82%`).
   - Triangulated Source-of-Truth matrix across Meta Ads Manager, MMP (AppsFlyer/Adjust + SKAN 4.0), and Internal DB (Plaid + Stripe).
4. **AI in the Workflow & Human-in-the-Loop Governance**
   - 3-layer AI architecture (Meta Advantage+ automation, LLM/Vision creative hook & tagging pipeline, and Vibe-coded anomaly/pacing dashboard) paired with human SEC RIA compliance and capital allocation guardrails.
   - Concrete real-world examples from **Newform AI** ($100/day -> $1M/month at 50% D7 ROAS) and **Scopely / Storybook App** (AI creative analysis system & 4X subscriber growth).
