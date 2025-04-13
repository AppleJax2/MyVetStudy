# MyVetStudy Architecture Diagram

## System Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                           CLIENT LAYER                                │
│                                                                       │
│   ┌─────────────────┐      ┌─────────────────┐    ┌──────────────┐   │
│   │                 │      │                 │    │              │   │
│   │  Web Browser    │      │  Mobile PWA     │    │  Desktop PWA │   │
│   │                 │      │                 │    │              │   │
│   └────────┬────────┘      └────────┬────────┘    └──────┬───────┘   │
│            │                        │                     │           │
└────────────┼────────────────────────┼─────────────────────┼───────────┘
             │                        │                     │            
             │                        │                     │            
             ▼                        ▼                     ▼            
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                         CLIENT SERVICES                               │
│                                                                       │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│   │                 │    │                 │    │                 │  │
│   │  Service Worker │    │  IndexedDB      │    │  Auth Store     │  │
│   │                 │    │                 │    │                 │  │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                       │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│   │                 │    │                 │    │                 │  │
│   │  Background     │    │  Offline Queue  │    │  API Client     │  │
│   │  Sync           │    │                 │    │                 │  │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │                                    
                                    │                                    
                                    ▼                                    
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                          API GATEWAY                                  │
│                                                                       │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│   │                 │    │                 │    │                 │  │
│   │  JWT Auth       │    │  Rate Limiting  │    │  Input Valid.   │  │
│   │                 │    │                 │    │                 │  │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │                                    
                                    │                                    
                                    ▼                                    
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                       BUSINESS LOGIC LAYER                            │
│                                                                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │              │  │               │  │              │  │          │ │
│  │  User        │  │  Study        │  │  Symptom     │  │  Payment │ │
│  │  Service     │  │  Service      │  │  Service     │  │  Service │ │
│  │              │  │               │  │              │  │          │ │
│  └──────────────┘  └───────────────┘  └──────────────┘  └──────────┘ │
│                                                                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │              │  │               │  │              │  │          │ │
│  │  Practice    │  │  Patient      │  │  Treatment   │  │  Report  │ │
│  │  Service     │  │  Service      │  │  Service     │  │  Service │ │
│  │              │  │               │  │              │  │          │ │
│  └──────────────┘  └───────────────┘  └──────────────┘  └──────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │                                    
                                    │                                    
                                    ▼                                    
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                         DATA ACCESS LAYER                             │
│                                                                       │
│    ┌────────────────┐     ┌─────────────────┐    ┌────────────────┐  │
│    │                │     │                 │    │                │  │
│    │  Prisma ORM    │     │  Query Builder  │    │  Redis Cache   │  │
│    │                │     │                 │    │                │  │
│    └────────────────┘     └─────────────────┘    └────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │                                    
                                    │                                    
                                    ▼                                    
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                        PERSISTENCE LAYER                              │
│                                                                       │
│    ┌────────────────┐     ┌─────────────────┐    ┌────────────────┐  │
│    │                │     │                 │    │                │  │
│    │  PostgreSQL    │     │  File Storage   │    │  Redis         │  │
│    │  Database      │     │  (Images/Docs)  │    │  (Sessions)    │  │
│    │                │     │                 │    │                │  │
│    └────────────────┘     └─────────────────┘    └────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │                                    
                                    │                                    
                                    ▼                                    
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                       EXTERNAL SERVICES                               │
│                                                                       │
│   ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐   │
│   │                 │   │                 │   │                  │   │
│   │  Email Service  │   │  Payment        │   │  Analytics       │   │
│   │                 │   │  Gateway        │   │                  │   │
│   └─────────────────┘   └─────────────────┘   └──────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### Client Layer
The user-facing applications that interact with the MyVetStudy system:
- Web browsers for desktop access
- Progressive Web App (PWA) for mobile devices
- PWA installed on desktop computers

### Client Services
Client-side functionality that enables the PWA capabilities:
- **Service Worker**: Manages caching and offline functionality
- **IndexedDB**: Client-side database for offline data storage
- **Auth Store**: Securely stores authentication tokens
- **Background Sync**: Handles syncing of offline data when connectivity is restored
- **Offline Queue**: Stores pending transactions while offline
- **API Client**: Manages communication with the backend API

### API Gateway
Entry point for all client requests to the backend:
- **JWT Auth**: Validates authentication tokens and manages sessions
- **Rate Limiting**: Prevents abuse and ensures fair service usage
- **Input Validation**: Sanitizes and validates all incoming data

### Business Logic Layer
Core services implementing the application's business rules:
- **User Service**: User management, authentication, and authorization
- **Study Service**: Study protocol creation, management, and assignment
- **Symptom Service**: Symptom tracking, thresholds, and alerts
- **Payment Service**: Subscription management and billing
- **Practice Service**: Veterinary practice settings and configuration
- **Patient Service**: Patient records and history
- **Treatment Service**: Treatment tracking and management
- **Report Service**: Analytics and reporting functionality

### Data Access Layer
Abstracts database operations and provides data access patterns:
- **Prisma ORM**: Type-safe database client for PostgreSQL
- **Query Builder**: Custom queries for complex operations
- **Redis Cache**: In-memory caching for performance optimization

### Persistence Layer
Stores application data:
- **PostgreSQL Database**: Primary relational database
- **File Storage**: Cloud storage for images, documents, and media
- **Redis**: Session storage and temporary data

### External Services
Third-party services integrated with the application:
- **Email Service**: Sends notifications and reminders
- **Payment Gateway**: Processes subscription payments
- **Analytics**: Tracks usage and provides business insights

## Key Interaction Flows

### Authentication Flow
1. User enters credentials in client application
2. API Gateway validates credentials and issues JWT
3. Client stores JWT in Auth Store
4. Service Worker caches necessary resources for offline use
5. User is redirected to dashboard

### Study Creation Flow
1. Veterinarian creates new study protocol
2. Request passes through API Gateway
3. Study Service validates and processes the request
4. Prisma ORM saves study to PostgreSQL
5. Response returns to client with new study ID
6. Study is cached for offline access

### Symptom Recording Flow
1. Staff member records symptom observation
2. If online, request goes directly to API Gateway
3. If offline, data is stored in IndexedDB and queued
4. Background Sync attempts to send data when online
5. Symptom Service processes and validates the observation
6. Data is stored in PostgreSQL database
7. If relevant, notifications are triggered based on thresholds

### Subscription Management Flow
1. Practice owner selects subscription plan
2. Payment Service processes request through Payment Gateway
3. On successful payment, subscription status is updated
4. Practice settings are updated with new limitations
5. Email Service sends confirmation 