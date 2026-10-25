/// Verified catalog of SHAKILWORK ERP backend endpoints.
/// Strictly mapped to actual Next.js route handlers verified in Phase 0 audit.
class ApiEndpoints {
  // Public & System Endpoints
  static const String health = '/api/health';
  static const String jobs = '/api/jobs';
  static const String countries = '/api/countries';
  static const String categories = '/api/categories';
  static const String track = '/api/track';

  // Candidate Portal Authentication
  static const String candidateLogin = '/api/portal/auth/login';
  static const String candidateRegister = '/api/portal/auth/register';
  static const String candidateMe = '/api/portal/auth/me';
  static const String candidateLogout = '/api/portal/auth/logout';

  // Staff & Admin Authentication
  static const String staffLogin = '/api/auth/login';
  static const String staffMe = '/api/auth/me';
  static const String staffLogout = '/api/auth/logout';

  // Candidate Self-Service Modules
  static const String candidateProfile = '/api/portal/profile';
  static const String candidateDocuments = '/api/portal/documents';
  static const String candidateApplications = '/api/portal/applications';
  static const String candidateProcessing = '/api/portal/processing';
  static const String candidateFinance = '/api/portal/finance';
  static const String candidateInvoices = '/api/portal/invoices';
  static const String candidatePayments = '/api/portal/payments';
  static const String candidateInterviews = '/api/portal/interviews';
  static const String candidateNotifications = '/api/portal/notifications';

  // Staff & Field Operations
  static const String staffProcessing = '/api/staff/processing';
  static const String staffApplicants = '/api/applicants';
  static const String supportTickets = '/api/support/tickets';

  // Document Streaming
  static String documentDownload(String documentId) => '/api/documents/$documentId/download';
}
