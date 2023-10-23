//
// Copyright (c) oos, Inc. and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for more details.
//

import { PlayerConfig } from '../analytics'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { VmVideo } from '@vime/core' // Ensures types from Vime are included

export const VimePlayerConfig: PlayerConfig<HTMLVmPlayerElement> = {
  getVideoElement: async (player) => {
    const adapter = await player.getAdapter()
    const internalPlayer = await adapter?.getInternalPlayer()
    if (internalPlayer) {
      return internalPlayer._media as HTMLVideoElement
    }
    return null
  },
}
