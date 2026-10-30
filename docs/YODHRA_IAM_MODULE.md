# YODHRA — Interactive Profile & Institutional Hierarchy (IAM) Module

## 1. Executive Summary & Objective

The **YODHRA Institutional Identity & Access Management (IAM)** module upgrades the personal profile and institutional hierarchy into an enterprise-grade, editable, and auditable governance center.

Rooted in verified institutional data for **Karnatak Law Society (KLS)** and **KLS Vishwanathrao Deshpande Institute of Technology (KLS VDIT)** in Haliyal, Karnataka, the IAM subsystem provides:
- Personal profile management with immutable institutional identity locks.
- Multi-tier expandable institutional hierarchy (`Institution` $\rightarrow$ `Campus` $\rightarrow$ `Department` $\rightarrow$ `User Group` $\rightarrow$ `Members`).
- 7-tier Role-Based Access Control (RBAC) matrix with privilege elevation protection.
- Active device session monitoring and remote revocation.
- Immutable security audit logging for all authentication and administrative actions.

---

## 2. Institutional Architecture: KLS VDIT

| Tier | Entity Name | Code / ID | Coordinates / Lead |
|---|---|---|---|
| **Institution** | Karnatak Law Society (KLS) | `inst-kls-01` | Governing Council, Belagavi |
| **Campus** | KLS Vishwanathrao Deshpande Institute of Technology | `camp-vdit-01` | Haliyal, Karnataka (15.3227° N, 74.7549° E) |
| **Department** | Computer Science & Engineering | `DEPT-CSE` | Dr. Ravindra S. / HOD CSE |
| **Department** | Electronics & Communication Engineering | `DEPT-ECE` | HOD ECE |
| **Department** | Mechanical Engineering | `DEPT-MECH` | HOD Mechanical |
| **Department** | Administration & Bursar Hub | `DEPT-ADMIN` | Campus Administrative Officer |
| **Department** | Campus Physical Security & Surveillance | `DEPT-SECURITY` | Chief Security Officer |

---

## 3. 7-Tier Role-Based Access Control (RBAC) Matrix

| Institutional Role | Target Audience | Key Permissions | User Count |
|---|---|---|---|
| **Student** | Undergraduate & postgraduate students | `view_profile`, `edit_own_profile` | 1,420 |
| **Faculty** | Professors, lab instructors | + `manage_incidents` | 184 |
| **Department Coordinator** | Departmental leads, program coordinators | + `view_investigation` | 28 |
| **Campus Security Officer** | Physical patrol, field response | + `manage_alerts` | 16 |
| **Security Analyst** | Campus SOC analysts | + `access_audit_logs` | 8 |
| **Institution Administrator** | IT Director, Dean of Infrastructure | + `manage_campus`, `manage_departments`, `manage_users`, `assign_roles` | 4 |
| **Super Administrator** | University Board, Chief Information Security Officer | + `manage_institution` | 2 |

### Privilege Self-Elevation Guardrails
- Users cannot assign roles exceeding their current privilege rank.
- Users cannot modify their own institutional roles (prevents unauthorized privilege self-elevation).
- Email addresses and Student/Faculty IDs (`VDIT-CS-2024-042`) are strictly bound to official university credentials.

---

## 4. API Endpoints

### Personal Profile & Authentication
- `GET /api/v1/iam/profile`: Retrieves current authenticated user's profile with institutional metadata.
- `PUT /api/v1/iam/profile`: Updates editable fields (`full_name`, `phone_number`, `designation`, `avatar_url`).
- `POST /api/v1/iam/password/change`: Verifies existing password and updates password hash.

### Institutional Hierarchy
- `GET /api/v1/alerts/hierarchy/tree`: Returns the complete institutional tree from KLS down to student/faculty groups.
- `POST /api/v1/iam/departments`: Allows administrators to register new academic departments into campus hierarchy.

### RBAC Governance
- `GET /api/v1/iam/roles/matrix`: Provides complete 7-role definition and permission list.
- `POST /api/v1/iam/roles/assign`: Assigns institutional roles to users with reason tracking and audit trail.

### Sessions & Audit
- `GET /api/v1/iam/sessions`: Lists active device sessions with IP addresses and user agents.
- `DELETE /api/v1/iam/sessions/{session_id}`: Remotely terminates a compromised or inactive session.
- `GET /api/v1/iam/audit-logs`: Fetches the immutable audit history of security events.

---

## 5. UI/UX Design System Compliance

All IAM screens adhere strictly to the **YODHRA Light Theme System**:
- Primary Text: `#202A35`
- Secondary Text: `#64748B`
- Main Background: `#F7F8FA`
- Card Surfaces: `#FFFFFF` with borders `#E5E9ED`
- Brand Primary: `#315E63`
- Brand Secondary: `#397C78`
- Alert Indicators: `#C74747` (Red Alert), `#C58A35` (Elevated), `#27845A` (Secure / Active)

