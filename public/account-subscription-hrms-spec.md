## Account & Subscription Module Specification
### For HRMS & Job Portal SaaS (Myanmar Market)

---

### 4. HRMS Subscription Model

#### 4.1 HRMS Plans & Features

**HRMS Plans**

| Feature                                  | Starter              | Silver                    | Gold                    | Diamond                 |
|------------------------------------------|----------------------|---------------------------|-------------------------|-------------------------|
| Price                                    | Free (14-day trial)  | 2,500 MMK/month           | 4,500 MMK/month         | 7,000 MMK/month         |
| Max Employees                            | 5                    | Unlimited                 | Unlimited               | Unlimited               |
| Employee Self-Service Portal             | Yes                  | Yes                       | Yes                     | Yes                     |
| Employee/Role Access                     | No                   | Yes                       | Yes                     | Yes                     |
| Attendance check-in/out (remote)         | No                   | Yes                       | Yes                     | Yes                     |
| OT/Shift Management                      | No                   | No                        | Yes                     | Yes                     |
| Leave Management                         | No                   | Yes                       | Yes                     | Yes                     |
| Employee Requisition                     | No                   | No                        | No                      | Yes                     |
| Employee Resignation                     | No                   | No                        | Yes                     | Yes                     |
| Penalty/Fine Management                  | No                   | No                        | Yes                     | Yes                     |
| Report & Analytics                       | No                   | Yes                       | Yes                     | Yes                     |
| Staff Loan Management                    | No                   | No                        | Yes                     | Yes                     |
| Staff Advance Salary Management          | No                   | No                        | Yes                     | Yes                     |
| Payroll & Tax                            | No                   | Yes                       | Yes                     | Yes                     |
| KPI Management                           | No                   | No                        | No                      | Yes                     |
| QR Code System                           | No                   | No                        | No                      | Yes                     |
| Biometric (Fingerprint)                  | No                   | No                        | No                      | Yes                     |
| Staff Training & Development             | No                   | No                        | No                      | Yes                     |
| Other Allowance Management               | No                   | No                        | No                      | Yes                     |
| Logging & Security                       | No                   | Yes                       | Yes                     | Yes                     |
| Notification System                      | No                   | Yes                       | Yes                     | Yes                     |
| 24/7 Support                             | Yes                  | Yes                       | Yes                     | Yes                     |

#### 4.2 HRMS Subscription Rules

- **Starter Trial**
  - 14-day free usage.
  - Maximum 5 employees.
  - Limited features (no advanced modules, no payroll).
- **Plan Enforcement**
  - Max employees:
    - Starter capped at **5 active** employees.
    - Others: unlimited but still validated for performance.
  - Feature toggles:
    - Each HRMS module checks the **company plan** before enabling UI and API.
- **Upgrades / Downgrades**
  - **Upgrade:**
    - Immediate access to new features after successful payment.
    - Prorated billing is optional (configurable).
  - **Downgrade:**
    - Effective at the end of the current billing period.
    - Warn if current usage exceeds future plan limits (e.g., advanced modules in use).
- **Cancellation**
  - Company may cancel renewal:
    - Subscription remains active until `expiry_date`.
    - After expiry:
      - HRMS modules locked to **read-only** mode for limited time (e.g., 30 days).
- **Grace Period (Optional)**
  - Configurable grace period (e.g., 7 days) after payment failure.
  - Limited access with warning banners.

---

### 5. Payment & Billing Architecture

#### 5.1 Supported Gateways

- **Primary (Myanmar)**
  - **Manual Bank Transfer**
    - The core method. Companies transfer funds to official checking accounts (e.g., KBZ, CB, AYA) and upload a screenshot/slip for manual verification by Super Admin.
- **Secondary (Myanmar)**
  - **MMQR**
    - To be implemented if the new SDK/package is viable within the timeline. Considered a bonus feature.
- **Future Integration (Placeholders Only)**
  - **Dinger (Local), Stripe, PayPal (Global)**
    - Only code structure and placeholder models provided for future readiness. No real API testing or integration required for the MVP phase.

#### 5.2 Core Billing Features

- **Tier-based subscription** (Job Portal & HRMS).
- **Monthly & yearly plans** (discount for yearly is recommended).
- **Manual Payment Verification Flow**:
  - Requires a "Pending Verification" status where a Super Admin must review the uploaded slip before the plan becomes `active`.
