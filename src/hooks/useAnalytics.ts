//
// Copyright (c) oos, Inc. and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for more details.
//

import { RefObject, useContext, useEffect, useMemo } from 'react'
import Analytics, { AnalyticsContext, PlayerConfig } from '../analytics'
import { ReportMetrics } from '../analytics'

export type AnalyticOptions = {
  send?: (metrics: ReportMetrics) => Promise<void> | void
  maxAttempts?: number
  onRequeue?: (metrics: ReportMetrics) => Promise<void> | void
  onQueue?: (metrics: ReportMetrics) => Promise<void> | void
  onComplete?: (metrics: ReportMetrics) => Promise<void> | void
  onError?: (metrics: ReportMetrics) => Promise<void> | void
  onFail?: (metrics: ReportMetrics) => Promise<void> | void
  playerConfig?: PlayerConfig
  timeInterval?: number
  videoId?: string | null
}

export function useAnalytics<PlayerElement>(
  player: RefObject<PlayerElement>,
  options?: AnalyticOptions,
  deps: unknown[] = [],
) {
  const { getVideoElement, setDefaultPlayerConfig, defaultPlayerConfig, defaultTimeInterval, viewerIdKey } =
    useContext(AnalyticsContext)

  const analytics = useMemo(
    () =>
      new Analytics({
        ...options,
        timeInterval: options?.timeInterval || defaultTimeInterval,
      }),
    [],
  )

  useEffect(
    () => {
      analytics.updateOptions({
        ...options,
        timeInterval: options?.timeInterval || defaultTimeInterval,
      })
    },
    options ? [...Object.keys(options).map((k) => options[k as keyof AnalyticOptions]), ...deps] : deps,
  )

  useEffect(() => {
    if (player.current) {
      getVideoElement(player.current, options?.playerConfig).then((video) => {
        if (video) {
          analytics.attach({
            video,
            viewerIdKey,
          })
          return () => {
            analytics.detach()
          }
        }
      })
    }
  }, [player?.current, viewerIdKey, analytics, options?.videoId])

  useEffect(() => {
    return () => {
      analytics.detach()
    }
  }, [])

  return {
    analytics,
    setDefaultPlayerConfig,
    defaultPlayerConfig,
  }
}
