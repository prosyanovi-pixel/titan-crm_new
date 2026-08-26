# Migration 06: Create Mail Table

## Description
Create the mail table to store email information.

## SQL Statement
```sql
CREATE TABLE mail (
    id VARCHAR(50) PRIMARY KEY,
    sender VARCHAR(255),
    senderEmail VARCHAR(255),
    avatar VARCHAR(10),
    subject VARCHAR(255),
    preview TEXT,
    content TEXT,
    date VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    label VARCHAR(50)
);
```

## Columns
- `id` - Unique identifier for the email
- `sender` - Sender name
- `senderEmail` - Sender email address
- `avatar` - Avatar initials for the sender
- `subject` - Email subject
- `preview` - Preview text of the email content
- `content` - Full email content
- `date` - Date the email was sent/received
- `read` - Whether the email has been read
- `label` - Email label/category (work, important, etc.)