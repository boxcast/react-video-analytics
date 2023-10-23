//
// Copyright (c) oos, Inc. and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for more details.
//

import { PlayerConfig } from '../analytics'

export const VideoPlayerConfig: PlayerConfig<HTMLVideoElement> = {
  getVideoElement: async (player) => {
    return player
  },
}