- **Feature Add-ons (One-Time Purchase)**:
  - Sold separately to companies already on a paid plan (e.g., adding "Advance Loan Management" to a Silver plan).
  - Billed as a one-time fee, permanently unlocking that specific feature module.
- **Future scalability**:
  - Ability to add bundled plans (Job Portal + HRMS) and activate automated gateway webhooks when business grows.
- **Invoice System (Recommended)**
  - Generate downloadable invoices (PDF) for each successful payment.
  - Basic data:
    - Company info.
    - Plan name.
    - Amount.
    - Period covered.
    - Payment reference.

#### 5.3 Backend Flow (Laravel-Oriented)

1. **User selects plan**
   - Inputs:
     - Product line: `job_portal` or `hrms`.
     - Plan code: `starter`, `silver`, `gold`, `diamond`.
     - Billing cycle: `monthly` or `yearly`.
2. **Create Payment Request**
   - Backend creates a **subscription transaction**:
     - `subscription_transactions` record:
       - `company_id`.
       - `plan_id`.
       - `amount`.
       - `currency`.
       - `billing_cycle`.
       - `gateway` (dinger / stripe / paypal).
       - `status = pending`.
   - Initiate payment via selected gateway API.
3. **Redirect to Payment Instructions / Gateway**
   - User is shown the bank transfer details (KBZ, CB, AYA) and a form to upload their payment screenshot (if Manual).
   - If MMQR, scan the generated code.
4. **Payment Submission & Verification**
   - **Manual**: User submits the screenshot. `subscription_transactions.status` becomes `pending_verification`.
   - **Super Admin Action**: Admin reviews the slip in the dashboard and clicks "Approve" or "Reject".
   - (For future Webhooks: The system would automatically notify the backend to approve).
5. **Activate Subscription & Add-ons**
   - On admin approval (or future webhook success):
     - Update `subscription_transactions.status = success`.
     - Create or update `company_subscriptions`:
       - Set `status = active`, update `expiry_date`.
     - **If Add-on Purchase**: Append the purchased feature to the company's `feature_flags` JSON or create a record in a `company_addons` table to permanently unlock it.
   - Send confirmation email and in-app notification.

---

### 6. Data Model (Database Schema – High Level)

> Backend framework assumed: **Laravel**.  
> Use Laravel migrations to implement the following structure.

#### 6.1 `subscription_plans`

Holds all plans (Job Portal + HRMS).

- `id`.
- `name` (e.g., "Job Portal Silver", "HRMS Gold").
- `code` (e.g., `job_silver`, `hrms_gold`).
- `product_type` (`job_portal` / `hrms`).
- `tier` (`starter` / `silver` / `gold` / `diamond`).
- `price_monthly`.
- `price_yearly` (nullable).
- `currency` (e.g., `MMK`, `USD`).
- `max_employees` (nullable, HRMS only).
- `job_post_limit` (nullable, Job Portal only).
- `cv_search_access` (bool, nullable).
- `feature_flags` (JSON, for HRMS & Job Portal modules).
- `trial_days` (e.g., 14 for Starter).
- `is_active` (bool).
- Timestamps.

#### 6.2 `company_subscriptions`

Tracks active subscriptions per company per product.

- `id`.
- `company_id`.
- `plan_id` (`subscription_plans.id`).
- `product_type` (`job_portal` / `hrms`).
- `billing_cycle` (`monthly` / `yearly`).
- `start_date`.
- `expiry_date`.
- `status` (`active` / `expired` / `cancelled` / `trial`).
- `auto_renew` (bool).
- `meta` (JSON – for additional data).
- Timestamps.

#### 6.3 `subscription_transactions`

One record per attempted subscription or renewal payment.

- `id`.
- `company_id`.
- `subscription_id` (`company_subscriptions.id`, nullable if first payment).
- `plan_id` (nullable if paying for an add-on).
- `item_type` (`subscription` / `addon`).
- `item_name` (e.g., "Silver Plan Monthly", "Advance Loan Add-on").
- `amount`.
- `currency`.
- `payment_method` (`manual_transfer` / `mmqr` / `placeholder_stripe` / `placeholder_dinger`).
- `payment_proof_path` (nullable, file path to uploaded screenshot).
- `gateway_transaction_id` (nullable, for MMQR or future gateways).
- `status` (`pending_verification` / `success` / `failed` / `rejected`).
- `admin_notes` (nullable, reason for rejection).
- Timestamps.

