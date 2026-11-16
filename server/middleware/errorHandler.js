import { HttpError } from '../utils/HttpError.js'

export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: error.message })
  }

  // Services may attach a status while keeping their implementation private.
  // Only the known upstream status is accepted here; arbitrary status values
  // are not trusted.
  if (error?.status === 502) {
    return response.status(502).json({
      error:
        'The recipe service is currently unavailable. Please try again later.',
    })
  }

  console.error(error)
  return response.status(500).json({
    error: 'An unexpected server error occurred.',
  })
}
