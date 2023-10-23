//
// Copyright (c) oos, Inc. and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for more details.
//

import React, { useEffect } from 'react'
import { useAnalytics } from '../src/hooks'
import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { AnalyticsProvider } from '../src/analytics'
import { VideoPlayerConfig, VimePlayerConfig } from '../src/configs'

const defaultSrc = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

type TestVideoProps = {
  src?: string
  innerRef?: (ref: React.RefObject<HTMLVideoElement>) => void
}

const expectedActions = ['setup', 'play', 'seek', 'time']

let expectedActionIndex = 0
let expectedPlayerConfig = VideoPlayerConfig

const TestVideo = ({ src = defaultSrc, innerRef }: TestVideoProps) => {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const vimeRef = React.useRef<HTMLVmPlayerElement>(null)

  const { analytics, defaultPlayerConfig, setDefaultPlayerConfig } = useAnalytics<
    HTMLVmPlayerElement | HTMLVideoElement
  >(expectedPlayerConfig === VideoPlayerConfig ? videoRef : vimeRef, {
    send: (metrics) => {
      expect(metrics).not.toBeNull()
      expect(metrics.action).toBe(expectedActions[expectedActionIndex++])
    },
    timeInterval: 0,
  })

  useEffect(() => {
    innerRef?.(videoRef)
  }, [videoRef.current])

  useEffect(() => {
    if (defaultPlayerConfig) {
      expect(defaultPlayerConfig).toBe(expectedPlayerConfig)
      if (expectedPlayerConfig === VideoPlayerConfig) {
        expectedPlayerConfig = VimePlayerConfig
        setDefaultPlayerConfig(VimePlayerConfig)
      }
    }
  }, [defaultPlayerConfig])

  useEffect(() => {
    expect(analytics).not.toBeNull()
  }, [analytics])

  return <video data-testid={'video-player'} ref={videoRef} src={src} controls autoPlay />
}

test('play video', async () => {
  render(
    <AnalyticsProvider>
      <TestVideo />
    </AnalyticsProvider>,
  )

  const video = screen.getByTestId('video-player') as HTMLVideoElement

  await act(() => video.dispatchEvent(new window.Event('loading')))
  await act(() => video.dispatchEvent(new window.Event('play')))
  await act(() => video.dispatchEvent(new window.Event('seeking')))
  await act(() => video.dispatchEvent(new window.Event('seeked')))
  await act(() => video.dispatchEvent(new window.Event('playing')))
  await act(() => video.dispatchEvent(new window.Event('timeupdate')))
})
