/**
 * Standardized API response helpers for consistent JSON shape across the entire platform
 */
export const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const errorResponse = (
  res,
  message = 'An error occurred',
  statusCode = 500,
  errors = null,
  stack = null
) => {
  const payload = {
    success: false,
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    errors,
    timestamp: new Date().toISOString(),
  };

  if (stack && process.env.NODE_ENV !== 'production') {
    payload.stack = stack;
  }

  return res.status(statusCode).json(payload);
};
