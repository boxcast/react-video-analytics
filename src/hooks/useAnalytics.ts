import { RefObject, ForwardedRef, useContext, useEffect, useMemo } from 'react'
import Analytics, { AnalyticsContext, Players } from '../analytics'
import { ReportMetrics } from '../analytics'

export type AnalyticOptions = {
  send?: (metrics: ReportMetrics) => Promise<void> | void
  maxAttempts?: number
  onRequeue?: (metrics: ReportMetrics) => Promise<void> | void
  onQueue?: (metrics: ReportMetrics) => Promise<void> | void
  onComplete?: (metrics: ReportMetrics) => Promise<void> | void
  onError?: (metrics: ReportMetrics) => Promise<void> | void
  onFail?: (metrics: ReportMetrics) => Promise<void> | void
  player?: keyof Players
  interval?: number
}

export function useAnalytics<PlayerElement>(player: RefObject<PlayerElement>, options?: AnalyticOptions) {
  const analytics = useMemo(() => new Analytics(options), [])
  const { getPlayer, viewerIdKey } = useContext(AnalyticsContext)

  const p = getPlayer(options?.player)

  useEffect(() => {
    if (player.current && p) {
      const v = p.getVideoElement(player.current)
      if ('then' in v) {
        v.then((video) => {
          analytics.attach({
            video,
            viewerIdKey,
          })
        })
      } else {
        analytics.attach({
          video: v,
          viewerIdKey,
        })
      }
    }
  }, [player?.current])

  return {
    analytics,
  }
}
