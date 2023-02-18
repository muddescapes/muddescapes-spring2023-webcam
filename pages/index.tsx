import VideoPlayer from "@/components/VideoPlayer";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import mqtt from "mqtt";

function Overlay({ success, visible }: { success: boolean; visible: boolean }) {
  return !visible ? null : (
    <div
      className={
        "absolute top-0 left-0 w-full h-full flex items-center justify-center text-6xl pointer-events-none"
      }
    >
      <span
        className={"text-6xl p-4 " + (success ? "bg-green-600" : "bg-red-600")}
      >
        {success ? "ACCESS GRANTED" : "ACCESS DENIED"}
      </span>
    </div>
  );
}

function Settings({ onDisableCameras }: { onDisableCameras: () => void }) {
  const [pw, setPw] = useState<string>("");
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(false);

  return (
    <>
      <Overlay success={unlocked} visible={overlayVisible}></Overlay>
      <div className="flex flex-col items-center">
        <form
          className="mt-3 flex"
          onSubmit={(e) => {
            if (!unlocked) {
              setOverlayVisible(true);
              setTimeout(() => setOverlayVisible(false), 2000);
            }

            if (pw === "pica$50" && !unlocked) {
              setUnlocked(true);
            }
            e.preventDefault();
          }}
        >
          <label htmlFor="pw">Admin password:</label>
          <input
            type="text"
            name="pw"
            className="outline outline-1 ml-2"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button type="submit">
            <ArrowLeftIcon className="w-5 h-5 mt-auto mb-auto" />
          </button>
        </form>
        <button
          className={
            unlocked
              ? "bg-red-300 hover:bg-red-400 p-2 m-2 rounded-lg"
              : "relative bg-gray-300/25 p-2 m-2 rounded-lg text-black/25"
          }
          onClick={() => onDisableCameras()}
          disabled={!unlocked}
        >
          Disable cameras
          {!unlocked && (
            <div className="flex items-center justify-center absolute top-0 left-0 w-full h-full text-black">
              <LockClosedIcon className="w-5 h-5" />
            </div>
          )}
        </button>
      </div>
    </>
  );
}

export default function Home() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [camerasDisabled, setShowStatic] = useState(false);

  const CAMERAS_DISABLED_TOPIC = "muddescapes/data/Security Cameras/disabled";

  useEffect(() => {
    const client = mqtt.connect("wss://broker.hivemq.com:8884", {
      path: "/mqtt",
    });

    function sendState() {
      // hack to not add camerasDisabled as a dependency
      // otherwise, client will disconnect and reconnect when camerasDisabled changes
      setShowStatic((curr) => {
        client.publish(CAMERAS_DISABLED_TOPIC, curr ? "1" : "0", {
          qos: 2,
        });
        return curr;
      });
    }

    client.on("connect", () => {
      console.debug("connected");
      sendState();

      // subscribe to general topic to know when to send state
      client.subscribe("muddescapes", { qos: 2 });
    });

    client.on("message", (topic, message) => {
      sendState();
    });

    setClient(client);

    return () => {
      client.end();
    };
  }, []);

  return (
    <>
      <div className="flex">
        <VideoPlayer
          name="Camera 1 - Main Gallery"
          showStatic={camerasDisabled}
          streamLink="http://localhost:8083/stream/cam1/channel/0/webrtc?uuid=cam1&channel=0"
        ></VideoPlayer>
        <VideoPlayer
          name="Camera 2 - Security"
          showStatic={camerasDisabled}
          streamLink="http://localhost:8083/stream/cam2/channel/0/webrtc?uuid=cam2&channel=0"
        ></VideoPlayer>
      </div>
      <Settings
        onDisableCameras={() => {
          setShowStatic(true);
          client?.publish(CAMERAS_DISABLED_TOPIC, "1", { qos: 2 });
        }}
      ></Settings>
    </>
  );
}
