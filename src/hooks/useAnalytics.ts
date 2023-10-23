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
}

export function useAnalytics<PlayerElement>(player: RefObject<PlayerElement>, options?: AnalyticOptions) {
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

  useEffect(() => {
    if (player.current) {
      getVideoElement(player.current, options?.playerConfig).then((video) => {
        if (video) {
          analytics.attach({
            video,
            viewerIdKey,
          })
        }
      })
    }
  }, [player?.current])

  return {
    analytics,
    setDefaultPlayerConfig,
    defaultPlayerConfig,
  }
}
