# Legal Cases Tables

<cite>
**Referenced Files in This Document**
- [05_create_legal_cases_table.md](file://backend/migrations/05_create_legal_cases_table.md)
- [31_fix_legal_cases_comprehensive.md](file://backend/migrations/31_fix_legal_cases_comprehensive.md)
- [44_add_description_to_legal_cases.md](file://backend/migrations/44_add_description_to_legal_cases.md)
- [46_add_missing_case_tables.md](file://backend/migrations/46_add_missing_case_tables.md)
- [60_create_courts_and_judges_tables.md](file://backend/migrations/60_create_courts_and_judges_tables.md)
- [63_create_case_outcome_table.sql](file://backend/migrations/63_create_case_outcome_table.sql)
- [101_create_workflow_tables.sql](file://backend/migrations/101_create_workflow_tables.sql)
- [102_create_audit_log_table.sql](file://backend/migrations/102_create_audit_log_table.sql)
- [108_add_updated_at_to_legal_cases.sql](file://backend/migrations/108_add_updated_at_to_legal_cases.sql)
- [200_case_instances_and_relations.sql](file://backend/migrations/200_case_instances_and_relations.sql)
- [README.md](file://backend/modules/legal_cases/README.md)
- [cases.js](file://backend/modules/legal_cases/services/cases.js)
- [instances.js](file://backend/modules/legal_cases/services/instances.js)
- [updates.js](file://backend/modules/legal_cases/services/updates.js)
- [cases.js](file://backend/modules/legal_cases/controllers/cases.js)
- [instances.js](file://backend/modules/legal_cases/controllers/instances.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the legal cases module database schema and related systems. It focuses on the case lifecycle tables (case instances, case updates, court/judge entities, case outcomes), complex relationships among legal entities, case documents, and procedural history. It also explains case instance management, update tracking, automated workflow triggers, audit trails, and practical query patterns for joins across multiple tables.

## Project Structure
The legal cases domain spans migrations that define the relational schema and a backend module that implements controllers, services, utilities, and workflows.

```mermaid
graph TB
subgraph "Migrations"
M05["05_create_legal_cases_table.md"]
M31["31_fix_legal_cases_comprehensive.md"]
M44["44_add_description_to_legal_cases.md"]
M46["46_add_missing_case_tables.md"]
M60["60_create_courts_and_judges_tables.md"]
M63["63_create_case_outcome_table.sql"]
M101["101_create_workflow_tables.sql"]
M102["102_create_audit_log_table.sql"]
M108["108_add_updated_at_to_legal_cases.sql"]
M200["200_case_instances_and_relations.sql"]
end
subgraph "Module: Legal Cases"
C_README["README.md"]
C_CONTROLLERS["controllers/*"]
C_SERVICES["services/*"]
C_UTILS["utils/*"]
end
M05 --> C_SERVICES
M31 --> C_SERVICES
M44 --> C_SERVICES
M46 --> C_SERVICES
M60 --> C_SERVICES
M63 --> C_SERVICES
M101 --> C_SERVICES
M102 --> C_SERVICES
M108 --> C_SERVICES
M200 --> C_SERVICES
C_README --> C_CONTROLLERS
C_CONTROLLERS --> C_SERVICES
C_SERVICES --> C_UTILS
```

**Diagram sources**
- [05_create_legal_cases_table.md:1-130](file://backend/migrations/05_create_legal_cases_table.md#L1-L130)
- [31_fix_legal_cases_comprehensive.md:1-314](file://backend/migrations/31_fix_legal_cases_comprehensive.md#L1-L313)
- [44_add_description_to_legal_cases.md:1-26](file://backend/migrations/44_add_description_to_legal_cases.md#L1-L25)
- [46_add_missing_case_tables.md:1-38](file://backend/migrations/46_add_missing_case_tables.md#L1-L37)
- [60_create_courts_and_judges_tables.md:1-47](file://backend/migrations/60_create_courts_and_judges_tables.md#L1-L46)
- [63_create_case_outcome_table.sql:1-23](file://backend/migrations/63_create_case_outcome_table.sql#L1-L22)
- [101_create_workflow_tables.sql:1-54](file://backend/migrations/101_create_workflow_tables.sql#L1-L53)
- [102_create_audit_log_table.sql:1-21](file://backend/migrations/102_create_audit_log_table.sql#L1-L20)
- [108_add_updated_at_to_legal_cases.sql:1-36](file://backend/migrations/108_add_updated_at_to_legal_cases.sql#L1-L35)
- [200_case_instances_and_relations.sql:1-41](file://backend/migrations/200_case_instances_and_relations.sql#L1-L40)
- [README.md:1-299](file://backend/modules/legal_cases/README.md#L1-L298)

**Section sources**
- [README.md:1-299](file://backend/modules/legal_cases/README.md#L1-L298)

## Core Components
- Legal case master record: stores core case metadata and computed timestamps.
- Case instances: per-case procedural stages (first instance, appeal, cassation, supervision).
- Case updates: lightweight notifications/tracking for case record changes.
- Courts and judges: reference entities linked to case instances.
- Case outcomes: customizable outcomes with color and ordering.
- Supporting entities: documents, events (timeline), third parties, financial details, notes, and attachments.
- Audit log: centralized audit trail for user actions.
- Workflows: engine to trigger automated actions on events or schedules.

Key schema anchors:
- legal_cases
- case_instances
- case_record_updates
- courts, judges
- case_outcome
- case_documents, case_events, case_third_parties, case_financial_details, case_notes, case_note_attachments

**Section sources**
- [05_create_legal_cases_table.md:8-25](file://backend/migrations/05_create_legal_cases_table.md#L8-L25)
- [31_fix_legal_cases_comprehensive.md:200-235](file://backend/migrations/31_fix_legal_cases_comprehensive.md#L200-L235)
- [44_add_description_to_legal_cases.md:8-17](file://backend/migrations/44_add_description_to_legal_cases.md#L8-L17)
- [46_add_missing_case_tables.md:8-31](file://backend/migrations/46_add_missing_case_tables.md#L8-L31)
- [60_create_courts_and_judges_tables.md:14-30](file://backend/migrations/60_create_courts_and_judges_tables.md#L14-L30)
- [63_create_case_outcome_table.sql:4-13](file://backend/migrations/63_create_case_outcome_table.sql#L4-L13)
- [102_create_audit_log_table.sql:4-15](file://backend/migrations/102_create_audit_log_table.sql#L4-L15)
- [108_add_updated_at_to_legal_cases.sql:6-17](file://backend/migrations/108_add_updated_at_to_legal_cases.sql#L6-L17)
- [200_case_instances_and_relations.sql:6-18](file://backend/migrations/200_case_instances_and_relations.sql#L6-L18)

## Architecture Overview
The legal cases module integrates:
- Controllers expose REST endpoints for CRUD and update management.
- Services encapsulate business logic and orchestrate DB writes, including cascading updates and timeline events.
- Utilities handle normalization, extraction, relation hydration, and table provisioning.
- Workflows and audit logs provide automation and compliance.

```mermaid
graph TB
Client["Client"]
CtrlCases["controllers/cases.js"]
SvcCases["services/cases.js"]
SvcInstances["services/instances.js"]
SvcUpdates["services/updates.js"]
DB["PostgreSQL Schema"]
Client --> CtrlCases
CtrlCases --> SvcCases
CtrlCases --> SvcUpdates
SvcCases --> DB
SvcInstances --> DB
SvcUpdates --> DB
DB --> SvcCases
DB --> SvcInstances
DB --> SvcUpdates
```

**Diagram sources**
- [cases.js:1-299](file://backend/modules/legal_cases/controllers/cases.js#L1-L299)
- [cases.js:1-686](file://backend/modules/legal_cases/services/cases.js#L1-L686)
- [instances.js:1-160](file://backend/modules/legal_cases/services/instances.js#L1-L159)
- [updates.js:1-179](file://backend/modules/legal_cases/services/updates.js#L1-L178)

## Detailed Component Analysis

### Case Lifecycle Tables and Relationships
The lifecycle centers around legal_cases and its related entities. Case instances segment the procedural history, while updates track notable changes. Courts and judges provide institutional context. Outcomes categorize results. Supporting entities capture documents, events, third parties, financials, and notes.

```mermaid
erDiagram
LEGAL_CASES {
varchar id PK
varchar type
varchar title
varchar case_number
varchar lawyer_id
varchar lawyer_name
varchar plaintiff
varchar defendant
varchar court_name
varchar judge
varchar status
varchar creation_date
varchar start_date
varchar deadline
decimal price
text description
timestamp updated_at
}
CASE_INSTANCES {
varchar id PK
varchar case_id FK
varchar instance_type
varchar instance_number
varchar court_name
varchar judge
varchar status
boolean is_active
timestamp creation_date
timestamp updated_at
}
CASE_RECORD_UPDATES {
varchar id PK
varchar case_id FK
varchar lawyer_id
varchar update_type
varchar title
text description
boolean is_viewed
timestamp created_at
timestamp viewed_at
varchar viewed_by
}
COURTS {
varchar id PK
varchar name
text address
timestamptz created_at
timestamptz updated_at
}
JUDGES {
varchar id PK
varchar name
varchar court_id FK
timestamptz created_at
timestamptz updated_at
}
CASE_OUTCOME {
varchar id PK
varchar name UK
varchar color
integer display_order
text description
boolean is_active
timestamp created_at
timestamp updated_at
}
CASE_DOCUMENTS {
varchar id PK
varchar case_id FK
varchar instance_id FK
varchar name
varchar type
varchar date
varchar size
varchar author
}
CASE_EVENTS {
varchar id PK
varchar case_id FK
varchar instance_id FK
varchar date
varchar type
varchar title
text description
varchar author
}
CASE_THIRD_PARTIES {
varchar id PK
varchar case_id FK
varchar name
varchar role
}
CASE_FINANCIAL_DETAILS {
integer id PK
varchar case_id FK
decimal claim_amount
varchar claim_currency
decimal state_duty
decimal expertise_cost
decimal other_claim_costs
decimal recovered_amount
varchar recovered_currency
decimal enforcement_fee
decimal execution_costs
decimal transport_expenses
decimal translation_expenses
decimal other_expenses
}
CASE_NOTES {
varchar id PK
varchar case_id FK
varchar author
varchar initials
varchar date
text text
boolean is_internal
}
CASE_NOTE_ATTACHMENTS {
varchar id PK
varchar note_id FK
varchar case_id FK
varchar name
varchar url
varchar type
varchar added_at
}
LEGAL_CASES ||--o{ CASE_INSTANCES : "has"
LEGAL_CASES ||--o{ CASE_RECORD_UPDATES : "has"
LEGAL_CASES ||--o{ CASE_DOCUMENTS : "has"
LEGAL_CASES ||--o{ CASE_EVENTS : "has"
LEGAL_CASES ||--o{ CASE_THIRD_PARTIES : "has"
LEGAL_CASES ||--o{ CASE_FINANCIAL_DETAILS : "has"
LEGAL_CASES ||--o{ CASE_NOTES : "has"
CASE_NOTES ||--o{ CASE_NOTE_ATTACHMENTS : "has"
CASE_INSTANCES ||--o{ CASE_DOCUMENTS : "documents belong to"
CASE_INSTANCES ||--o{ CASE_EVENTS : "events belong to"
CASE_INSTANCES ||--o{ CASE_NOTES : "notes belong to"
COURTS ||--o{ JUDGES : "contains"
```

**Diagram sources**
- [05_create_legal_cases_table.md:8-130](file://backend/migrations/05_create_legal_cases_table.md#L8-L130)
- [31_fix_legal_cases_comprehensive.md:9-314](file://backend/migrations/31_fix_legal_cases_comprehensive.md#L9-L313)
- [44_add_description_to_legal_cases.md:8-17](file://backend/migrations/44_add_description_to_legal_cases.md#L8-L17)
- [46_add_missing_case_tables.md:8-31](file://backend/migrations/46_add_missing_case_tables.md#L8-L31)
- [60_create_courts_and_judges_tables.md:14-30](file://backend/migrations/60_create_courts_and_judges_tables.md#L14-L30)
- [63_create_case_outcome_table.sql:4-13](file://backend/migrations/63_create_case_outcome_table.sql#L4-L13)
- [200_case_instances_and_relations.sql:6-34](file://backend/migrations/200_case_instances_and_relations.sql#L6-L34)

**Section sources**
- [05_create_legal_cases_table.md:8-130](file://backend/migrations/05_create_legal_cases_table.md#L8-L130)
- [31_fix_legal_cases_comprehensive.md:9-314](file://backend/migrations/31_fix_legal_cases_comprehensive.md#L9-L313)
- [46_add_missing_case_tables.md:8-31](file://backend/migrations/46_add_missing_case_tables.md#L8-L31)
- [60_create_courts_and_judges_tables.md:14-30](file://backend/migrations/60_create_courts_and_judges_tables.md#L14-L30)
- [63_create_case_outcome_table.sql:4-13](file://backend/migrations/63_create_case_outcome_table.sql#L4-L13)
- [200_case_instances_and_relations.sql:6-34](file://backend/migrations/200_case_instances_and_relations.sql#L6-L34)

### Case Instance Management System
- Instances are created per case with an instance type and number, and can be flagged as active.
- Setting a new instance as active automatically deactivates others for the same case.
- Instances are linked to documents, events, and notes via instance_id, enabling per-instance procedural history.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "controllers/instances.js"
participant SvcInst as "services/instances.js"
participant SvcCases as "services/cases.js"
participant DB as "PostgreSQL"
Client->>Ctrl : POST /api/legal-cases/ : id/instances
Ctrl->>SvcInst : createInstance({caseId, instanceType, instanceNumber,...})
SvcInst->>DB : INSERT case_instances (deactivate others if is_active)
DB-->>SvcInst : instance row
SvcInst-->>Ctrl : instance
Ctrl->>SvcCases : addCaseEvent(..., instance_id)
SvcCases->>DB : INSERT case_events
Ctrl-->>Client : 201 Created
```

**Diagram sources**
- [instances.js:33-67](file://backend/modules/legal_cases/controllers/instances.js#L33-L67)
- [instances.js:37-67](file://backend/modules/legal_cases/services/instances.js#L37-L67)
- [cases.js:655-676](file://backend/modules/legal_cases/services/cases.js#L655-L676)

**Section sources**
- [instances.js:14-160](file://backend/modules/legal_cases/services/instances.js#L14-L159)
- [instances.js:19-123](file://backend/modules/legal_cases/controllers/instances.js#L19-L122)
- [200_case_instances_and_relations.sql:6-18](file://backend/migrations/200_case_instances_and_relations.sql#L6-L18)

### Update Tracking Mechanisms
- Updates are lightweight notifications stored in case_record_updates.
- On case status change, a notification and a timeline event are created.
- Users can mark updates as viewed individually or in bulk.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "controllers/cases.js"
participant SvcUpd as "services/updates.js"
participant SvcCases as "services/cases.js"
participant DB as "PostgreSQL"
Client->>Ctrl : PUT /api/legal-cases/ : id
Ctrl->>SvcCases : updateCase(...)
SvcCases->>SvcUpd : createCaseUpdate({case_id, lawyer_id, title, description})
SvcUpd->>DB : INSERT case_record_updates
SvcCases->>DB : INSERT case_events (status change)
Client->>Ctrl : POST /api/legal-cases/ : id/updates/mark-viewed
Ctrl->>SvcUpd : markAllCaseUpdatesAsViewed(case_id, user_id)
SvcUpd->>DB : UPDATE case_record_updates SET is_viewed=true
Ctrl-->>Client : 200 OK
```

**Diagram sources**
- [cases.js:322-362](file://backend/modules/legal_cases/services/cases.js#L322-L362)
- [updates.js:93-122](file://backend/modules/legal_cases/services/updates.js#L93-L122)
- [updates.js:65-86](file://backend/modules/legal_cases/services/updates.js#L65-L86)
- [cases.js:112-162](file://backend/modules/legal_cases/controllers/cases.js#L112-L162)
- [cases.js:197-219](file://backend/modules/legal_cases/controllers/cases.js#L197-L219)

**Section sources**
- [updates.js:1-179](file://backend/modules/legal_cases/services/updates.js#L1-L178)
- [cases.js:322-362](file://backend/modules/legal_cases/services/cases.js#L322-L362)

### Automated Workflow Triggers
- Workflows are defined in workflows, workflow_steps, workflow_executions, and workflow_execution_logs.
- Modules can register actions (e.g., legal_case) and configure triggers (schedule, event, webhook).
- The engine supports delays, retry policies, and step-level logging.

```mermaid
flowchart TD
Start(["Workflow Trigger"]) --> LoadCfg["Load workflow config"]
LoadCfg --> Steps["Execute ordered steps"]
Steps --> StepExec["Run action in step<br/>with delay and retry policy"]
StepExec --> Logs["Record execution logs"]
Logs --> NextStep{"More steps?"}
NextStep --> |Yes| Steps
NextStep --> |No| Complete(["Complete"])
```

**Diagram sources**
- [101_create_workflow_tables.sql:4-54](file://backend/migrations/101_create_workflow_tables.sql#L4-L53)

**Section sources**
- [101_create_workflow_tables.sql:1-54](file://backend/migrations/101_create_workflow_tables.sql#L1-L53)

### Audit Trail System
- audit_log captures user actions with entity context, old/new data snapshots, IP, and user agent.
- Indexed for efficient filtering by user, entity, and time.

```mermaid
flowchart TD
Op["User Operation"] --> Audit["Write audit_log row"]
Audit --> Indexes["Indexes by user_id, entity, created_at"]
Indexes --> Reports["Audit reports and compliance checks"]
```

**Diagram sources**
- [102_create_audit_log_table.sql:4-21](file://backend/migrations/102_create_audit_log_table.sql#L4-L20)

**Section sources**
- [102_create_audit_log_table.sql:1-21](file://backend/migrations/102_create_audit_log_table.sql#L1-L20)

### Procedural History and Timeline
- case_events serves as the timeline for a case or a specific instance.
- Adding an instance creates a timeline event; updating instance data adds another event.
- Documents and notes can be associated with an instance to reflect stage-specific activity.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "controllers/instances.js"
participant SvcCases as "services/cases.js"
participant DB as "PostgreSQL"
Client->>Ctrl : POST /api/legal-cases/ : id/instances
Ctrl->>SvcCases : addCaseEvent(title="New Instance", instance_id)
SvcCases->>DB : INSERT case_events
Client->>Ctrl : PATCH /api/legal-cases/instances/ : instanceId
Ctrl->>SvcCases : addCaseEvent(title="Instance Updated", instance_id)
SvcCases->>DB : INSERT case_events
```

**Diagram sources**
- [instances.js:50-94](file://backend/modules/legal_cases/controllers/instances.js#L50-L94)
- [cases.js:655-676](file://backend/modules/legal_cases/services/cases.js#L655-L676)

**Section sources**
- [instances.js:19-123](file://backend/modules/legal_cases/controllers/instances.js#L19-L122)
- [cases.js:655-676](file://backend/modules/legal_cases/services/cases.js#L655-L676)

### Data Integrity Constraints
- Foreign keys enforce referential integrity:
  - case_instances.case_id → legal_cases.id (CASCADE DELETE)
  - case_documents.instance_id → case_instances.id (SET NULL)
  - case_events.instance_id → case_instances.id (SET NULL)
  - case_notes.instance_id → case_instances.id (SET NULL)
  - case_third_parties.case_id → legal_cases.id (CASCADE DELETE)
  - case_financial_details.case_id → legal_cases.id (RESTRICT)
  - case_note_attachments.note_id → case_notes.id (CASCADE)
  - judges.court_id → courts.id (SET NULL)
- Unique constraints:
  - case_outcome.name (UNIQUE)
- Triggers and defaults:
  - legal_cases.updated_at updated on each UPDATE
  - case_instances.created_at/updated_at default timestamps

**Section sources**
- [200_case_instances_and_relations.sql:17-18](file://backend/migrations/200_case_instances_and_relations.sql#L17-L18)
- [200_case_instances_and_relations.sql:21-28](file://backend/migrations/200_case_instances_and_relations.sql#L21-L28)
- [60_create_courts_and_judges_tables.md:24-30](file://backend/migrations/60_create_courts_and_judges_tables.md#L24-L30)
- [63_create_case_outcome_table.sql:6-13](file://backend/migrations/63_create_case_outcome_table.sql#L6-L13)
- [108_add_updated_at_to_legal_cases.sql:19-36](file://backend/migrations/108_add_updated_at_to_legal_cases.sql#L19-L35)

### Examples of Case-Related Queries and Join Patterns
- List a case with hydrated relations and unviewed updates:
  - Join legal_cases with case_instances, case_events, case_documents, case_notes, case_third_parties, case_financial_details.
  - Filter by case_id and optionally by instance_id for per-instance views.
- Find all unviewed updates for a case and exclude updates viewed by a specific user:
  - Select from case_record_updates where case_id = ? and is_viewed = false and (viewed_by is distinct from ? or viewed_by is null).
- Timeline aggregation by instance:
  - Group case_events by instance_id and compute counts or recent dates.
- Outcome lookup:
  - Join legal_cases with case_outcome on outcome field to present readable labels and colors.

[No sources needed since this section provides general guidance]

## Dependency Analysis
- Controllers depend on services and validators.
- Services depend on DB and utilities.
- Migrations define schema dependencies and constraints.
- Workflows and audit logs are orthogonal but integrate with services via triggers and actions.

```mermaid
graph LR
CtrlCases["controllers/cases.js"] --> SvcCases["services/cases.js"]
CtrlInstances["controllers/instances.js"] --> SvcInstances["services/instances.js"]
SvcCases --> DB["PostgreSQL"]
SvcInstances --> DB
SvcUpdates["services/updates.js"] --> DB
Migrations["Schema Migrations"] --> DB
Workflows["workflows*"] --> DB
Audit["audit_log"] --> DB
```

**Diagram sources**
- [cases.js:1-299](file://backend/modules/legal_cases/controllers/cases.js#L1-L299)
- [instances.js:1-123](file://backend/modules/legal_cases/controllers/instances.js#L1-L122)
- [cases.js:1-686](file://backend/modules/legal_cases/services/cases.js#L1-L686)
- [instances.js:1-160](file://backend/modules/legal_cases/services/instances.js#L1-L159)
- [updates.js:1-179](file://backend/modules/legal_cases/services/updates.js#L1-L178)
- [101_create_workflow_tables.sql:1-54](file://backend/migrations/101_create_workflow_tables.sql#L1-L53)
- [102_create_audit_log_table.sql:1-21](file://backend/migrations/102_create_audit_log_table.sql#L1-L20)

**Section sources**
- [cases.js:1-299](file://backend/modules/legal_cases/controllers/cases.js#L1-L299)
- [instances.js:1-123](file://backend/modules/legal_cases/controllers/instances.js#L1-L122)
- [cases.js:1-686](file://backend/modules/legal_cases/services/cases.js#L1-L686)
- [instances.js:1-160](file://backend/modules/legal_cases/services/instances.js#L1-L159)
- [updates.js:1-179](file://backend/modules/legal_cases/services/updates.js#L1-L178)

## Performance Considerations
- Indexes on frequently filtered columns:
  - legal_cases.updated_at
  - case_instances.case_id, instance_id
  - case_documents.instance_id, case_id
  - case_events.instance_id, case_id
  - case_notes.instance_id, case_id
  - audit_log entity and timestamps
- Use selective projections and pagination for large lists.
- Batch operations for notes and attachments to reduce round-trips.
- Denormalized fields (e.g., status labels) can be materialized if needed for reporting.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Case creation fails due to missing support tables:
  - Ensure support tables are provisioned before requests.
- Third-party role column mismatch:
  - The system dynamically detects role/type column; confirm presence of either role or type in case_third_parties.
- Attachment cleanup:
  - Deleting cases removes physical files and DB records; verify file paths and permissions.
- Audit visibility:
  - Confirm indexes exist and queries filter by user/entity/time appropriately.

**Section sources**
- [README.md:186-299](file://backend/modules/legal_cases/README.md#L186-L298)
- [cases.js:19-44](file://backend/modules/legal_cases/services/cases.js#L19-L44)
- [cases.js:600-647](file://backend/modules/legal_cases/services/cases.js#L600-L647)

## Conclusion
The legal cases module establishes a robust, normalized schema supporting complex procedural lifecycles, per-instance documents and events, and extensible outcomes. Services and controllers provide clear separation of concerns, while workflows and audit logs enable automation and compliance. The design balances flexibility with integrity through foreign keys, constraints, and careful indexing.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Appendix A: Case Instance Types and Status Semantics
- Instance types: first, appeal, cassation, supervision.
- Status: internal statuses per instance (e.g., hearings, decision).
- Active instance flag indicates current procedural stage.

**Section sources**
- [200_case_instances_and_relations.sql:9-14](file://backend/migrations/200_case_instances_and_relations.sql#L9-L14)

### Appendix B: Outcome Reference Values
- Default outcomes include won, won_partial, lost with color coding and display order.

**Section sources**
- [63_create_case_outcome_table.sql:16-22](file://backend/migrations/63_create_case_outcome_table.sql#L16-L22)

### Appendix C: Module API Highlights
- Cases: GET/POST/PUT/DELETE with update endpoints.
- Instances: GET/POST/PATCH/DELETE with timeline events.
- Updates: list unviewed, mark viewed, delete single/all.

**Section sources**
- [README.md:59-81](file://backend/modules/legal_cases/README.md#L59-L81)
- [cases.js:181-285](file://backend/modules/legal_cases/controllers/cases.js#L181-L285)
- [instances.js:19-121](file://backend/modules/legal_cases/controllers/instances.js#L19-L121)