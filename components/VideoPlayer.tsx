const VideoPlayer = ({
  streamLink,
  showStatic,
  name,
  stopRecording,
}: {
  streamLink: string;
  showStatic?: boolean;
  stopRecording?: boolean;
  name: string;
}) => {
  let content = (
    <video className={"w-full h-full"} muted autoPlay loop>
      <source src="/static.mp4" type="video/mp4"></source>
    </video>
  );
  if (!showStatic) {
    content = (
      <iframe
        className={"w-full h-[50vh] pointer-events-none"}
        src={streamLink}
      ></iframe>
    );
  }

  return (
    <div className={"relative flex-1 w-0 bg-black"}>
      {content}
      {!stopRecording && (
        <div
          className={
            "absolute top-4 left-4 w-6 h-6 rounded-full bg-red-600 animate-blink"
          }
        ></div>
      )}
      <span className={"absolute top-4 right-4 bg-black text-white"}>
        {name}
      </span>
    </div>
  );
};

export default VideoPlayer;
