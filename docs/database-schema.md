# MyVetStudy Database Schema & Data Modeling

## 1. Overview

The MyVetStudy application uses a PostgreSQL database with Prisma ORM to manage data storage and retrieval. The schema is designed to support the core functionality of the application, including user management, veterinary study tracking, symptom observation, and treatment administration.

## 2. Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Practice    │◄────┤      User       │────►│     Study       │
│                 │     │                 │     │                 │
└───────┬─────────┘     └───────┬─────────┘     └───────┬─────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Patient     │◄────┤  StudyPatient   │◄────┤SymptomTemplate │
│                 │     │                 │     │                 │
└───────┬─────────┘     └───────┬─────────┘     └───────┬─────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│      File       │◄────┤   Observation   │────►│AlertThreshold   │
│                 │     │                 │     │                 │
└─────────────────┘     └───────┬─────────┘     └───────┬─────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │    Treatment    │     │     Alert       │
                        │                 │     │                 │
                        └─────────────────┘     └───────┬─────────┘
                                                        │
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │                 │
                                                │  Notification   │
                                                │                 │
                                                └─────────────────┘
```

## 3. Core Entities

### 3.1 User and Authentication

The `User` model represents various stakeholders in the system:

- Practice Owners/Administrators
- Veterinarians
- Technicians
- Assistants
- Receptionists

Key features:
- Role-based permissions
- Authentication via email/password
- Association with a veterinary practice
- Password reset functionality

### 3.2 Practice and Subscription

The `Practice` model represents a veterinary clinic or hospital:

- Subscribes to different tiers (Basic, Standard, Premium)
- Manages billing and subscription status
- Tracks storage usage for uploaded files
- Houses branding customization

### 3.3 Patient Records

The `Patient` model stores information about animals receiving care:

- Basic information (name, species, breed, etc.)
- Owner contact details
- Medical history
- Association with veterinary practice
- Link to studies for research

### 3.4 Study and Research

The `Study` model represents clinical research being conducted:

- Research protocols and documentation
- Start/end dates and status tracking
- Assignment of researchers and observers
- Patient enrollment
- Symptom and treatment templates

### 3.5 Symptom Tracking

The `SymptomTemplate` and `Observation` models work together to track patient symptoms:

- Templates define what symptoms to track (pain, mobility, weight, etc.)
- Different data types supported (numeric, boolean, scale, enumeration, text, image)
- Observations record actual readings with timestamps and user attribution
- Alert thresholds can be set to notify staff about concerning values

### 3.6 Treatment Management

The `TreatmentTemplate` and `Treatment` models track medication and procedures:

- Templates standardize treatment protocols
- Treatment instances record actual administration with dosage and notes
- Linked to specific patients and studies
- Timestamps for tracking history

### 3.7 Alerts and Notifications

The `Alert` and `Notification` models handle alerting users:

- Triggered by observation thresholds
- Different severity levels
- Delivery to appropriate user roles
- Read/unread tracking

### 3.8 File Management

The `File` model tracks uploaded documents and images:

- Storage path and metadata
- Size tracking for subscription limits
- Association with patients, observations, or treatments

## 4. Key Relationships

1. **Practice to Users**: One-to-many (a practice has multiple staff members)
2. **User to Studies**: Many-to-many via StudyAssignment (users can be assigned to multiple studies)
3. **Study to Patients**: Many-to-many via StudyPatient (patients can be enrolled in multiple studies)
4. **Study to Templates**: One-to-many (a study defines its own symptom and treatment templates)
5. **Patient to Observations**: One-to-many (patients have multiple symptom observations)
6. **User to Observations**: One-to-many (staff members record observations)

## 5. Data Constraints and Validation

### 5.1 Subscription Limits

- Basic tier limited to 5 concurrent active studies
- Standard tier limited to 20 concurrent active studies
- Premium tier unlimited studies
- Storage limits per tier (20MB, 100MB, 500MB respectively)

### 5.2 Relationship Integrity

- StudyPatient enforces unique patient enrollment per study
- StudyAssignment ensures unique user assignments per study
- Cascading deletes for children when parents are removed

### 5.3 Security Constraints

- Password hashing for all user credentials
- Role-based access control for all operations
- Audit trails for sensitive operations (via timestamps and user attribution)

## 6. Database Migration Strategy

Prisma is used to manage database migrations with the following approach:

1. Schema changes are made to the `schema.prisma` file
2. Migration scripts are generated with `npx prisma migrate dev --name description`
3. Development environments apply migrations automatically
4. Production deployments use `npx prisma migrate deploy`
5. Seeding data is provided for development and testing

## 7. Future Schema Considerations

1. **Audit Logging**: Consider adding a dedicated audit log table for comprehensive tracking
2. **Archiving Strategy**: Implement data archiving for completed studies to optimize performance
3. **Internationalization**: Prepare for multi-language support in text fields
4. **Advanced Analytics**: Consider a data warehouse structure for reporting needs
5. **HIPAA Compliance**: Ensure schema supports necessary privacy controls 