import React, { useEffect } from 'react'
import { useAnalytics } from '../hooks'
import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

const defaultSrc = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

type TestVideoProps = {
  src?: string
  innerRef?: (ref: React.RefObject<HTMLVideoElement>) => void
}

const TestVideo = ({ src = defaultSrc, innerRef }: TestVideoProps) => {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  useAnalytics(videoRef, {
    send: (metrics) => {
      expect(metrics).not.toBeNull()
    },
    interval: 0,
  })

  useEffect(() => {
    innerRef?.(videoRef)
  }, [videoRef.current])

  return (
    <video data-testid={'video-player'} ref={videoRef} src={src} controls autoPlay />
  )
}

test('play video', async () => {
  render(
    <TestVideo />
  )

  const video = screen.getByTestId('video-player') as HTMLVideoElement
  await act(() => video.dispatchEvent(new window.Event('loading')))
  await act(() => video.dispatchEvent(new window.Event('play')))
  await act(() => video.dispatchEvent(new window.Event('seeking')))
  await act(() => video.dispatchEvent(new window.Event('seeked')))
  await act(() => video.dispatchEvent(new window.Event('playing')))
  await act(() => video.dispatchEvent(new window.Event('timeupdate')))
})

