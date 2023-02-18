import { useRef, useEffect, useCallback } from "react";

const VideoPlayer = ({
  streamLink,
  showStatic,
  name,
}: {
  streamLink: string;
  showStatic?: boolean;
  name: string;
}) => {
  const videoRef = useCallback(
    (node: HTMLVideoElement) => {
      if (!node) return;

      if (showStatic) {
        node.srcObject = null;
        node.play();
        return;
      }

      // https://github.com/deepch/RTSPtoWeb/blob/82a88e1c20b64c9d72e5337de9108831780de14c/docs/examples/webrtc/main.js
      const webRtc = new RTCPeerConnection();

      webRtc.ontrack = (event) => {
        node.srcObject = event.streams[0];
        node.play();
      };

      webRtc.addTransceiver("video", { direction: "recvonly" });

      webRtc.onnegotiationneeded = async () => {
        const offer = await webRtc.createOffer();
        await webRtc.setLocalDescription(offer);

        const response = await fetch(streamLink, {
          method: "POST",
          body: new URLSearchParams({
            data: btoa(webRtc.localDescription!.sdp),
          }),
        });

        const answer = await response.text();
        await webRtc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: atob(answer) })
        );
      };
    },
    [streamLink, showStatic]
  );

  return (
    <div className={"relative flex-1 w-0 bg-black"}>
      <video className={"w-full h-full"} ref={videoRef} muted autoPlay loop>
        <source src="/static.mp4" type="video/mp4"></source>
      </video>
      <div
        className={
          "absolute top-4 left-4 w-6 h-6 rounded-full bg-red-600 animate-blink"
        }
      ></div>
      <span className={"absolute top-4 right-4 bg-black text-white"}>
        {name}
      </span>
    </div>
  );
};

export default VideoPlayer;
