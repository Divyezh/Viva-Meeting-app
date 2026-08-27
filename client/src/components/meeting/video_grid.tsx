import type { PeerStream } from "../../types";
import VideoTile from "./video_tile";

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: PeerStream[];
  localUser: {
    userName: string;
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeaking?: boolean;
    avatarUrl?: string;
  };
  isScreenSharing?: boolean;
}

const VideoGrid = ({ localStream, peers, localUser, isScreenSharing = false }: VideoGridProps) => {
  const totalParticipants = 1 + peers.length;

  const getGridClasses = () => {
    switch (totalParticipants) {
      case 1:
        return "grid-cols-1 max-w-5xl max-h-[82vh]";
      case 2:
        return "grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[82vh]";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl max-h-[82vh]";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-[82vh]";
      case 5:
      case 6:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl max-h-[85vh]";
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl max-h-[85vh]";
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className={`grid h-full w-full gap-3 sm:gap-4 auto-rows-fr ${getGridClasses()}`}>
        {/* Remote Connected Peer Tiles */}
        {peers.map((peer) => (
          <div key={peer.peerId} className="min-h-55 h-full w-full">
            <VideoTile
              userName={peer.userName}
              isMuted={peer.isMuted}
              isCameraOff={peer.isCameraOff}
              isSpeaking={peer.isSpeaking}
              stream={peer.stream}
              avatarUrl={peer.avatarUrl}
            />
          </div>
        ))}

        {/* Local User Tile */}
        <div className="min-h-55 h-full w-full">
          <VideoTile
            userName={localUser.userName}
            isMuted={localUser.isMuted}
            isCameraOff={localUser.isCameraOff}
            isSpeaking={localUser.isSpeaking || false}
            stream={localStream}
            avatarUrl={localUser.avatarUrl}
            isLocal={true}
            isScreenSharing={isScreenSharing}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoGrid;
