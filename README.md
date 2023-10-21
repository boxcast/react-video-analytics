![GitHub](https://img.shields.io/github/license/oos-studio/react-video-analytics)
![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/oos-studio/react-video-analytics)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)


# React Video Analytics

> Easily generate and post video player metrics

## Table of contents

- [React Video Analytics](#react-video-analytics)
    - [Installation](#installation)
    - [Usage](#usage)
        - [Setup](#setup)
        - [Attach](#attach)
        - [Send](#send)
    - [API](#api)
        - [AnalyticsProvider](#analyticsprovider)
            - [Props](#props)
            - [PlayerConfig](#playerconfigplayer--any)
        - [useAnalytics](#useanalytics)
            - [Options](#options)
            - [ReportMetrics](#reportmetrics)
            - [ReportAction](#reportaction)
            - [BrowserState](#browserstate)
            - [ReportHeaders](#reportheaders)
            - [ReportError](#reporterror)
    - [Authors](#authors)
    - [License](#license)

## Installation

To install and set up the library, run:

```sh
$ npm install --save react-video-analytics
```

Or if you prefer using Yarn:

```sh
$ yarn add react-video-analytics
```

## Usage

### Setup
Begin by wrapping your app with the `AnalyticsProvider`.

```tsx
import { AnalyticsProvider } from 'react-video-analytics'

...

return (
  <AnalyticsProvider>
    <App />
  </AnalyticsProvider>
)
````

### Attach
Using the `useAnalytics` hook, attach a reference to your video player.

```tsx
import { useAnalytics } from 'react-video-analytics'

const MyComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useAnalytics(videoRef, {
    send: (metrics) => {
      // Send metrics to your analytics service
    }
  })
  
  return (
    <video ref={videoRef} />
  )
}
```

### Send
Implement the `send` option to send metrics to your analytics service. The `send` function will be called every time the video player emits one of the following events. 

***Note:*** The `metrics` object contains an `action` property of type `ReportAction` corresponding to the event that was emitted.

| Event        | Description                                                                                                | ReportAction |
|--------------|------------------------------------------------------------------------------------------------------------|--------------|
| `play`       | Whenever the video player is played                                                                        | `play`       |
| `pause`      | Whenever the video player is paused                                                                        | `pause`      |
| `seeking`    | Whenever the video player begins seeking                                                                   | `seek`       |
| `resize`     | Whenever the video player quality setting is changed                                                       | `quality`    |
| `complete`   | Whenever the video player finishes playing the video                                                       | `complete`   |
| `timeupdate` | Whenever the video player position changes. By default this will call the `send` function every 30 seconds | `time`       |
| `stalled`     | Whenever the video player begins buffering.                                                                | `buffer`      |

## API

### AnalyticsProvider
Use the `AnalyticsProvider` to create custom video player configurations. By default, `react-video-analytics` supports a standard HTML video player and the [Vime](https://vimejs.com/) video player. 

#### Props
| Prop          | Type                          | Default value                                                                            | 
|---------------|-------------------------------|------------------------------------------------------------------------------------------|
| players       | Dictionary of `PlayerConfig`s | `video`:`PlayerConfig<HTMLVideoElement>`<br/>`vimeo`:`PlayerConfig<HTMLVmPlayerElement>` |
| defaultPlayer | key of `players`                | `video`                                                                                   |

#### PlayerConfig<Player = any>
| Prop            | Type                                                                    | Description                                                                          |
|-----------------|-------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| getVideoElement | `(player: Player) => Promise<HTMLVideoElement> &#124; HTMLVideoElement` | Defines how to retreive the html video element from a generic video player component |


Example:

```tsx
...

return (
  <AnayticsProvider
    players={{
      video: {
        getVideoElement: (player: HTMLVideoElement) => {
          return player
        }
      } as PlayerConfig<HTMLVideoElement>,
      vime: {
        getVideoElement: async (player: HTMLVmPlayerElement) => {
          const adapter = await player.getAdapter()
          const internalPlayer = await adapter?.getInternalPlayer()
          if (internalPlayer) {
            return internalPlayer._media
          }
        }
      } as PlayerConfig<HTMLVmPlayerElement>,
      custom: {
        getVideoElement: (player: SomeCustomPlayer) => {
          // Write logic to return the html video element from your custom player
        }
      } as PlayerConfig<SomeCustomPlayer>
    }}
    // Set the default player to vime and pass a reference to the vime player when using the `useAnalytics` hook
    defaultPlayer={'vime'}
  >
    <App />
  </AnayticsProvider>
)

...
```

### useAnalytics

#### Options
| Prop        | Type                                                          | Default | Description                                                                |
|-------------|---------------------------------------------------------------|---------|----------------------------------------------------------------------------|
| send        | `(metrics: ReportMetrics) => void &#124; undefined`           | `-`     | Describes how to post metrics to your analytics service                    |
| maxAttempts | `number &#124; undefined`                                     | `5`     | Maximum number of times to attempt to send metrics before calling `onFail` |
| player      | key of `players` passed to `AnalyticsProvider` or `undefined` | `video` | The player configuration to use corresponding to the player component reference passed to `useAnalytics` |
| interval    | `number &#124; undefined`                                     | `30000` | The interval in milliseconds to call `send` when the `timeupdate` event is emitted |
| onQueue     | `(metrics: ReportMetrics) => void &#124; undefined`           | `-`     | Called when metrics are queued to be sent                                  |
| onComplete  | `(metrics: ReportMetrics) => void &#124; undefined`           | `-`     | Called when metrics are successfully sent                                   |
| onError     | `(metrics: ReportMetrics) => void &#124; undefined`           | `-`     | Called when metrics fail to be sent                                         |
| onRequeue   | `(metrics: ReportMetrics) => void &#124; undefined`           | `-`     | Called when metrics are requeued to be sent                                 |
| onFail      | `(metrics: ReportMetrics) => void &#124; undefined`           | `-`     | Called when metrics fail to be sent after `maxAttempts`                    |

#### ReportMetrics

| Prop              | Type                             | Description                                                                                  |
|-------------------|----------------------------------|----------------------------------------------------------------------------------------------|
| timestamp         | `string`                         | The timestamp when the metric was created                                                    |
| hourOfDay         | `number`                         | The hour of day when the metric was created                                                  |
| dayOfWeek         | `number`                         | The day of the week when the metric was created                                              |
| action            | `ReportAction`                   | The action that generated the metric                                                         |
| position          | `number`                         | The current time (position), in seconds, of the video player                                 |
| duration          | `number`                         | The total duration, in seconds, of the video being played                                    |
| durationBuffering | `number`                         | The time spent buffering, in seconds, whenever the video finishes buffering                  |
| browser           | `BrowserState &#124; undefined`  | Details about the browser being used to watch the video                                      |
| headers           | `ReportHeaders &#124; undefined` | The view and viewer ID of the video session                                                  |
| error             | `ReportError &#124; undefined`   | Error details. Particularly useful when `onError`, `onRequeue`, or `onFail` are called       |
| __attempts        | `number &#124; undefined`         | The total number of attempts to send metrics. Particularly useful when `onRequeue` is called |

#### ReportAction
| Value      | Description                                                                                 |
|------------|---------------------------------------------------------------------------------------------|
| `complete` | The video completed playing                                                                 |
| `pause`    | The video player was paused                                                                 |
| `play`     | The video player was played                                                                 |
| `quality`  | The video quality setting was changed                                                       |
| `seek`     | The video player began seeking                                                              |
| `buffer`   | The video player began buffering                                                            |
| `time`     | The video player's current time was updated. By default this action occurs every 30 seconds. |
| `setup`    | The initial report action                                                                   |
| `error`     | A playback error occurred                                                                   |

#### BrowserState
| Prop           | Type                      | Description                                                                 |
|----------------|---------------------------|-----------------------------------------------------------------------------|
| host           | `string`                  |                                                                             |
| os             | `string`                  |                                                                             |
| browserName    | `string &#124; undefined` |                                                                             |
| browserVersion | `string &#124; undefined` |                                                                             |
| playerVersion  | `string &#124; undefined`  |                                                                             |

#### ReportHeaders
| Prop     | Type     | Description                                                                                                                  |
|----------|----------|------------------------------------------------------------------------------------------------------------------------------|
| viewId   | `string` | An identifier for the video's current view (session). Use this for tracking the number of views on your video.               |
| viewerId | `string`  | An identifier for the unique viewer (user) watching the video. Use this to track the number of unique viewers of your video. |

#### ReportError
| Prop    | Type                      | Description                                                                 |
|---------|---------------------------|-----------------------------------------------------------------------------|
| message | `string`                  |                                                                             |
| code    | `string`                  |                                                                             |
| data    | `object`                  |                                                                             |
| source  | `unknown &#124; undefined` |                                                                             |

## Authors

* **Colin Hooper** - *Initial work* - [colin-oos](https://github.com/colin-oos)

See also the list of [contributors](https://github.com/oos-studio/react-video-analytics/contributors) who participated in this project.

## License

[MIT License](https://andreasonny.mit-license.org/2019) © oos