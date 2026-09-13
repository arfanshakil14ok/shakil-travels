export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'RECRUITMENT_MANAGER'
  | 'RECRUITER'
  | 'DOCUMENT_OFFICER'
  | 'TRAINING_MANAGER'
  | 'FINANCE_OFFICER'
  | 'VISA_OFFICER'
  | 'SUPPORT_OFFICER'
  | 'RECRUITMENT_STAFF'
  | 'ACCOUNTS_STAFF'
  | 'CONTENT_MANAGER'
  | 'VIEWER';

export type KnownPermissionCode =
  | 'DASHBOARD_VIEW'
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_EDIT'
  | 'USER_DELETE'
  | 'APPLICANT_VIEW'
  | 'APPLICANT_CREATE'
  | 'APPLICANT_EDIT'
  | 'APPLICANT_DELETE'
  | 'APPLICANT_EXPORT'
  | 'JOB_VIEW'
  | 'JOB_CREATE'
  | 'JOB_EDIT'
  | 'JOB_DELETE'
  | 'JOB_PUBLISH'
  | 'JOB_EXPORT'
  | 'EMPLOYER_VIEW'
  | 'EMPLOYER_CREATE'
  | 'EMPLOYER_EDIT'
  | 'EMPLOYER_DELETE'
  | 'COUNTRY_VIEW'
  | 'COUNTRY_CREATE'
  | 'COUNTRY_EDIT'
  | 'COUNTRY_DELETE'
  | 'CATEGORY_VIEW'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_EDIT'
  | 'CATEGORY_DELETE'
  | 'APPLICATION_VIEW'
  | 'APPLICATION_CREATE'
  | 'APPLICATION_EDIT'
  | 'APPLICATION_DELETE'
  | 'APPLICATION_STATUS_CHANGE'
  | 'APPLICATION_ASSIGN'
  | 'APPLICATION_EXPORT'
  | 'DOCUMENT_VIEW'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_VERIFY'
  | 'DOCUMENT_REJECT'
  | 'DOCUMENT_DELETE'
  | 'DOCUMENT_EXPORT'
  | 'INTERVIEW_VIEW'
  | 'INTERVIEW_CREATE'
  | 'INTERVIEW_EDIT'
  | 'INTERVIEW_CANCEL'
  | 'INTERVIEW_RESULT'
  | 'INVOICE_VIEW'
  | 'INVOICE_CREATE'
  | 'INVOICE_EDIT'
  | 'INVOICE_ISSUE'
  | 'INVOICE_VOID'
  | 'INVOICE_EXPORT'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_EDIT'
  | 'PAYMENT_REVERSE'
  | 'PAYMENT_EXPORT'
  | 'RECEIPT_VIEW'
  | 'RECEIPT_PRINT'
  | 'REFUND_VIEW'
  | 'REFUND_PROCESS'
  | 'ACCOUNTING_LEDGER_VIEW'
  | 'ACCOUNTING_REPORTS_VIEW'
  | 'REPORT_VIEW'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_VIEW'
  // Phase 5 Visa, Country & Migrant
  | 'VISA_VIEW'
  | 'VISA_CREATE'
  | 'VISA_EDIT'
  | 'VISA_STATUS_CHANGE'
  | 'VISA_ASSIGN'
  | 'VISA_EXPORT'
  | 'VISA_DOCUMENT_VIEW'
  | 'VISA_DOCUMENT_MANAGE'
  | 'COUNTRY_INFO_MANAGE'
  | 'VISA_INFO_MANAGE'
  | 'MIGRANT_INFO_VIEW'
  | 'MIGRANT_INFO_CREATE'
  | 'MIGRANT_INFO_EDIT'
  | 'MIGRANT_INFO_PUBLISH'
  | 'MIGRANT_INFO_DELETE'
  // Phase 6 Portal & Comms & Leads
  | 'PORTAL_SUPPORT_VIEW'
  | 'COMMUNICATION_VIEW'
  | 'COMMUNICATION_SEND'
  | 'COMMUNICATION_TEMPLATE_MANAGE'
  | 'COMMUNICATION_LOG_VIEW'
  | 'NOTIFICATION_MANAGE'
  | 'INQUIRY_VIEW'
  | 'INQUIRY_MANAGE'
  // Phase 7 Reporting & Analytics
  | 'REPORT_EXPORT'
  | 'RECRUITMENT_REPORT_VIEW'
  | 'FINANCIAL_REPORT_VIEW'
  | 'STAFF_REPORT_VIEW'
  | 'VISA_REPORT_VIEW'
  | 'COMMUNICATION_REPORT_VIEW'
  // V2 Training Ecosystem
  | 'TRAINING_VIEW'
  | 'TRAINING_COURSE_MANAGE'
  | 'TRAINING_CENTER_MANAGE'
  | 'TRAINING_BATCH_MANAGE'
  | 'TRAINING_ENROLL_MANAGE'
  | 'TRAINING_ATTENDANCE_MANAGE'
  | 'TRAINING_CERTIFICATE_ISSUE'
  | 'TRAINING_CERTIFICATE_VERIFY'
  // V2 Post-Selection Operations
  | 'MEDICAL_VIEW'
  | 'MEDICAL_MANAGE'
  | 'CLEARANCE_VIEW'
  | 'CLEARANCE_MANAGE'
  | 'DEPARTURE_VIEW'
  | 'DEPARTURE_MANAGE'
  // V2 Support Ticketing
  | 'SUPPORT_TICKET_VIEW'
  | 'SUPPORT_TICKET_MANAGE';

export type PermissionCode = KnownPermissionCode | (string & {});

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleId: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  permissions: string[];
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
