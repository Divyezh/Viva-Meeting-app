import { useMemo } from "react";
import type { PeerStream } from "../../types";
import VideoTile from "./video_tile";
import { Monitor, StopCircle } from "lucide-react";

interface VideoGridProps {
  localStream: MediaStream | null;
  screenStream?: MediaStream | null;
  peers: PeerStream[];
  localUser: {
    userId?: string;
    userName: string;
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeaking?: boolean;
    avatarUrl?: string;
  };
  isScreenSharing?: boolean;
  onStopScreenShare?: () => void;
}

const VideoGrid = ({
  localStream,
  screenStream,
  peers,
  localUser,
  isScreenSharing = false,
  onStopScreenShare,
}: VideoGridProps) => {
  // Deduplicate peers by userId and filter out any duplicate of localUser
  const uniquePeers = useMemo(() => {
    const seenUserIds = new Set<string>();
    return peers.filter((p) => {
      if (localUser.userId && p.userId === localUser.userId) {
        return false;
      }
      if (p.userId && seenUserIds.has(p.userId)) {
        return false;
      }
      if (p.userId) {
        seenUserIds.add(p.userId);
      }
      return true;
    });
  }, [peers, localUser.userId]);

  // Check if anyone is sharing screen
  const presenterPeer = useMemo(
    () => uniquePeers.find((p) => p.isScreenSharing),
    [uniquePeers]
  );
  const isAnyScreenSharing = isScreenSharing || !!presenterPeer;

  const totalParticipants = 1 + uniquePeers.length;

  const getGridClasses = () => {
    switch (totalParticipants) {
      case 1:
        return "grid-cols-1 max-w-4xl max-h-[80vh]";
      case 2:
        return "grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-[80vh]";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-7xl max-h-[80vh]";
      case 4:
        return "grid-cols-2 max-w-5xl max-h-[82vh]";
      case 5:
      case 6:
        return "grid-cols-2 sm:grid-cols-3 max-w-7xl max-h-[84vh]";
      case 7:
      case 8:
      default:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl max-h-[86vh]";
    }
  };

  // ─── 1. SPOTLIGHT PRESENTATION MODE ───
  if (isAnyScreenSharing) {
    return (
      <div className="flex h-full w-full flex-col p-2 sm:p-4 pb-28 sm:pb-32 overflow-hidden gap-3">
        {/* Presenter Status Bar */}
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md shadow-md">
            <Monitor className="h-3.5 w-3.5 text-lime-400 animate-pulse" />
            <span>
              {isScreenSharing
                ? "You are sharing your screen"
                : `${presenterPeer?.userName || "Participant"} is presenting`}
            </span>
          </div>

          {isScreenSharing && onStopScreenShare && (
            <button
              onClick={onStopScreenShare}
              className="flex items-center gap-1.5 rounded-full bg-red-600/90 hover:bg-red-600 px-3.5 py-1 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>Stop Presenting</span>
            </button>
          )}
        </div>

        {/* Main Stage: Presenter Screen Tile */}
        <div className="relative flex-1 w-full min-h-0 rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/40 bg-[#081307]">
          {isScreenSharing ? (
            <VideoTile
              userName={localUser.userName}
              isMuted={localUser.isMuted}
              isCameraOff={localUser.isCameraOff}
              isSpeaking={localUser.isSpeaking || false}
              stream={screenStream || localStream}
              avatarUrl={localUser.avatarUrl}
              isLocal={true}
              isScreenSharing={true}
            />
          ) : (
            presenterPeer && (
              <VideoTile
                userName={presenterPeer.userName}
                isMuted={presenterPeer.isMuted}
                isCameraOff={presenterPeer.isCameraOff}
                isSpeaking={presenterPeer.isSpeaking}
                stream={presenterPeer.stream}
                avatarUrl={presenterPeer.avatarUrl}
                isScreenSharing={true}
              />
            )
          )}
        </div>

        {/* Bottom Filmstrip of Other Participants */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 shrink-0 h-32 sm:h-36 scrollbar-thin">
          {/* If presenter is a peer, render local user in filmstrip */}
          {!isScreenSharing && (
            <div className="h-full w-44 sm:w-52 shrink-0">
              <VideoTile
                userName={localUser.userName}
                isMuted={localUser.isMuted}
                isCameraOff={localUser.isCameraOff}
                isSpeaking={localUser.isSpeaking || false}
                stream={localStream}
                avatarUrl={localUser.avatarUrl}
                isLocal={true}
                isScreenSharing={false}
              />
            </div>
          )}

          {/* Render remaining peers */}
          {uniquePeers
            .filter((p) => p.peerId !== presenterPeer?.peerId)
            .map((peer) => (
              <div key={peer.peerId} className="h-full w-44 sm:w-52 shrink-0">
                <VideoTile
                  userName={peer.userName}
                  isMuted={peer.isMuted}
                  isCameraOff={peer.isCameraOff}
                  isSpeaking={peer.isSpeaking}
                  stream={peer.stream}
                  avatarUrl={peer.avatarUrl}
                  isScreenSharing={false}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }

  // ─── 2. STANDARD BALANCED GRID MODE (OPTIMIZED FOR UP TO 8 PARTICIPANTS) ───
  return (
    <div className="flex h-full w-full items-center justify-center p-2 sm:p-4 pb-28 sm:pb-32 overflow-hidden">
      <div className={`grid h-full w-full gap-2 sm:gap-3.5 auto-rows-fr place-items-center items-center justify-center ${getGridClasses()}`}>
        {/* Remote Connected Peer Tiles (Deduplicated) */}
        {uniquePeers.map((peer) => (
          <div key={peer.peerId} className="min-h-0 min-w-0 h-full w-full aspect-video flex items-center justify-center">
            <VideoTile
              userName={peer.userName}
              isMuted={peer.isMuted}
              isCameraOff={peer.isCameraOff}
              isSpeaking={peer.isSpeaking}
              stream={peer.stream}
              avatarUrl={peer.avatarUrl}
              isScreenSharing={peer.isScreenSharing}
            />
          </div>
        ))}

        {/* Local User Tile */}
        <div className="min-h-0 min-w-0 h-full w-full aspect-video flex items-center justify-center">
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
