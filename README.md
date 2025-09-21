# Public Key Infrastructure (PKI) System

A comprehensive PKI management system built with Spring Boot backend and React frontend, enabling secure certificate lifecycle management for organizations.

## Features

### User Roles
- **Administrator**: Full system access, manages CA users and all certificate types
- **CA User**: Issues intermediate and end-entity certificates for their organization
- **Regular User**: Requests certificates via CSR upload or auto-generation

### Core Functionality
- **Certificate Issuance**: Support for Root CA, Intermediate CA, and End-Entity certificates
- **Certificate Management**: View, download, and revoke certificates with X.509 compliance
- **CSR Processing**: Upload existing CSRs or auto-generate key pairs
- **Secure Storage**: Encrypted private key storage with organizational key management
- **Revocation Service**: CRL and OCSP support for certificate status checking

### Security Features
- JWT-based authentication with access/refresh tokens
- HTTPS communication throughout the system
- Role-based access control
- Email verification for user registration
- Encrypted certificate storage

## Tech Stack

**Backend**
- Spring Boot
- Spring Security
- JPA/Hibernate
- PostgreSQL

**Frontend**
- React
- TanStack Query
- Tailwind CSS
- React Icons

## Quick Start

1. Clone the repository
2. Start the backend: `./mvnw spring-boot:run`
3. Start the frontend: `npm install && npm run dev`
4. Access the application at `https://localhost:5173`

## API Documentation

The system provides RESTful endpoints for certificate management, user authentication, and administrative functions.

## Certificate Formats

- Input: PEM-encoded CSRs
- Output: PKCS#12 keystores
- Support for standard X.509 extensions and policies
