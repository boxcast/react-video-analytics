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
            - [Types](#types)
                - [PlayerConfig<Player = unknown>](#playerconfigplayer--unknown)
        - [useAnalytics](#useanalytics)
            - [Options](#options)
            - [Types](#types-1)
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
Begin by wrapping your app with the [AnalyticsProvider](#analyticsprovider).

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
Using the [useAnalytics](#useanalytics) hook, attach a reference to your video player.

```tsx
import { useAnalytics } from 'react-video-analytics'

const MyComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useAnalytics(videoRef)
  
  return (
    <video ref={videoRef} />
  )
}
```

### Send
Implement the `send` [option](#options) to send metrics to your analytics service. The `send` function will be called every time the video player emits a [ReportAction](#reportaction) which you can reference via `metrics.action`. The following example uses [axios](https://axios-http.com/) to post the metrics payload to an API endpoint:

```tsx
import axios from 'axios'
import { useAnalytics } from 'react-video-analytics'

const MyComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useAnalytics(videoRef, {
    send: (metrics) => {
      // Send metrics to your analytics service
      axios.post('https://my-api.com/video-analytics', metrics)
    }
  })
  
  return (
    <video ref={videoRef} />
  )
}
```

## API

### AnalyticsProvider
Use the `AnalyticsProvider` to create custom video player configurations. By default, `react-video-analytics` supports a standard HTML video player. It also ships with an optional `VimePlayerConfig` that you can use instead if your project uses a [Vime](https://vimejs.com/) video player. 

#### Props
| Prop                           | Type                          | Default value                       | Description                                                                                  | 
|--------------------------------|-------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------|
| defaultPlayerConfig (optional) | [PlayerConfig](#playerconfig) | `VideoPlayerConfig`                 | Provides the default player configuration to use.                                            |
| defaultTimeInterval (optional) | `number`                      | `30000`                              | The default interval, in milliseconds, to call `send` when the `timeupdate` event is emitted |
| viewerIdKey (optional)         | `string`                      | `'react-video-analytics-viewer-id'` | The storage key name to use for storing the viewer's unique identifier.                      |

#### Types

##### `PlayerConfig<Player = unknown>`

| Prop            | Type                                                         | Description                                                                          |
|-----------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------|
| getVideoElement | `<P extends Player>(player: P) => Promise<HTMLVideoElement>` | Defines how to retreive the html video element from a generic video player component |


#### Examples
Using a custom player component:

```tsx
import { PlayerConfig } from 'react-video-analytics'

...

return (
  <AnayticsProvider
    defaultPlayerConfig={{ 
      getVideoElement: (player: SomeCustomPlayer) => {
        // Write logic to return the html video element from your custom player
      } 
    } as PlayerConfig<SomeCustomPlayer> }
  >
    <App/>
  </AnayticsProvider>
)

...
```
Using the [Vime](https://vimejs.com/) video player component:

```tsx
import { VimePlayerConfig } from 'react-video-analytics'

...

return (
  <AnayticsProvider
    defaultPlayerConfig={VimePlayerConfig}
  >
    <App/>
  </AnayticsProvider>
)

...
```

### useAnalytics
The `useAnalytics` hook requires a reference to your video player component. It also accepts an optional `options` object that allows you to customize how metrics are handled and sent to your analytics service.

#### Options
| Prop                    | Type                                               | Default             | Description                                                                                              |
|-------------------------|----------------------------------------------------|---------------------|----------------------------------------------------------------------------------------------------------|
| send (optional)         | (metrics: [ReportMetrics](#reportmetrics)) => void               | `-`                 | Describes how to post metrics to your analytics service                                                  |
| maxAttempts (optional)  | `number`                                           | `5`                 | Maximum number of times to attempt to send metrics before calling `onFail`                               |
| playerConfig (optional) | `PlayerConfig`                                     | `VideoPlayerConfig` | The player configuration to use corresponding to the player component reference passed to `useAnalytics` |
| timeInterval (optional) | `number`                                           | `30000`             | The interval, in milliseconds, to call `send` when the `timeupdate` event is emitted                     |
| onQueue (optional)      | (metrics: [ReportMetrics](#reportmetrics)) => void | `-`                 | Called when metrics are queued to be sent                                                                |
| onComplete (optional)   | (metrics: [ReportMetrics](#reportmetrics)) => void                 | `-`                 | Called when metrics are successfully sent                                                                |
| onError (optional)      | (metrics: [ReportMetrics](#reportmetrics)) => void                 | `-`                 | Called when metrics fail to be sent                                                                      |
| onRequeue (optional)    | (metrics: [ReportMetrics](#reportmetrics)) => void                | `-`                 | Called when metrics are requeued to be sent                                                              |
| onFail (optional)       | (metrics: [ReportMetrics](#reportmetrics)) => void                | `-`                 | Called when metrics fail to be sent after `maxAttempts`                                                  |

#### Types
`ReportMetrics`

| Prop                  | Type                            | Description                                                                                  |
|-----------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| timestamp             | `string`                        | The timestamp when the metric was created                                                    |
| hourOfDay             | `number`                        | The hour of day when the metric was created                                                  |
| dayOfWeek             | `number`                        | The day of the week when the metric was created                                              |
| action                | [ReportAction](#reportaction)   | The action that generated the metric                                                         |
| position              | `number`                        | The current time (position), in seconds, of the video player                                 |
| duration              | `number`                        | The total duration, in seconds, of the video being played                                    |
| durationBuffering     | `number`                        | The time spent buffering, in seconds, whenever the video finishes buffering                  |
| browser (optional)    | [BrowserState](#browserstate)   | Details about the browser being used to watch the video                                      |
| headers (optional)    | [ReportHeaders](#reportheaders) | The view and viewer ID of the video session                                                  |
| error (optional)      | [ReportError](#reporterror)     | Error details. Particularly useful when `onError`, `onRequeue`, or `onFail` are called       |
| __attempts (optional) | `number`                        | The total number of attempts to send metrics. Particularly useful when `onRequeue` is called |

##### `ReportAction`

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

##### `BrowserState`

| Prop                      | Type     | Description                                                 |
|---------------------------|----------|-------------------------------------------------------------|
| host                      | `string` | The host domain that the video is being watched on.         |
| os                        | `string` | The operating system that the video is being watched on.    |
| browserName (optional)    | `string` | The name of the browser that the video is being watched on. |
| browserVersion (optional) | `string` | The browser version that the video is being watched on.     |

##### `ReportHeaders`

| Prop     | Type     | Description                                                                                                                  |
|----------|----------|------------------------------------------------------------------------------------------------------------------------------|
| viewId   | `string` | An identifier for the video's current view (session). Use this for tracking the number of views on your video.               |
| viewerId | `string`  | An identifier for the unique viewer (user) watching the video. Use this to track the number of unique viewers of your video. |

##### `ReportError`

| Prop              | Type              | Description                                                           |
|-------------------|-------------------|-----------------------------------------------------------------------|
| message           | `string`          | A message describing the error that occurred.                         |
| code              | `string`          | A code associated to the error that occurred.                         |
| data              | `object`          | A object containing additional details about the error that occurred. |
| source (optional) | `unknown` | A potential reference to the error's source.                          |

## Authors

* **Colin Hooper** - *Initial work* - [colin-oos](https://github.com/colin-oos)

See also the list of [contributors](https://github.com/oos-studio/react-video-analytics/contributors) who participated in this project.

## License

[MIT License](https://andreasonny.mit-license.org/2019) © oos