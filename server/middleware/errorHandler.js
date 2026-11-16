import { HttpError } from '../utils/HttpError.js'

export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: error.message })
  }

  if (error?.type === 'entity.parse.failed') {
    return response
      .status(400)
      .json({ error: 'Request body must be valid JSON.' })
  }

  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large.' })
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

  console.error(
    'Unhandled API error:',
    error instanceof Error ? error.message : 'Unknown error',
  )
  return response.status(500).json({
    error: 'An unexpected server error occurred.',
  })
}
