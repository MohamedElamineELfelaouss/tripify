// Error utility functions for consistent error handling
export const createError = (
  message,
  statusCode = 500,
  code = "INTERNAL_ERROR"
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const grpcErrorCodes = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
};

export const mapHttpToGrpcError = (statusCode) => {
  switch (statusCode) {
    case 400:
      return grpcErrorCodes.INVALID_ARGUMENT;
    case 401:
      return grpcErrorCodes.UNAUTHENTICATED;
    case 403:
      return grpcErrorCodes.PERMISSION_DENIED;
    case 404:
      return grpcErrorCodes.NOT_FOUND;
    case 409:
      return grpcErrorCodes.ALREADY_EXISTS;
    case 429:
      return grpcErrorCodes.RESOURCE_EXHAUSTED;
    case 500:
      return grpcErrorCodes.INTERNAL;
    case 501:
      return grpcErrorCodes.UNIMPLEMENTED;
    case 503:
      return grpcErrorCodes.UNAVAILABLE;
    default:
      return grpcErrorCodes.UNKNOWN;
  }
};
