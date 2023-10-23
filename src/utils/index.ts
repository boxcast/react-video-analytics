//
// Copyright (c) BoxCast, Inc. and contributors. All rights reserved.
// Licensed under the MIT license.
//

export function getStorage() {
  try {
    try {
      localStorage.setItem('__sentinel__', 'foo')
      if (localStorage.getItem('__sentinel__') === 'foo') {
        localStorage.removeItem('__sentinel__')
        return localStorage
      }
      return sessionStorage
    } catch (e) {
      // Possible DOMException reading localStorage; try sessionStorage
      return sessionStorage
    }
  } catch (e) {
    // Possible DOMException reading sessionStorage; use in-memory mock
    const mockStorage = {
      getItem: function (key: string) {
        return (this[key as keyof typeof this] as unknown as string) || null
      },
      setItem: function (key: string, value: string) {
        this[key as keyof typeof this] = value as never
      },
    }
    return mockStorage
  }
}

export function uuid() {
  let r = function (n: number) {
    let text = '',
      possible = '0123456789ABCDEF'
    for (let i = 0; i < n; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }
  return r(8) + '-' + r(4) + '-' + r(4) + '-' + r(4) + '-' + r(12)
}

export function cleanQuotesFromViewerID(viewerId: string) {
  if (!viewerId || viewerId.length < 3) {
    return viewerId || ''
  }
  if (viewerId[0] === '"' && viewerId[viewerId.length - 1] === '"') {
    return viewerId.substring(1, viewerId.length - 1)
  }
  return viewerId
}

export type ErrorObject = string | MediaError | Record<string, unknown>

export function normalizeError(error: ErrorObject, source?: unknown) {
  // This error object could come from various sources, depending on playback
  // and circumstance:
  //   a) string error description
  //   b) dictionary with `message` and `data` keys
  //   c) dictionary with `evt` and `data` keys from hls.js, where `data` is an object with `type`, `details`, and a whole bunch of other keys
  //   d) error object from native HTML5 video element
  //
  // Please note, per the HTML5 spec, these are the following error code values:
  //   MEDIA_ERR_ABORTED (1) The fetching process for the media resource was aborted by the user agent at the user's request.
  //   MEDIA_ERR_NETWORK (2) A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable.
  //   MEDIA_ERR_DECODE (3) An error of some description occurred while decoding the media resource, after the resource was established to be usable.
  //   MEDIA_ERR_SRC_NOT_SUPPORTED (4) The media resource indicated by the src attribute was not suitable.
  //
  // Let's try to normalize the reported error a touch
  error = error || {}
  const code =
    (typeof error !== 'string' &&
      (('code' in error && typeof error.code === 'string' && error.code) ||
        ('data' in error &&
          typeof error.data === 'object' &&
          error.data &&
          'code' in error.data &&
          typeof error.data.code === 'string' &&
          error.data.code))) ||
    ''
  let message = typeof error !== 'string' && 'message' in error && typeof error.message === 'string' && error.message
  if (!message && typeof error !== 'string' && 'data' in error && typeof error.data === 'object' && error.data) {
    message =
      'details' in error.data && typeof error.data.details === 'string'
        ? error.data.details /* hlsError, cannot be stringified */
        : JSON.stringify(error.data)
  } else {
    message = error.toString()
  }
  if (message === '[object MediaError]') {
    message = 'MediaError occurred'
  }
  let errorObject: {
    message: string
    code: string
    data: object
    source?: unknown
  } = {
    message: message,
    code: code,
    data:
      typeof error !== 'string' && 'data' in error && typeof error.data === 'object' && error.data ? error.data : {},
  }
  if (source) {
    errorObject.source = source
  }
  return errorObject
}
