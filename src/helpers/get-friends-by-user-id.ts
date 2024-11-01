import { fetchRedis } from "./redis";

export const getFriendsByUserId = async (userId: string) => {
  //retrieve friends for current users from db

  const friendIds = (await fetchRedis(
    "smembers",
    `user:${userId}:friends`
  )) as string[];

  //call at the same time . i dnt need to fetch one before fetching other.
  const friends = await Promise.all(
    friendIds.map(async (friendId) => {
      const friend = (await fetchRedis("get", `user:${friendId}`)) as string;
      const parsedFriend = JSON.parse(friend) as User;
      return parsedFriend;
    })
  );

  return friends;
};
