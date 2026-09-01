# Vendor Reliability Intelligence & Procurement Risk Management Platform

## 1. Project Objective

The objective of this project is to develop a centralized system that helps organizations manage vendors and procurement activities efficiently. The system will evaluate vendor reliability, monitor supplier performance, identify procurement risks, and support better procurement decisions.

## 2. Technology Stack

- Frontend: React
- Backend: FastAPI
- Database: PostgreSQL

## 3. User Roles

The system will support six different roles:

1. Administrator
2. Procurement Manager
3. Supply Chain Manager
4. Vendor
5. Finance Officer
6. Auditor

## 4. Functional Requirements

The system should provide the following functionalities:

### 4.1 User Authentication and Access Control

- Users can register and log in securely.
- The system will identify the user's role after login.
- Each role will have access only to the modules and actions permitted for that role.
- Unauthorized users must not be able to access restricted modules.

### 4.2 Vendor Management

- The system should allow vendor registration and profile management.
- Authorized users can view and manage vendor information.
- Vendors can access and manage only their own permitted information.
- The system should maintain vendor details in a centralized location.

### 4.3 Procurement Management

- Authorized users can create and manage procurement requests.
- The system should support purchase order management.
- Procurement activities should be tracked within the system.

### 4.4 Vendor Performance and Reliability

- The system should monitor vendor performance.
- The system should evaluate vendor reliability using relevant performance information.
- The system should support vendor performance history and evaluation.

### 4.5 Dashboard and Reports

- The system should provide dashboards based on the user's role and permissions.
- Authorized users should be able to view relevant reports and information.

## 5. Non-Functional Requirements

### 5.1 Security

- User passwords should be stored securely.
- The system should use JWT-based authentication.
- Users must only access features permitted for their role.
- Unauthorized access to restricted data must be prevented.

### 5.2 Usability

- The application should have a clean and user-friendly interface.
- Users should be able to navigate the system easily.
- The interface should be easy to understand for different user roles.

### 5.3 Performance

- The system should respond to user requests efficiently.
- The application should handle multiple users and system operations smoothly.

### 5.4 Responsiveness

- The frontend should work properly on different screen sizes, including desktop, tablet, and mobile devices.

### 5.5 Reliability

- The system should store and retrieve data accurately.
- Important user and procurement information should be handled consistently.

## 6. Role Responsibilities and Access Control

The system will use Role-Based Access Control (RBAC). Each user will be assigned a role, and access will be granted based on the permissions assigned to that role.

### 6.1 Administrator

Responsibilities:
- Manage users and user roles.
- Manage role permissions.
- Monitor the overall system.
- Access system configuration.

Access:
- Full access to authorized system modules.

### 6.2 Procurement Manager

Responsibilities:
- Manage procurement activities.
- Create and manage procurement requests.
- Manage purchase orders.
- Work with vendor-related procurement activities.

Access:
- Access to authorized procurement and vendor management features.

### 6.3 Supply Chain Manager

Responsibilities:
- Monitor supply chain activities.
- Track orders and delivery-related information.
- Monitor vendor delivery performance.

Access:
- Access to authorized supply chain, order tracking, and vendor performance features.

### 6.4 Vendor

Responsibilities:
- Manage their vendor profile.
- View relevant procurement or order information.
- Maintain permitted vendor information.

Access:
- Access only to their own authorized information.
- Cannot access internal administrative or other vendors' information.

### 6.5 Finance Officer

Responsibilities:
- Manage financial information related to procurement.
- Review invoices and payment-related information.
- Access relevant financial reports.

Access:
- Access to authorized finance and procurement financial information.

### 6.6 Auditor

Responsibilities:
- Review system and procurement records.
- Review relevant reports and historical information.
- Monitor activities for auditing purposes.

Access:
- Read-only access to authorized records and reports.

## 7. Role-Permission Matrix

The following matrix defines the initial module-level access for each role. Detailed permissions can be refined after guide feedback.

| Module | Administrator | Procurement Manager | Supply Chain Manager | Vendor | Finance Officer | Auditor |
|---|---|---|---|---|---|---|
| User & Role Management | Full | No Access | No Access | No Access | No Access | View |
| Vendor Management | Full | Manage | View | Own Profile Only | View | View |
| Procurement Requests | Full | Manage | View | View Relevant | View Relevant | View |
| Purchase Orders | Full | Manage | Manage/Track | View Relevant | View Relevant | View |
| Order & Delivery Tracking | Full | View | Manage | View Own Orders | View Relevant | View |
| Vendor Performance | Full | Manage | Manage | View Own Performance | View | View |
| Contracts | Full | Manage | View | View Own Contracts | View Relevant | View |
| Invoices & Payments | Full | View | No Access | View Relevant | Manage | View |
| Reports | Full | View Relevant | View Relevant | View Own | View Financial | View |
| System Audit Records | Full | No Access | No Access | No Access | No Access | View |