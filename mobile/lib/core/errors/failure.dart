/// Domain failure representations for UI presentation
abstract class Failure {
  final String message;
  final int? code;

  const Failure({required this.message, this.code});

  @override
  String toString() => message;
}

class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection or server unreachable',
  });
}

class AuthFailure extends Failure {
  const AuthFailure({
    super.message = 'Authentication failed. Please verify your credentials.',
    super.code = 401,
  });
}

class ServerFailure extends Failure {
  const ServerFailure({
    super.message = 'Server encountered an error. Please try again later.',
    super.code,
  });
}

class ValidationFailure extends Failure {
  const ValidationFailure({
    required super.message,
    super.code = 400,
  });
}
