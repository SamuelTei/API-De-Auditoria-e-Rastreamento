export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Não autenticado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acesso negado') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
