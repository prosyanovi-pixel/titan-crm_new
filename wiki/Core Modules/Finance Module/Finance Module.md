# Finance Module

<cite>
**Referenced Files in This Document**
- [index.js](file://backend/modules/finance/index.js)
- [schema.js](file://backend/modules/finance/schema.js)
- [invoices/index.js](file://backend/modules/finance/invoices/index.js)
- [invoices/handlers.js](file://backend/modules/finance/invoices/handlers.js)
- [invoices/services.js](file://backend/modules/finance/invoices/services.js)
- [payments.js](file://backend/modules/finance/payments.js)
- [reconciliation.js](file://backend/modules/finance/reconciliation.js)
- [reports.js](file://backend/modules/finance/reports.js)
- [categories.js](file://backend/modules/finance/categories.js)
- [settings.js](file://backend/modules/finance/settings.js)
- [statements.js](file://backend/modules/finance/statements.js)
- [utils.js](file://backend/modules/finance/utils.js)
- [financeSettingsService.js](file://backend/modules/finance/services/financeSettingsService.js)
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
The Finance module provides end-to-end financial management for the CRM, covering:
- Invoicing lifecycle: creation, approval workflows, payment tracking, and status management
- Payment processing: bank statement import, reconciliation, and cash flow tracking
- Financial reporting: receivables, profit & loss, cash flow, and register exports
- Tax compliance: VAT handling, tax regimes, rates, and regulatory reporting
- Integrations: contractor management, project tracking, and accounting systems

## Project Structure
The Finance module is organized around domain-focused submodules under backend/modules/finance:
- Submodule routers: invoices, payments, categories, statements, reports, reconciliation, settings, projects, calendar, workflow
- Shared utilities: date parsing, number conversion, and invoice status computation
- Schema initialization and migration support for finance-related tables
- Controllers and services for settings and statement reconciliation

```mermaid
graph TB
FinanceIndex["Finance Index Router<br/>routes all submodules"] --> Invoices["Invoices Router"]
FinanceIndex --> Payments["Payments Router"]
FinanceIndex --> Categories["Categories Router"]
FinanceIndex --> Statements["Statements Router"]
FinanceIndex --> Reports["Reports Router"]
FinanceIndex --> Reconciliation["Reconciliation Router"]
FinanceIndex --> Settings["Settings Router"]
FinanceIndex --> Projects["Projects Router"]
FinanceIndex --> Calendar["Calendar Router"]
Invoices --> Handlers["Invoice Handlers"]
Invoices --> Services["Invoice Services"]
Payments --> Utils["Shared Utils"]
Reports --> Utils
Settings --> SettingsService["Finance Settings Service"]
```

**Diagram sources**
- [index.js:1-55](file://backend/modules/finance/index.js#L1-L55)
- [invoices/index.js:1-40](file://backend/modules/finance/invoices/index.js#L1-L39)
- [payments.js:1-340](file://backend/modules/finance/payments.js#L1-L7)
- [reports.js:1-221](file://backend/modules/finance/reports.js#L1-L221)
- [settings.js:1-55](file://backend/modules/finance/settings.js#L1-L54)
- [statements.js:1-17](file://backend/modules/finance/statements.js#L1-L16)
- [utils.js:1-102](file://backend/modules/finance/utils.js#L1-L102)
- [financeSettingsService.js:1-800](file://backend/modules/finance/services/financeSettingsService.js#L1-L745)

**Section sources**
- [index.js:1-55](file://backend/modules/finance/index.js#L1-L55)

## Core Components
- Invoice Management: CRUD, status automation, document generation, and calendar reminders
- Payment Processing: creation, linking/unlinking from invoices, bulk updates, and automatic invoice recalculation
- Statement Import and Reconciliation: bank statement header and line records, category mapping, contractor identification, and reconciliation actions
- Financial Reporting: receivables aging, P&L, cash flow (DDS), and payment register exports
- Tax Compliance: tax regimes, tax rates, historical rates, allocation methods, overhead articles, and contractor-specific tax validation
- Category Management: income/expense categories with hierarchical structure and filtering
- Settings API: endpoints for tax regimes, rates, allocation methods, overhead articles, and defaults

**Section sources**
- [invoices/index.js:1-40](file://backend/modules/finance/invoices/index.js#L1-L39)
- [invoices/handlers.js:1-571](file://backend/modules/finance/invoices/handlers.js#L1-L481)
- [payments.js:1-340](file://backend/modules/finance/payments.js#L1-L7)
- [reconciliation.js:1-79](file://backend/modules/finance/reconciliation.js#L1-L78)
- [reports.js:1-221](file://backend/modules/finance/reports.js#L1-L221)
- [categories.js:1-86](file://backend/modules/finance/categories.js#L1-L86)
- [settings.js:1-55](file://backend/modules/finance/settings.js#L1-L54)
- [financeSettingsService.js:1-800](file://backend/modules/finance/services/financeSettingsService.js#L1-L745)

## Architecture Overview
The Finance module follows a layered architecture:
- Router layer: exposes REST endpoints for each submodule
- Handler/service layer: encapsulates business logic and orchestrates database queries
- Persistence layer: Postgres tables initialized via schema.js with strong typing and constraints
- Utilities: shared helpers for dates, numbers, and invoice status derivation

```mermaid
graph TB
subgraph "API Layer"
Routers["Routers<br/>invoices, payments, reports, settings, statements"]
end
subgraph "Handlers/Services"
InvoiceHandlers["Invoice Handlers"]
InvoiceServices["Invoice Services"]
PaymentHandlers["Payment Handlers"]
ReportHandlers["Report Handlers"]
SettingsHandlers["Settings Handlers"]
StatementHandlers["Statement Handlers"]
end
subgraph "Persistence"
Schema["Postgres Schema<br/>finance_* tables"]
end
subgraph "Utilities"
Utils["Utils<br/>date/number/status helpers"]
end
Routers --> InvoiceHandlers
Routers --> PaymentHandlers
Routers --> ReportHandlers
Routers --> SettingsHandlers
Routers --> StatementHandlers
InvoiceHandlers --> InvoiceServices
InvoiceHandlers --> Utils
PaymentHandlers --> Utils
ReportHandlers --> Utils
SettingsHandlers --> Utils
InvoiceHandlers --> Schema
PaymentHandlers --> Schema
ReportHandlers --> Schema
SettingsHandlers --> Schema
StatementHandlers --> Schema
```

**Diagram sources**
- [index.js:1-55](file://backend/modules/finance/index.js#L1-L55)
- [invoices/handlers.js:1-571](file://backend/modules/finance/invoices/handlers.js#L1-L481)
- [invoices/services.js:1-239](file://backend/modules/finance/invoices/services.js#L1-L239)
- [payments.js:1-340](file://backend/modules/finance/payments.js#L1-L7)
- [reports.js:1-221](file://backend/modules/finance/reports.js#L1-L221)
- [settings.js:1-55](file://backend/modules/finance/settings.js#L1-L54)
- [statements.js:1-17](file://backend/modules/finance/statements.js#L1-L16)
- [utils.js:1-102](file://backend/modules/finance/utils.js#L1-L102)
- [schema.js:1-201](file://backend/modules/finance/schema.js#L1-L200)

## Detailed Component Analysis

### Invoicing System
The invoicing system supports full lifecycle management:
- Creation with automatic numbering, initial status, VAT fields, and optional calendar reminder
- Updates with manual override and automatic status recalculation
- Sending (status update) and document generation (invoice factura/act)
- Bulk updates and deletion with cascade handling
- Status automation based on amounts paid and due date

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "Invoices Router"
participant Handler as "Invoice Handlers"
participant Service as "Invoice Services"
participant DB as "Postgres Schema"
Client->>Router : POST /finance/invoices
Router->>Handler : create(req)
Handler->>DB : insert finance_invoices
Handler->>Service : upsertCalendarEventForInvoice()
Service->>DB : insert/update calendar_events
Handler-->>Client : 201 Created (invoice)
Client->>Router : PUT /finance/invoices/ : id
Router->>Handler : update(req)
Handler->>DB : update finance_invoices
Handler->>Service : recalculateInvoice()
Service->>DB : compute status/amounts
Handler-->>Client : 200 OK (invoice)
Client->>Router : POST /finance/invoices/ : id/send
Router->>Handler : send(req)
Handler->>DB : update status
Handler-->>Client : 200 OK (invoice)
```

**Diagram sources**
- [invoices/index.js:18-31](file://backend/modules/finance/invoices/index.js#L18-L31)
- [invoices/handlers.js:62-142](file://backend/modules/finance/invoices/handlers.js#L62-L142)
- [invoices/handlers.js:148-284](file://backend/modules/finance/invoices/handlers.js#L148-L284)
- [invoices/handlers.js:286-330](file://backend/modules/finance/invoices/handlers.js#L286-L330)
- [invoices/services.js:83-133](file://backend/modules/finance/invoices/services.js#L83-L133)

Practical examples:
- Creating an invoice with VAT and generating an act after full payment
- Bulk updating statuses for overdue invoices
- Recalculating status after manual payment adjustments

**Section sources**
- [invoices/index.js:1-40](file://backend/modules/finance/invoices/index.js#L1-L39)
- [invoices/handlers.js:1-571](file://backend/modules/finance/invoices/handlers.js#L1-L481)
- [invoices/services.js:1-239](file://backend/modules/finance/invoices/services.js#L1-L239)
- [utils.js:42-93](file://backend/modules/finance/utils.js#L42-L93)

### Payment Processing and Reconciliation
Payments are linked to invoices and projects, tracked by categories, and automatically recalculate invoice balances. Reconciliation endpoints produce contractor-specific statements.

```mermaid
sequenceDiagram
participant Client as "Client"
participant PaymentsRouter as "Payments Router"
participant PaymentsHandler as "Payments Handler"
participant InvoiceService as "Invoice Services"
participant DB as "Postgres Schema"
Client->>PaymentsRouter : POST /payments
PaymentsRouter->>PaymentsHandler : create(req)
PaymentsHandler->>DB : insert finance_payments
alt invoiceId present
PaymentsHandler->>InvoiceService : recalculateInvoice(invoiceId)
InvoiceService->>DB : update status/amounts
end
PaymentsHandler-->>Client : 201 Created (payment)
Client->>PaymentsRouter : PUT /payments/ : id
PaymentsRouter->>PaymentsHandler : update(req)
PaymentsHandler->>DB : update finance_payments
alt invoiceId changed
PaymentsHandler->>InvoiceService : recalculateInvoice(old/new)
end
PaymentsHandler-->>Client : 200 OK (payment)
Client->>PaymentsRouter : GET /finance/reconciliation-act/ : contractorId
PaymentsRouter->>PaymentsHandler : get contractor statement
PaymentsHandler->>DB : select invoices/payments
PaymentsHandler-->>Client : JSON statement
```

**Diagram sources**
- [payments.js:77-132](file://backend/modules/finance/payments.js#L7)
- [payments.js:134-204](file://backend/modules/finance/payments.js#L7)
- [payments.js:206-266](file://backend/modules/finance/payments.js#L7)
- [reconciliation.js:11-76](file://backend/modules/finance/reconciliation.js#L11-L76)
- [invoices/services.js:83-133](file://backend/modules/finance/invoices/services.js#L83-L133)

Practical examples:
- Linking incoming bank transfers to invoices via reconciliation
- Unlinking payments from invoices and resetting reconciliation status
- Generating contractor statements for external reporting

**Section sources**
- [payments.js:1-340](file://backend/modules/finance/payments.js#L1-L7)
- [reconciliation.js:1-79](file://backend/modules/finance/reconciliation.js#L1-L78)

### Financial Reporting
The module provides several built-in reports:
- Receivables aging grouped by contractor/project
- Profit & Loss by category with income/expense totals
- Cash flow (DDS) summary by category kind
- Payment register export with filters

```mermaid
flowchart TD
Start(["Report Request"]) --> Choose["Select Report Type"]
Choose --> Receivables["Receivables Aging"]
Choose --> PnL["Profit & Loss"]
Choose --> DDS["Cash Flow (DDS)"]
Choose --> Register["Payment Register Export"]
Receivables --> Group["Group By Options"]
Group --> Summarize["Aggregate Totals & Overdue Stats"]
Summarize --> Output["JSON Response"]
PnL --> ByCat["Group By Category"]
ByCat --> CalcTotals["Compute Income/Expense/Profit"]
CalcTotals --> Output
DDS --> Sum["Sum by Kind & Category"]
Sum --> Output
Register --> Filter["Apply Filters (date/kind/project/contractor)"]
Filter --> Output
```

**Diagram sources**
- [reports.js:10-91](file://backend/modules/finance/reports.js#L10-L91)
- [reports.js:93-146](file://backend/modules/finance/reports.js#L93-L146)
- [reports.js:148-175](file://backend/modules/finance/reports.js#L148-L175)
- [reports.js:177-218](file://backend/modules/finance/reports.js#L177-L218)

Practical examples:
- Exporting a P&L report filtered by project and date range
- Generating a receivables aging report grouped by contractor
- Producing a cash flow summary for board review

**Section sources**
- [reports.js:1-221](file://backend/modules/finance/reports.js#L1-L221)

### Tax Compliance System
The tax system manages regimes, rates, and contractor eligibility:
- Tax regimes with flags for VAT, profit tax, USN, insurance, NDFL, validity periods, and limits
- Tax rates per regime with fixed or percentage-based calculation, effective dates, and legal forms
- Validation of contractor eligibility against regime constraints
- Allocation methods and overhead articles for cost distribution
- Historical rate tracking per regime

```mermaid
classDiagram
class TaxRegime {
+number id
+string code
+string name
+boolean hasVat
+boolean hasProfitTax
+boolean hasUsnTax
+boolean hasInsurance
+boolean hasNdfl
+float defaultVatRate
+float defaultProfitTaxRate
+float defaultUsnRate
+float defaultInsuranceRate
+float defaultNdflRate
+string[] appliesToLegalForms
+date validFrom
+date validTo
+boolean requiresNds
+number maxIncomeLimit
+number maxEmployeesLimit
+boolean requiresOnlineCashier
}
class TaxRate {
+number id
+number taxRegimeId
+string taxType
+string name
+boolean isFixed
+float fixedAmount
+float minBase
+float maxBase
+boolean isActive
+float rate
+date effectiveFrom
+date effectiveTo
+float rateValue
+date appliesFrom
+boolean isDefault
+string[] legalForms
}
class AllocationMethod {
+number id
+string code
+string name
+string description
+string allocationBase
+boolean isActive
}
class OverheadArticle {
+number id
+number parentId
+string code
+string name
+string description
+string articleType
+number allocationMethodId
+boolean isDirect
+boolean isActive
+number defaultAmount
+number priority
}
TaxRegime "1" o-- "many" TaxRate : "has rates"
AllocationMethod "1" o-- "many" OverheadArticle : "used by"
```

**Diagram sources**
- [financeSettingsService.js:69-195](file://backend/modules/finance/services/financeSettingsService.js#L69-L195)
- [financeSettingsService.js:229-359](file://backend/modules/finance/services/financeSettingsService.js#L229-L359)
- [financeSettingsService.js:636-689](file://backend/modules/finance/services/financeSettingsService.js#L636-L689)
- [financeSettingsService.js:694-800](file://backend/modules/finance/services/financeSettingsService.js#L694-L745)

Practical examples:
- Validating a contractor’s eligibility for a tax regime based on legal form and thresholds
- Calculating tax burden for a contractor over a period
- Managing historical tax rates for regulatory audits

**Section sources**
- [settings.js:11-52](file://backend/modules/finance/settings.js#L11-L52)
- [financeSettingsService.js:1-800](file://backend/modules/finance/services/financeSettingsService.js#L1-L745)

### Bank Statement Import and Reconciliation
Statement import creates headers and lines with optional contractor and category inference. Lines can be matched to invoices or payments and reconciled.

```mermaid
sequenceDiagram
participant Client as "Client"
participant StatementsRouter as "Statements Router"
participant StatementHandlers as "Statement Handlers"
participant DB as "Postgres Schema"
Client->>StatementsRouter : Upload CSV/Downloaded Statement
StatementsRouter->>StatementHandlers : processImport()
StatementHandlers->>DB : insert finance_bank_statements
StatementHandlers->>DB : insert finance_statement_lines
StatementHandlers-->>Client : Import OK
Client->>StatementsRouter : Match Line to Invoice/Payment
StatementsRouter->>StatementHandlers : reconcileLine()
StatementHandlers->>DB : update reconcile_status
StatementHandlers-->>Client : Reconciled
```

**Diagram sources**
- [statements.js:1-17](file://backend/modules/finance/statements.js#L1-L16)
- [schema.js:142-196](file://backend/modules/finance/schema.js#L142-L196)

Note: The statement import pipeline is exposed via the statements router and leverages the schema-defined tables for headers and lines.

**Section sources**
- [schema.js:142-196](file://backend/modules/finance/schema.js#L142-L196)
- [statements.js:1-17](file://backend/modules/finance/statements.js#L1-L16)

### Category Management
Categories classify income and expenses with hierarchical support and filtering by kind.

```mermaid
flowchart TD
Start(["Category Request"]) --> List["GET /categories?kind=..."]
Start --> Create["POST /categories"]
Start --> Update["PUT /categories/:id"]
Start --> Delete["DELETE /categories/:id"]
List --> Query["SELECT from finance_expense_categories"]
Query --> Output["JSON categories"]
Create --> Insert["INSERT category"]
Insert --> Output
Update --> Modify["UPDATE category"]
Modify --> Output
Delete --> Check["Check is_system"]
Check --> |allowed| Remove["DELETE category"]
Check --> |blocked| Error["400 Cannot delete system"]
```

**Diagram sources**
- [categories.js:9-83](file://backend/modules/finance/categories.js#L9-L83)
- [schema.js:104-128](file://backend/modules/finance/schema.js#L104-L128)

**Section sources**
- [categories.js:1-86](file://backend/modules/finance/categories.js#L1-L86)
- [schema.js:104-128](file://backend/modules/finance/schema.js#L104-L128)

## Dependency Analysis
- Router dependencies: Each submodule router depends on handlers/services and the shared schema initializer
- Business logic dependencies: Handlers depend on services and utils; services depend on db queries and utils
- Tax settings dependencies: Settings handlers depend on financeSettingsService for regime/rate operations
- Data model dependencies: All modules rely on schema.js for table definitions and migrations

```mermaid
graph LR
Index["Finance Index"] --> Invoices["Invoices Router"]
Index --> Payments["Payments Router"]
Index --> Reports["Reports Router"]
Index --> Settings["Settings Router"]
Index --> Statements["Statements Router"]
Invoices --> Handlers["Invoice Handlers"]
Invoices --> Services["Invoice Services"]
Payments --> Utils["Utils"]
Reports --> Utils
Settings --> SettingsService["Finance Settings Service"]
Handlers --> DB["Postgres Schema"]
Services --> DB
Payments --> DB
Reports --> DB
SettingsService --> DB
```

**Diagram sources**
- [index.js:1-55](file://backend/modules/finance/index.js#L1-L55)
- [invoices/handlers.js:1-571](file://backend/modules/finance/invoices/handlers.js#L1-L481)
- [invoices/services.js:1-239](file://backend/modules/finance/invoices/services.js#L1-L239)
- [payments.js:1-340](file://backend/modules/finance/payments.js#L1-L7)
- [reports.js:1-221](file://backend/modules/finance/reports.js#L1-L221)
- [settings.js:1-55](file://backend/modules/finance/settings.js#L1-L54)
- [financeSettingsService.js:1-800](file://backend/modules/finance/services/financeSettingsService.js#L1-L745)
- [schema.js:1-201](file://backend/modules/finance/schema.js#L1-L200)

**Section sources**
- [index.js:1-55](file://backend/modules/finance/index.js#L1-L55)
- [schema.js:1-201](file://backend/modules/finance/schema.js#L1-L200)

## Performance Considerations
- Use filtered queries with indexed columns (e.g., payment_date, invoice_id, contractor_id)
- Batch operations for bulk updates to minimize round-trips
- Denormalized derived fields (amount_due, status) reduce runtime computations
- Prefer server-side aggregation for reports to avoid large client-side processing
- Cache frequently accessed tax regimes and rates where appropriate

## Troubleshooting Guide
Common issues and resolutions:
- Invoice status not updating: Trigger manual recalculation endpoint or ensure payment updates occur after invoice creation
- Payment unlinking fails: Verify the payment exists and that reconciliation lines are cleared
- Report discrepancies: Confirm date filters and grouping keys; ensure categories are properly assigned
- Tax regime validation errors: Check contractor legal form, income/employee thresholds, and regime validity dates

Operational checks:
- Validate schema readiness via ensureSchema middleware
- Inspect logs for handler errors and service exceptions
- Confirm unique constraints for identifiers and payment linkage

**Section sources**
- [invoices/handlers.js:336-347](file://backend/modules/finance/invoices/handlers.js#L336-L347)
- [payments.js:229-266](file://backend/modules/finance/payments.js#L7)
- [reports.js:10-221](file://backend/modules/finance/reports.js#L10-L221)
- [financeSettingsService.js:424-475](file://backend/modules/finance/services/financeSettingsService.js#L424-L475)

## Conclusion
The Finance module offers a robust foundation for managing invoices, payments, statements, reporting, and tax compliance. Its modular design, strong schema, and utility functions enable scalable financial operations integrated with contractor and project tracking.

## Appendices

### Data Model Overview
Key tables and relationships:
- finance_invoices: invoice lifecycle and derived fields
- finance_payments: income/expense entries linked to invoices/projects/tasks
- finance_expense_categories: income/expense classification
- finance_bank_statements and finance_statement_lines: statement import and reconciliation
- finance_invoice_status: predefined statuses
- finance_tax_regimes and finance_tax_rates: tax configuration and history
- finance_invoice_documents: generated documents tied to invoices

```mermaid
erDiagram
FINANCE_INVOICE_STATUS {
text id PK
text name
text color
integer displayorder
}
FINANCE_INVOICES {
text id PK
text identifier UK
integer contractor_id
integer project_id
text lawyer_user_id
text source_task_id
text title
text description
text currency
numeric amount_total
numeric amount_paid
numeric amount_due
date issue_date
date due_date
text status
text calendar_event_id
text created_by
text updated_by
timestamptz created_at
timestamptz updated_at
numeric vat_rate
numeric vat_amount
boolean is_taxable
}
FINANCE_PAYMENTS {
text id PK
text kind
text invoice_id FK
integer project_id
integer contractor_id
text task_id
numeric amount
text currency
date payment_date
text method
text comment
text category_id
text created_by
timestamptz created_at
}
FINANCE_EXPENSE_CATEGORIES {
text id PK
text name
text kind
text parent_id FK
text color
boolean is_system
timestamptz created_at
}
FINANCE_BANK_STATEMENTS {
text id PK
text file_name
text import_type
text account
date date_from
date date_to
numeric total_credit
numeric total_debit
text status
text imported_by
timestamptz created_at
}
FINANCE_STATEMENT_LINES {
text id PK
text statement_id FK
date line_date
numeric amount
text direction
text counterparty
text purpose
text reference
text invoice_id FK
text payment_id FK
text reconcile_status
timestamptz created_at
integer contractor_id
text counterparty_inn
text account_number
text category_id
}
FINANCE_INVOICES ||--o{ FINANCE_PAYMENTS : "links to"
FINANCE_INVOICES }o--|| FINANCE_INVOICE_STATUS : "has status"
FINANCE_INVOICES }o--|| FINANCE_EXPENSE_CATEGORIES : "vat category"
FINANCE_BANK_STATEMENTS ||--o{ FINANCE_STATEMENT_LINES : "contains"
FINANCE_STATEMENT_LINES }o--|| FINANCE_INVOICES : "may match"
FINANCE_STATEMENT_LINES }o--|| FINANCE_PAYMENTS : "may match"
```

**Diagram sources**
- [schema.js:12-197](file://backend/modules/finance/schema.js#L12-L197)