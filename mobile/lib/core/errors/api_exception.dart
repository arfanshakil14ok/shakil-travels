/// Base class for all remote API exceptions
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  const ApiException({
    required this.message,
    this.statusCode,
    this.details,
  });

  @override
  String toString() => 'ApiException(code: $statusCode, message: $message)';
}

/// 401 Unauthorized - Expired or missing token
class UnauthorizedException extends ApiException {
  const UnauthorizedException({
    super.message = 'Session expired or unauthenticated. Please log in again.',
    super.details,
  }) : super(statusCode: 401);
}

/// 403 Forbidden - Role or permission restriction
class ForbiddenException extends ApiException {
  const ForbiddenException({
    super.message = 'Access denied: You do not have permission to view this resource.',
    super.details,
  }) : super(statusCode: 403);
}

/// 404 Not Found
class NotFoundException extends ApiException {
  const NotFoundException({
    super.message = 'The requested resource was not found on the server.',
    super.details,
  }) : super(statusCode: 404);
}

/// 429 Too Many Requests - Rate Limiting
class RateLimitException extends ApiException {
  const RateLimitException({
    super.message = 'Too many requests. Please wait a few moments before trying again.',
    super.details,
  }) : super(statusCode: 429);
}

/// 5xx Server Error
class ServerException extends ApiException {
  const ServerException({
    super.message = 'An unexpected server error occurred. Please try again later.',
    super.statusCode = 500,
    super.details,
  });
}

/// Network Connection Timeout or Socket Failure
class NetworkException extends ApiException {
  const NetworkException({
    super.message = 'Unable to connect to the server. Please check your internet connection.',
  });
}
