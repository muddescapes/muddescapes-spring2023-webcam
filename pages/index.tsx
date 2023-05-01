import VideoPlayer from "@/components/VideoPlayer";
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import mqtt from "mqtt";

function Overlay({ success, visible }: { success: boolean; visible: boolean }) {
  return !visible ? null : (
    <div
      className={
        "absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-6xl pointer-events-none z-50"
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
  const [camerasDisabled, setCamerasDisabled] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center">
      <form
        className="mt-7 mb-7"
        onSubmit={(e) => {
          if (!unlocked) {
            setOverlayVisible(true);
            setTimeout(() => setOverlayVisible(false), 2000);
          }

          if (pw === "ART42" && !unlocked) {
            setUnlocked(true);
          }
          e.preventDefault();
        }}
      >
        <label htmlFor="pw">Enter password:</label>
        <div className="flex items-center">
          <input
            type="text"
            name="pw"
            className="outline outline-1 h-6"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            disabled={unlocked}
          />
          <button
            type="submit"
            className="outline outline-1 ml-1"
            disabled={unlocked}
          >
            <ArrowRightIcon className="w-6 h-6 mt-auto mb-auto" />
          </button>
        </div>
      </form>
      <div className="relative overflow-visible whitespace-nowrap">
        <Overlay success={unlocked} visible={overlayVisible}></Overlay>
        <button
          className={
            "relative m-6 p-3 text-lg animate-none " +
            (!unlocked
              ? "bg-gray-300 pointer-events-none text-gray-400"
              : camerasDisabled
              ? "bg-gray-300 pointer-events-none text-gray-400 line-through"
              : "bg-green-400 hover:bg-green-500")
          }
          onClick={() => {
            setCamerasDisabled(true);
            onDisableCameras();
          }}
          disabled={!unlocked}
        >
          Disable cameras
          {/* make the background a child so the animation doesn't affect the button */}
          {!unlocked ? (
            <LockClosedIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-black" />
          ) : !camerasDisabled ? (
            <div className="absolute top-0 left-0 right-0 bottom-0 -m-3 bg-green-200 -z-10 animate-fade" />
          ) : (
            <CheckIcon className="absolute h-12 top-1/2 right-0 translate-x-full -translate-y-1/2 text-green-500" />
          )}
        </button>
      </div>
    </div>
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
          streamLink="http://localhost:8889/muddescapes-camera-1/"
          stopRecording={camerasDisabled}
        ></VideoPlayer>
        <VideoPlayer
          name="Camera 2 - Security"
          showStatic={camerasDisabled}
          streamLink="http://localhost:8889/muddescapes-cam-2/"
          stopRecording={camerasDisabled}
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
