import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
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

    const [userRaw, friendRaw] = (await Promise.all([
      fetchRedis("get", `user:${session.user.id}`),
      fetchRedis("get", `user:${idToAdd}`),
    ])) as [string, string];

    const user = JSON.parse(userRaw) as User;
    const friend = JSON.parse(friendRaw) as User;

    //notify added friend if online when friend req sent . IMPROVE performance
    await Promise.all([
      pusherServer.trigger(
        toPusherKey(`user:${idToAdd}:friends`),
        "new_friend",
        user
      ),
      pusherServer.trigger(
        toPusherKey(`user:${session.user.id}:friends`),
        "new_friend",
        friend
      ),
      //add to friend list
      db.sadd(`user:${session.user.id}:friends`, idToAdd),
      //show add to requester friend
      db.sadd(`user:${idToAdd}:friends`, session.user.id),
      //clear friendrequests   //or outbound
      db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd),
    ]);

    //doing this as the same time with user and friend.
    // pusherServer.trigger(
    //   toPusherKey(`user:${idToAdd}:friends`),
    //   "new_friend",
    //   {}
    // );

    // //add to friend list
    // await db.sadd(`user:${session.user.id}:friends`, idToAdd);

    // //show add to requester friend
    // await db.sadd(`user:${idToAdd}:friends`, session.user.id);

    // //clear friendrequests   //or outbound
    // // await db.srem(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

    // await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd);

    return new Response("ok");
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return new Response("invalid request payload", { status: 422 });
    }
    return new Response("Invalid Request", { status: 400 });
  }
}
