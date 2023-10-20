//
// Copyright (c) BoxCast, Inc. and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in src/analytics for details.
//

import { getStorage, cleanQuotesFromViewerID, normalizeError, uuid, ErrorObject } from '../utils'
import platform from 'platform'
import { AnalyticOptions } from '../hooks'

type ReportAction = 'complete' | 'pause' | 'play' | 'quality' | 'seek' | 'buffer' | 'time' | 'setup' | 'error'

type ReportHeaders = {
  viewId: string
  viewerId: string
}

type BrowserState = {
  host: string
  os: string
  browserName?: string
  browserVersion?: string
  playerVersion: string
}

export type ReportMetrics = {
  //accountId?: string
  timestamp: string
  hourOfDay: number
  dayOfWeek: number
  action: ReportAction
  position: number
  duration: number
  durationBuffering: number
  browser?: BrowserState
  headers?: ReportHeaders
  error?: {
    message: string
    code: string
    data: object
    source?: unknown
  }
  __attempts?: number
}

export type ReportParams = ReportMetrics | { offset?: number } | BrowserState

type AttachParams = {
  video: HTMLVideoElement
  viewerIdKey?: string
}

type AnalyticEvents = {
  ended?: () => void
  error?: () => void
  pause?: () => void
  play?: () => void
  playing?: () => void
  resize?: () => void
  seeking?: () => void
  seeked?: () => void
  timeupdate?: () => void
  stalled?: () => void
  waiting?: () => void
}

const OVERRIDE_STATE = {}

const storage = getStorage()

function guessHost() {
  try {
    return window.location.host
  } catch (e) {
    return ''
  }
}

function guessOS() {
  return (platform.os || '').toString()
}

class Analytics {
  private _queue: ReportMetrics[] = []
  private _options: AnalyticOptions = {}
  private _waitForBufferingCheck: NodeJS.Timeout | null = null

  private listeners: AnalyticEvents = {}
  private viewerIdKey: string = 'react-video-analytics-viewer-id'
  private maxAttempts: number
  private timeReportInterval: number
  private player?: HTMLVideoElement
  private lastReportAt: Date | null = null
  private lastBufferStart: Date | null = null
  private isPlaying = false
  private isBuffering = false
  private durationPlaying = 0
  private activeBufferingDuration = 0
  private totalDurationBuffering = 0
  private currentLevelHeight = 0
  private headers: ReportHeaders = {
    viewId: '',
    viewerId: '',
  }
  private isSetup = false
  private stoppedHACK = false

  constructor(options?: AnalyticOptions) {
    this._options = options || {}
    this.maxAttempts = this._options.maxAttempts || 5
    this.timeReportInterval = this._options.interval !== undefined ? this._options.interval : 10000
  }

  private getState = () => {
    const browserState = {
      host: guessHost(),
      os: guessOS(),
      browser_name: platform.name,
      browser_version: platform.version,
      playerVersion: 'viewcastle v1',
    }

    return {
      ...browserState,
      ...OVERRIDE_STATE,
    }
  }

  private browserState = this.getState()

  attach(params: AttachParams) {
    const { video, viewerIdKey } = params

    if (Object.keys(this.listeners).length > 0) {
      this.detach()
    }

    this.player = video
    this.lastReportAt = null
    this.lastBufferStart = null
    this.isPlaying = false
    this.isBuffering = false
    this.durationPlaying = 0
    this.activeBufferingDuration = 0
    this.totalDurationBuffering = 0
    this.currentLevelHeight = 0
    this.headers = {
      viewId: '',
      viewerId: '',
    }
    this.isSetup = false
    this.viewerIdKey = viewerIdKey || this.viewerIdKey

    this.listeners = this._wireEvents(this.player)
  }

  detach() {
    Object.keys(this.listeners).forEach((key) => {
      const event = key as keyof typeof this.listeners
      const eventListener = this.listeners[event]
      eventListener && this.player?.removeEventListener(event, eventListener, true)
    })
    this.listeners = {}

    this._waitForBufferingCheck && clearTimeout(this._waitForBufferingCheck)

    return this
  }

  _wireEvents(player: HTMLVideoElement) {
    const listeners = {
      ended: async () => {
        this._handleNormalOperation()
        await this._report('complete')
        this._handleBufferingEnd()
      },
      error: async () => {
        await this._handlePlaybackError(this.player?.error)
      },
      pause: async () => {
        this._handleNormalOperation()
        await this._report('pause')
        this._handleBufferingEnd()
      },
      play: async () => {
        this._handleNormalOperation()
        await this._report('play')
        this._handleBufferingEnd()
      },
      playing: () => {
        this._handleNormalOperation()
        this.isPlaying = true
        this._handleBufferingEnd()
      },
      resize: async () => {
        this._handleNormalOperation()
        await this._report('quality')
        this._handleBufferingEnd()
      },
      seeking: async () => {
        this._handleNormalOperation()
        await this._report('seek', { offset: this.player?.currentTime })
      },
      seeked: () => {
        this._handleNormalOperation()
        this._handleBufferingEnd()
      },
      timeupdate: async () => {
        await this._reportTime()
      },
      stalled: () => {
        this._handleBufferingStart()
      },
      waiting: () => {
        this._handleBufferingStart()
      },
    }

    Object.keys(listeners).forEach((key) => {
      const event = key as keyof typeof listeners
      player.addEventListener(event, listeners[event], true)
    })

    return listeners
  }

