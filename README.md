# muddescapes-spring2023-webcam

A interactive website for use during the 2023 MuddEscapes room.

## Usage

Build [RTSPToWeb](https://github.com/deepch/RTSPtoWeb)

`env GOOS=windows GOARCH=amd64 go build`

Modify the `config.json` file in `RTSPToWeb` to point to the correct RTSP streams

Modify the `streamLink` variables in `index.tsx` to point to the correct WebRTC streams
