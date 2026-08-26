# Migration 05: Create Legal Cases Table

## Description
Create the legal cases table to store legal case information.

## SQL Statement
```sql
CREATE TABLE legal_cases (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    caseNumber VARCHAR(100),
    lawyerId VARCHAR(50),
    lawyerName VARCHAR(255),
    plaintiff VARCHAR(255),
    defendant VARCHAR(255),
    courtName VARCHAR(255),
    judge VARCHAR(255),
    status VARCHAR(50),
    creationDate VARCHAR(50),
    startDate VARCHAR(50),
    deadline VARCHAR(50),
    price DECIMAL(15,2)
);
```

## Columns
- `id` - Unique identifier for the legal case
- `type` - Type of case (court, claim)
- `title` - Case title
- `caseNumber` - Official case number
- `lawyerId` - ID of assigned lawyer
- `lawyerName` - Name of assigned lawyer
- `plaintiff` - Plaintiff name
- `defendant` - Defendant name
- `courtName` - Court name
- `judge` - Judge name
- `status` - Case status
- `creationDate` - Date case was created
- `startDate` - Date case started
- `deadline` - Case deadline
- `price` - Case price/value

## Additional Tables
For storing financial details, events, documents, and notes, additional tables will be needed:

### Case Financial Details Table
```sql
CREATE TABLE case_financial_details (
    id INTEGER PRIMARY KEY,
    caseId VARCHAR(50),
    claimAmount DECIMAL(15,2),
    claimCurrency VARCHAR(3),
    stateDuty DECIMAL(15,2),
    expertiseCost DECIMAL(15,2),
    otherClaimCosts DECIMAL(15,2),
    recoveredAmount DECIMAL(15,2),
    recoveredCurrency VARCHAR(3),
    enforcementFee DECIMAL(15,2),
    executionCosts DECIMAL(15,2),
    transportExpenses DECIMAL(15,2),
    translationExpenses DECIMAL(15,2),
    otherExpenses DECIMAL(15,2),
    FOREIGN KEY (caseId) REFERENCES legal_cases(id)
);
```

### Case Events Table
```sql
CREATE TABLE case_events (
    id VARCHAR(50) PRIMARY KEY,
    caseId VARCHAR(50),
    date VARCHAR(50),
    type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    author VARCHAR(255),
    FOREIGN KEY (caseId) REFERENCES legal_cases(id)
);
```

### Case Documents Table
```sql
CREATE TABLE case_documents (
    id VARCHAR(50) PRIMARY KEY,
    caseId VARCHAR(50),
    name VARCHAR(255),
    type VARCHAR(50),
    date VARCHAR(50),
    size VARCHAR(50),
    author VARCHAR(255),
    FOREIGN KEY (caseId) REFERENCES legal_cases(id)
);
```

### Case Document Comments Table
```sql
CREATE TABLE case_document_comments (
    id VARCHAR(50) PRIMARY KEY,
    documentId VARCHAR(50),
    author VARCHAR(255),
    text TEXT,
    date VARCHAR(50),
    FOREIGN KEY (documentId) REFERENCES case_documents(id)
);
```

### Case Notes Table
```sql
CREATE TABLE case_notes (
    id VARCHAR(50) PRIMARY KEY,
    caseId VARCHAR(50),
    author VARCHAR(255),
    initials VARCHAR(10),
    date VARCHAR(50),
    text TEXT,
    isInternal BOOLEAN,
    FOREIGN KEY (caseId) REFERENCES legal_cases(id)
);
```

### Third Parties Table
```sql
CREATE TABLE case_third_parties (
    id INTEGER PRIMARY KEY,
    caseId VARCHAR(50),
    name VARCHAR(255),
    role VARCHAR(100),
    FOREIGN KEY (caseId) REFERENCES legal_cases(id)
);