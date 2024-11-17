import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { Message, messageValidator } from "@/lib/validations/message";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const { text, chatId }: { text: string; chatId: string } = await req.json();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    const [userId1, userId2] = chatId.split("--");

    if (session.user.id !== userId1 && session.user.id !== userId2)
      return new Response("Unauthorized", { status: 401 });

    const friendId = session.user.id === userId1 ? userId2 : userId1;

    //check that freindID is in friendlist. gonnna be in JSON string
    const friendList = (await fetchRedis(
      "smembers",
      `user:${session.user.id}:friends`
    )) as string[];
    //array method
    const isFriend = friendList.includes(friendId);
    if (!isFriend) return new Response("Unauthorized", { status: 401 });

    const rawSender = (await fetchRedis(
      "get",
      `user:${session.user.id}`
    )) as string;
    //here sender is user for toast notification. when we aren't in chat
    const sender = JSON.parse(rawSender) as User;

    const timestamp = Date.now();
    console.log("timestamp:", timestamp);
    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      text,
      timestamp,
    };
    const message = messageValidator.parse(messageData);

    //notify all connected chat room clients
    await pusherServer.trigger(
      toPusherKey(`chat:${chatId}`),
      "incoming-message",
      //message is passed as the argument and reciever end will accpet {Id,senderId,text,timestamp} . but if we put {message}, this will behaves as the message is wrapped inside another object as the value for the message property. {"message":{id,senderid,text,timestamp}}
      message
    );

    //any unseen message will trigger with new event 'new_message'
    await pusherServer.trigger(
      toPusherKey(`user:${friendId}:chats`),
      "new_message",
      {
        ...message,
        senderImg: sender.image,
        senderName: sender.name,
      }
    );

    //all valid, send the message. zadd . add in sorted list
    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message),
    });

    return new Response("ok");
  } catch (error) {
    if (error instanceof Error)
      return new Response(error.message, { status: 500 });
    return new Response("Internal server error", { status: 500 });
  }
}
