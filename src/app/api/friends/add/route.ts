//route.ts mandatory for api . api/frineds/app handle post request

import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    //add users by its userIDs.
    const idToAdd = (await fetchRedis(
      "get",
      `user:email:${emailToAdd}`
    )) as string;

    if (!idToAdd) {
      return new Response("User not found", { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("UnAuthorized", { status: 401 });
    }
    if (idToAdd === session.user.id) {
      return new Response("You can't add yourself as a friend", {
        status: 400,
      });
    }

    //if already added . we can't add again
    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incomming_friend_requests`,
      session.user.id
    )) as 0 | 1;

    if (isAlreadyAdded) {
      return new Response("ALready added this user", { status: 400 });
    }
    //if already friend
    const isAlreadyFriend = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;

    if (isAlreadyFriend) {
      return new Response("ALready frined with this user", { status: 400 });
    }

    //valid request, send friend request
    await pusherServer.trigger(
      //channel
      toPusherKey(`user:${idToAdd}:incoming_friend_requests`),
      //function to call
      "incoming_friend_requests",
      //data send along with the requests
      {
        senderId: session.user.id,
        senderEmail: session.user.email,
      }
    );
    db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }
    return new Response("Invalid request", { status: 400 });
  }
}
