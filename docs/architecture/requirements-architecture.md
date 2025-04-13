# MyVetStudy - Requirements & Architecture Document

## 1. Stakeholders and User Roles

### Practice Owner / Administrator
- Manages practice subscription and billing
- Creates and manages user accounts within the practice
- Has access to all features and data
- Can customize practice settings and branding

### Veterinarian
- Creates and manages study protocols
- Reviews patient data and symptom tracking
- Prescribes treatments and adjusts care plans
- Accesses analytics and reporting

### Technician
- Records symptom observations
- Administers treatments and logs them
- Communicates with pet owners
- Limited access to modify study protocols

### Assistant
- Basic data entry for symptoms
- Schedules appointments related to studies
- Supports veterinarians and technicians
- Limited access to sensitive data

### Receptionist
- Manages client communications
- Schedules appointments
- Handles basic client inquiries
- No access to modify medical data

### Pet Owner (External User)
- Receives notifications and reminders
- May submit symptom observations remotely (if allowed)
- Views limited patient information
- Cannot modify study protocols or treatments

## 2. Business Rules & Monetization

### Subscription Tiers
- **Basic Plan**: Up to 5 concurrent active studies, basic symptom tracking, limited file storage (20MB)
- **Standard Plan**: Up to 20 concurrent active studies, advanced symptom tracking, moderate file storage (100MB)
- **Premium Plan**: Unlimited concurrent studies, advanced analytics, extensive file storage (500MB)

### Free Trial
- 14-day fully functional trial of Premium tier
- No credit card required to start
- Automated email reminders at 7 days, 3 days, and 1 day before expiration

### Concurrency Limitations
- Studies are considered "active" until marked complete
- Exceeding concurrency limits blocks the creation of new studies
- Warnings displayed at 80% of limit

### Data Retention
- Study data retained for 2 years after completion for all tiers
- Option to export and archive older studies
- Deleted accounts have 30-day grace period before permanent data removal

## 3. PWA Strategy

### Offline-First Approach
- All core application functionality works without an internet connection
- Study protocols and active patient data cached locally
- New observations stored locally and synced when online

### Caching Strategy
- **Static Assets**: Cache-first strategy, updated on new version
- **Study Templates**: Cache with network update check
- **Active Studies**: Cache with background sync
- **User Data**: Session-based with secure storage

### Background Sync
- Queued transactions for symptom recordings
- Periodic sync attempts when connection restored
- Conflict resolution with server timestamp priority

### Storage Requirements
- IndexedDB for structured data (studies, symptoms, observations)
- Cache API for static assets and templates
- Secure storage for auth tokens

## 4. Conceptual Architecture

```
┌─────────────────┐     ┌───────────────────────┐     ┌─────────────────┐
│                 │     │                       │     │                 │
│  Client Devices │◄────┤  API Gateway & Auth   │◄────┤   Database &    │
│  (PWA/Browser)  │     │  (Express.js + JWT)   │     │   Storage       │
│                 │     │                       │     │                 │
└─────────────────┘     └───────────────────────┘     └─────────────────┘
        │                          │                          │
        │                          │                          │
        ▼                          ▼                          ▼
┌─────────────────┐     ┌───────────────────────┐     ┌─────────────────┐
│                 │     │                       │     │                 │
│  Service Worker │     │  Business Logic &     │     │  PostgreSQL     │
│  & IndexedDB    │     │  Core Services        │     │  Database       │
│                 │     │                       │     │                 │
└─────────────────┘     └───────────────────────┘     └─────────────────┘
                                    │
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │                       │
                        │  External Services    │
                        │  (Email, Storage)     │
                        │                       │
                        └───────────────────────┘
```

### Data Flow
1. Users authenticate through the API gateway
2. Role-based permissions control access to endpoints
3. Study data flows from database to client through API
4. Symptom observations flow from client to database (with offline capability)
5. Notifications and alerts triggered by business logic

### External Dependencies
- PostgreSQL for primary data storage
- Redis for caching and session management (optional)
- Cloud storage for media attachments (images/videos)
- Email service for notifications and reminders

## 5. Technology Stack

### Backend
- **Node.js + Express**: For API development
- **PostgreSQL**: Primary database
- **Prisma ORM**: Database access and migrations
- **JWT**: Authentication
- **Redis** (optional): Caching and session management

### Frontend
- **React**: UI library
- **TypeScript**: Type safety
- **Redux**: State management
- **React Router**: Navigation
- **Workbox**: Service worker and PWA capabilities

### Deployment & Hosting
- **Backend**: Render.com
- **Frontend**: Netlify
- **Database**: Managed PostgreSQL service
- **Version Control**: Git (GitHub/GitLab)

### Testing
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing

## 6. Next Steps

1. Set up project repositories
2. Initialize backend and frontend projects with selected technologies
3. Create database schema based on requirements
4. Implement authentication system
5. Build core API endpoints for study management

## 7. Risk Assessment

### Technical Risks
- **Offline Sync Conflicts**: Implement robust conflict resolution
- **Data Consistency**: Ensure validation across client and server
- **Performance**: Optimize for large study datasets

### Business Risks
- **Adoption Rate**: Focus on UX and onboarding simplicity
- **Subscription Conversion**: Clear value proposition for paid tiers
- **Regulatory Compliance**: Consider HIPAA/veterinary data regulations

## 8. Project Timeline

Phase 1 (Current): Requirements & Architecture - Complete
Phase 2: Database Schema & Data Modeling - 1-2 weeks
Phase 3: Authentication & Security - 1-2 weeks
Phase 4: Core Features & Business Logic - 2-3 weeks
Phase 5: Frontend Foundation - 2 weeks
Phase 6: Advanced Frontend & PWA - 2-3 weeks
Phase 7: Testing & QA - 1-2 weeks
Phase 8: Deployment & Handoff - 1 week

Total estimated timeline: 10-15 weeks 