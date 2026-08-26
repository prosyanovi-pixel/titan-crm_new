# Migration 10: Create Calendar Events Table

## Description
Create the calendar events table to store calendar event information.

## SQL Statement
```sql
CREATE TABLE calendar_events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    end_date DATE,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(50),
    time TIME,
    end_time TIME,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    description TEXT,
    client INTEGER,
    assignee VARCHAR(50),
    notify_client BOOLEAN DEFAULT FALSE,
    client_notify_channel VARCHAR(20),
    client_notify_target VARCHAR(255),
    create_follow_up_task BOOLEAN DEFAULT FALSE,
    notify_assignee BOOLEAN DEFAULT FALSE,
    assignee_notify_channel VARCHAR(20),
    assignee_notify_target VARCHAR(255),
    FOREIGN KEY (client) REFERENCES contractors(id),
    FOREIGN KEY (assignee) REFERENCES users(id)
);

CREATE TABLE calendar_event_notifications (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    value VARCHAR(255) NOT NULL,
    unit VARCHAR(20),
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);
```

## Columns

### Calendar Events Table
- `id` - Unique identifier for the calendar event
- `title` - Event title
- `date` - Event date
- `end_date` - Event end date (optional)
- `type` - Event type (task, project, court, meeting, call, personal)
- `status` - Event status
- `time` - Event start time (for non-all-day events)
- `end_time` - Event end time (for non-all-day events)
- `all_day` - Whether the event is all-day
- `location` - Event location
- `description` - Event description
- `client` - Associated client ID (references contractors.id)
- `assignee` - Assigned user (references users.id)
- `notify_client` - Whether to notify the client
- `client_notify_channel` - Client notification channel (email, sms, whatsapp, app)
- `client_notify_target` - Client notification target (email address or phone number)
- `create_follow_up_task` - Whether to create a follow-up task
- `notify_assignee` - Whether to notify the assignee
- `assignee_notify_channel` - Assignee notification channel (email, sms, whatsapp, app)
- `assignee_notify_target` - Assignee notification target (email address or phone number)

### Calendar Event Notifications Table
- `id` - Unique identifier for the notification
- `event_id` - Reference to the calendar event
- `type` - Notification type (relative or absolute)
- `value` - Notification value (time offset or absolute datetime)
- `unit` - Time unit for relative notifications (minutes, hours, days, weeks)

## Reference Tables Used
- `contractors` - For client references
- `users` - For assignee references
- `event_type` - For event type validation (from reference tables)

## Notes
- The calendar events table integrates with other modules through foreign key relationships
- Notifications are stored in a separate table to support multiple notifications per event
- Event types should be validated against the event_type reference table
- Notification channels should be validated against available notification channels