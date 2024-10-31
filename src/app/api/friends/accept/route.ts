import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id: idToAdd } = z.object({ id: z.string() }).parse(body);

    //checks req is valid or not. if person is allowed to accept ot now
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    //verify both users are not already friend
    const isAlreadyFriend = await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    );
    if (isAlreadyFriend) {
      return new Response("You are already friends", { status: 400 });
    }

    //incoming friend req only should be accepted
    const hasFriendRequest = await fetchRedis(
      "sismember",
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    );

    if (!hasFriendRequest) {
      return new Response("No friend request", { status: 400 });
    }
    //add to friend list
    await db.sadd(`user:${session.user.id}:friends`, idToAdd);

    //show add to requester friend
    await db.sadd(`user:${idToAdd}:friends`, session.user.id);

    //clear friendrequests   //or outbound
    // await db.srem(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

    await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd);

    return new Response("ok");
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return new Response("invalid request payload", { status: 422 });
    }
    return new Response("Invalid Request", { status: 400 });
  }
}
