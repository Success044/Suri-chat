"use client";
import { pusherClient } from "@/lib/pusher";
import { cn, toPusherKey } from "@/lib/utils";
import { Message } from "@/lib/validations/message";
import { format } from "date-fns";
import Image from "next/image";
import { FC, useEffect, useRef, useState } from "react";

interface MessagesProps {
  initialMessages: Message[];
  sessionId: string;
  chatId: string;
  sessionImg: string | null | undefined;
  chatPartner: User;
}

const Messages: FC<MessagesProps> = ({
  initialMessages,
  sessionId,
  chatId,
  sessionImg,
  chatPartner,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const scrollDownRef = useRef<HTMLDivElement | null>(null);
  const formatTimestamp = (timestamp: number) => {
    return format(timestamp, "HH:mm:ss");
  };

  useEffect(() => {
    //pusher client to subscribe server provides this user. incoming friend request
    //listening to client
    pusherClient.subscribe(toPusherKey(`chat:${chatId}`));
    const messageHandler = (message: Message) => {
      setMessages((prev) => [message, ...prev]);
      // return format(new Date(timestamp), "HH:mm:ss");
    };

    //whenever incoming friend requests comes. trigger / bind with a function. friendReqeusthandler
    pusherClient.bind("incoming-message", messageHandler);

    return () => {
      //cleanup function.
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`));
      pusherClient.unbind("incoming-message", messageHandler);
    };
  }, [chatId]);

  //flex-col-reverse. will show message upsidedown
  return (
    <div
      id="messages"
      className="flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scollbar-thumb-rounded scrollbar-track-blue-lighter scollbar-w-2 scrolling-touch"
    >
      <div ref={scrollDownRef} />
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === sessionId;
        const hasNextMessageFromSameuser =
          messages[index - 1]?.senderId === messages[index].senderId;
        return (
          <div
            key={`${message.id}-${message.timestamp}`}
            className="chat-message"
          >
            <div
              className={cn("flex items-end", {
                "justify-end": isCurrentUser,
              })}
            >
              <div
                className={cn(
                  "flex flex-col space-y-2 text-base max-w-xs mx-2",
                  {
                    "order-1 items-end": isCurrentUser,
                    "order-2 items-start": !isCurrentUser,
                  }
                )}
              >
                <span
                  className={cn("px-4 py-2 rounded-lg inline-block", {
                    "bg-indigo-600 text-white": isCurrentUser,
                    "bg-gray-200 text-gray-900": !isCurrentUser,
                    "rounded-br-none":
                      !hasNextMessageFromSameuser && isCurrentUser,
                    "rounded-bl-none":
                      !hasNextMessageFromSameuser && !isCurrentUser,
                  })}
                >
                  {/* message part */}
                  {message.text}{" "}
                  <span className="ml-2 text-xs text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </span>
              </div>
              <div
                className={cn("relative w-6 h-6", {
                  "order-2": isCurrentUser,
                  "order-1": !isCurrentUser,
                  invisible: hasNextMessageFromSameuser,
                })}
              >
                <Image
                  fill
                  src={
                    isCurrentUser
                      ? (sessionImg as string)
                      : (chatPartner.image as string)
                  }
                  alt={`${chatPartner.name}Profile picture`}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Messages;
