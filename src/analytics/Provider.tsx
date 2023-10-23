import React, { createContext } from 'react'
import { VideoPlayerConfig } from '../players'

export type PlayerConfig<Player = unknown> = {
  getVideoElement: <P extends Player>(player: P) => Promise<HTMLVideoElement | null>
}

type ContextData = {
  getVideoElement: <Player>(player: Player, config?: PlayerConfig) => Promise<HTMLVideoElement | null>
  defaultPlayerConfig: PlayerConfig
  setDefaultPlayerConfig: (config: PlayerConfig) => void
  defaultTimeInterval?: number
  viewerIdKey?: string
}

type AnalyticsProviderProps = {
  defaultPlayer?: PlayerConfig
  defaultTimeInterval?: number
  viewerIdKey?: string
}

export const AnalyticsContext = createContext<ContextData>({
  setDefaultPlayerConfig: () => {},
  defaultPlayerConfig: VideoPlayerConfig,
  getVideoElement: () => Promise.resolve(document.createElement('video')),
})

export function AnalyticsProvider({
  defaultPlayer,
  viewerIdKey,
  defaultTimeInterval,
  children,
}: React.PropsWithChildren<AnalyticsProviderProps>) {
  const [defaultPlayerConfig, setDefaultPlayerConfig] = React.useState(defaultPlayer || VideoPlayerConfig)

  async function getVideoElement<Player>(player: Player, config: PlayerConfig = defaultPlayerConfig) {
    return config.getVideoElement(player)
  }

  return (
    <AnalyticsContext.Provider
      value={{
        defaultPlayerConfig,
        viewerIdKey,
        defaultTimeInterval,
        setDefaultPlayerConfig,
        getVideoElement,
      }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
