import React, { createContext } from 'react'
import { VideoPlayerConfig, VimePlayerConfig } from '../players'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlayerConfig<Player = any> = {
  // An intentional use of type 'any'
  getVideoElement: (player: Player) => Promise<HTMLVideoElement> | HTMLVideoElement
}

export type DefaultPlayers = {
  vime: PlayerConfig
  video: PlayerConfig
  [key: string]: PlayerConfig
}

export type Players = DefaultPlayers

type ContextData<P extends Players = Players> = {
  getPlayer: (name?: keyof P) => PlayerConfig
  players: P
  viewerIdKey?: string
}

type AnalyticsProviderProps<P extends Players = Players> = {
  players?: P
  defaultPlayer?: keyof P
}

const defaultPlayers: Players = {
  vime: VimePlayerConfig,
  video: VideoPlayerConfig,
}

export const AnalyticsContext = createContext<ContextData>({
  getPlayer: () => VideoPlayerConfig,
  players: defaultPlayers,
})

export function AnalyticsProvider<P extends Players>({
  players,
  defaultPlayer = 'video',
  children,
}: React.PropsWithChildren<AnalyticsProviderProps<P>>) {
  const playersRef = React.useRef({
    ...defaultPlayers,
    ...players,
  })

  const getPlayer = (name = defaultPlayer as keyof Players): PlayerConfig => {
    return playersRef.current[name]
  }

  return (
    <AnalyticsContext.Provider
      value={{
        getPlayer,
        players: playersRef.current,
      }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
