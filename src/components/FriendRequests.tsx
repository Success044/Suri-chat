"use client";
import { Check, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import axios from "axios";
import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

interface FriendRequestsProps {
  incomingFriendRequests: IncomingFriendRequest[];
  sessionId: string;
}

const FriendRequests: FC<FriendRequestsProps> = ({
  incomingFriendRequests,
  sessionId,
}) => {
  const router = useRouter();
  const [FriendRequests, setFriendRequets] = useState<IncomingFriendRequest[]>(
    incomingFriendRequests
  );

  useEffect(() => {
    //pusher client to subscribe server provides this user. incoming friend request
    //listening to client
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_requests`)
    );
    const friendRequestHandler = ({
      senderId,
      senderEmail,
    }: IncomingFriendRequest) => {
      setFriendRequets((prev) => [...prev, { senderId, senderEmail }]);
    };

    //whenever incoming friend requests comes. trigger / bind with a function. friendReqeusthandler
    pusherClient.bind("incoming_friend_requests", friendRequestHandler);

    return () => {
      //cleanup function.
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_requests`)
      );
      pusherClient.unbind("incoming_friend_requests", friendRequestHandler);
    };
  }, []);

  const acceptFriend = async (senderId: string) => {
    await axios.post("/api/friends/accept", { id: senderId });
    setFriendRequets((prev) =>
      prev.filter((request) => request.senderId !== senderId)
    );
    router.refresh();
  };
  const denyFriend = async (senderId: string) => {
    await axios.post("/api/friends/deny", { id: senderId });
    setFriendRequets((prev) =>
      prev.filter((request) => request.senderId !== senderId)
    );
    router.refresh();
  };
  return (
    <>
      {FriendRequests.length === 0 ? (
        <p className="text-sm text-zinc-500 ">No Friend requests</p>
      ) : (
        FriendRequests.map((request) => (
          <div key={request.senderId} className="flex gap-4 items-center">
            <UserPlus className="text-black" />
            <p className="font-medium text-lg">{request.senderEmail}</p>
            <button
              aria-label="accept friend"
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md"
              onClick={() => acceptFriend(request.senderId)}
            >
              <Check className="font-semibold text-white w-3/4 h-3/4" />
            </button>
            <button
              aria-label="deny friend"
              className="w-8 h-8 bg-red-700 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md"
              onClick={() => denyFriend(request.senderId)}
            >
              <X className="font-semibold text-white w-3/4 h-3/4" />
            </button>
          </div>
        ))
      )}
    </>
  );
};

export default FriendRequests;