#### 6.4 `payment_logs`

Raw record of all gateway interactions.

- `id`.
- `gateway` (`dinger` / `stripe` / `paypal`).
- `direction` (`request` / `response` / `webhook`).
- `reference_id` (link to `subscription_transactions.id` or external reference).
- `payload` (JSON).
- `status_code` (nullable).
- Timestamps.

#### 6.5 Supporting Entities (Examples)

- `companies`
  - `id`, `name`, `industry`, `location`, `status` (`pending_verification` / `verified` / `rejected`), etc.
- `jobs`
  - `id`, `company_id`, `title`, `location`, `salary_min`, `salary_max`, `status` (`pending_review` / `active` / `expired` / `closed`), `published_at`, `expires_at`, etc.
- `candidates`
  - Candidate profiles with searchable fields.
- `applications`
  - `candidate_id`, `job_id`, `status`, `notes`, etc.

---

### 7. Dashboards & UX Requirements

#### 7.1 Employer Dashboard (Job Portal "Control Room")

- **Overview Cards**
  - Active jobs count.
  - Expired jobs.
  - Total applications.
  - Job slots remaining vs. plan limit.
- **Job Management Table**
  - Columns:
    - Job title.
    - Status.
    - Date posted.
    - Expiry date.
    - Views.
    - Applications.
- **CV Database Access (Gold/Diamond Only)**
  - Search input with filters:
    - Skills.
    - Experience.
    - Location.
    - Expected salary range.
- **Analytics**
  - Per-job metrics:
    - Views vs. applications (conversion rate).
  - Plan value:
    - “Your jobs received X applications this month.”

#### 7.2 Candidate Experience (Mobile-First)

- **Smart Profile**
  - Structured form:
    - Personal details.
    - Education.
    - Experience.
    - Skills.
    - Language proficiency.
  - Upload CV (PDF/Doc) as attachment.
- **Job Search & Apply**
  - Optimized for mobile, low bandwidth:
    - Minimal heavy assets.
    - Fast loading lists.
- **Job Alerts**
  - Candidate can:
    - Follow industries and locations.
  - System:
    - Sends email/in-app alerts on new matching jobs.

#### 7.3 Super Admin Dashboard

- **Subscription Management**
  - View companies by:
    - Current plan.
    - Status (trial/active/expired).
  - Ability to:
    - Manually extend subscriptions.
    - Manually apply promotions (e.g., free month).
- **Payment Verification**
  - Review transaction logs:
    - Filter by gateway, status, date.
- **Featured Jobs**
  - UI to:
    - Pin Diamond-tier jobs to homepage featured section.
- **Support / Tickets**
  - Basic ticketing:
    - Company creates ticket for:
      - Payment issues.
      - Technical issues (e.g., logo not uploading).

---

### 8. Automation & Scheduled Jobs

- **Expire Jobs**
  - Daily cron:
    - Set jobs to `expired` after 30 days (configurable).
- **Expire Subscriptions**
  - Daily cron:
    - Check `expiry_date` in `company_subscriptions`.
    - Set `status = expired` when past due and auto-renewal fails/off.
- **Trial Expiry Notifications**
  - Notify companies:
    - 3 days before trial ends.
    - On the day of expiry.
- **Payment Reminders**
  - For upcoming renewals:
    - 7 days and 1 day before renewal date.

---

### 9. Security, Logging & Compliance

- **Data Privacy**
  - Hide candidate contact details until permitted by plan.
  - Restrict access to candidate data to authorized company users.
- **Logging & Audit**
  - For HRMS:
    - Log all critical actions:
      - Access to employee data.
      - Payroll runs.
      - Approvals.
- **Localization**
  - Support Myanmar language and English UI (future-ready).
  - Proper formatting for MMK currency display.

---

### 10. Summary of Key Implementation Priorities

- **Unify subscription logic** for both Job Portal & HRMS under shared tables: `subscription_plans`, `company_subscriptions`, `subscription_transactions`, `payment_logs`.
- **Implement robust payment flow**: Dinger, Stripe, PayPal with secure webhook handling.
- **Enforce business rules**: 14-day trials, auto-expiry of jobs after 30 days, plan-based feature toggles and limits.
- **Deliver strong UX**: mobile-first candidate journey, clear employer control room, transparent analytics and billing history.

