import { PlayerConfig } from '../analytics'

export const VideoPlayerConfig: PlayerConfig<HTMLVideoElement> = {
  getVideoElement: async (player) => {
    return player
  },
}