  _isActuallyPlaying() {
    if (!this.player) return false
    return this.player.currentTime > 0 && !this.player.paused && !this.player.ended && this.player.readyState > 2
  }

  _getCurrentTime() {
    return this.player?.currentTime || 0
  }

  _getCurrentLevelHeight() {
    return this.player?.videoHeight || 0
  }

  _handleBufferingStart() {
    this.isBuffering = true
    this.lastBufferStart = this.lastBufferStart || new Date()

    if (this._waitForBufferingCheck) {
      return
    }
    this._waitForBufferingCheck = setTimeout(async () => {
      this._waitForBufferingCheck = null
      if (!this.isBuffering) {
        return
      }
      if (this._isActuallyPlaying()) {
        this._handleBufferingEnd()
        return
      }
      await this._report('buffer')
    }, 500)
  }

  _handleNormalOperation() {
    this.stoppedHACK = false
  }

  _handleBufferingEnd() {
    this.isBuffering = false
    this.lastBufferStart = null

    this._waitForBufferingCheck && clearTimeout(this._waitForBufferingCheck)
    this._waitForBufferingCheck = null

    this.totalDurationBuffering += this.activeBufferingDuration
    this.activeBufferingDuration = 0
  }

  async _handlePlaybackError(error: ErrorObject | null = null) {
    if (this.stoppedHACK) {
      console.warn('An error occurred, but playback is stopped so this should not be a problem', error)
    } else if (error === null) {
      console.warn('An error occurred, but the error was null')
    } else {
      await this._report('error', {
        ...this.browserState,
        error: normalizeError(error),
      })
    }
  }

  _setup() {
    let viewerId = storage.getItem('react-video-analytics-viewer-id')
    if (!viewerId) {
      viewerId = cleanQuotesFromViewerID(uuid().replace(/-/g, ''))
      storage.setItem(this.viewerIdKey, viewerId)
    }
    this.headers = {
      viewId: uuid().replace(/-/g, ''),
      viewerId: viewerId,
    }
  }

  async _reportTime() {
    if (!this.isSetup || !this.isPlaying) {
      return
    }
    const n = new Date()
    if (this.lastReportAt && +n - +this.lastReportAt <= this.timeReportInterval) {
      return
    }
    await this._report('time')
  }

  async _report(action: ReportAction, params?: ReportParams) {
    if (!this.isSetup) {
      this._setup()
      this.isSetup = true
      await this._report('setup')
    }

    const n = new Date()

    if (this.isPlaying) {
      // Accumulate the playing counter stat between report intervals
      this.durationPlaying += +n - +(this.lastReportAt || n)
    }
    if (this.isBuffering) {
      // The active buffering stat is absolute (*not* accumulated between report intervals)
      this.activeBufferingDuration = +n - +(this.lastBufferStart || n)
    }
    this.isPlaying = true //
    this.lastReportAt = n

    const metrics = {
      ...params,
      headers: this.headers,
      browser: this.browserState,
      timestamp: n.toISOString(),
      hourOfDay: n.getHours(),
      dayOfWeek: n.getDay(),
      action,
      position: this._getCurrentTime(),
      duration: Math.round(this.durationPlaying / 1000),
      durationBuffering: Math.round((this.totalDurationBuffering + this.activeBufferingDuration) / 1000),
    }

    //console.table(metrics)

    this._queue.push(metrics)
    await this._options.onQueue?.(metrics)
    await this._dequeue()
  }

  async _dequeue() {
    const requeue = []

    for (const metrics of this._queue) {
      try {
        await this._options.send?.(metrics)
      } catch (error) {
        await this._options.onError?.(metrics)
        metrics.__attempts = (metrics.__attempts || 0) + 1
        if (metrics.__attempts <= this.maxAttempts) {
          console.warn('Unable to post metrics; will retry', normalizeError(error as ErrorObject), metrics)
          requeue.push(metrics)
          await this._options.onRequeue?.(metrics)
        } else {
          console.warn('Unable to post metrics; will not retry', normalizeError(error as ErrorObject), metrics)
          await this._options.onFail?.(metrics)
        }
      }
    }

    this._queue = requeue
  }
}

export default Analytics
