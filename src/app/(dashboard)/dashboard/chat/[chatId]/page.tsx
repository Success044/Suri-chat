//dashboard/chat , if dashboard/chat/randomlink will give 401.  make the page dynamic page. that can get the current chat from the URL then determine what/which chat to show to users

import ChatInput from "@/components/ChatInput";
import Messages from "@/components/Messages";
import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageArrayValidator } from "@/lib/validations/message";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: {
    //same name as written in chat/[chatId]
    chatId: string;
  };
}

async function getChatMessages(chatId: string) {
  try {
    //messages, zrange is sorted array
    const result: string[] = await fetchRedis(
      "zrange",
      `chat:${chatId}:messages`,
      0,
      -1
    );
    const dbMessages = result.map((message) => JSON.parse(message) as Message);

    //display message in reverse order, default: last message should be shown. USE CSS later . dbMessage (messsage) will be in order of timestamp

    const reverseddbMessages = dbMessages.reverse();
    const messages = messageArrayValidator.parse(reverseddbMessages);
    return messages;
  } catch (error) {
    console.log(error);
    notFound();
  }
}

const page: FC<PageProps> = async ({ params }) => {
  const { chatId } = params;
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  //destructure
  const { user } = session;
  // /chat/userId1--userId2 (from my view) chat/userId2--userId1 ( from other side view)
  const [userId1, userId2] = chatId.split("--");
  if (user.id !== userId1 && user.id !== userId2) notFound();

  const chatPartnerId = user.id === userId1 ? userId2 : userId1;
  const chatPartner = (await db.get(`user:${chatPartnerId}`)) as User;
  const initialMessages = await getChatMessages(chatId);
  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)] ">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200 ">
        <div className="relative flex items-center space-x-4">
          <div className="relative ">
            <div className="relative w-8 sm:w-12 h-8 sm:h-12 ">
              <Image
                fill
                referrerPolicy="no-referrer"
                src={chatPartner?.image}
                alt={`${chatPartner?.name}Profile picture`}
                className="rounded-full"
              />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold">
                {chatPartner?.name}
              </span>
            </div>
            <span className="text-sm text-gray-600">{chatPartner?.email}</span>
          </div>
        </div>
      </div>
      <Messages
        initialMessages={initialMessages}
        sessionId={session.user.id}
        sessionImg={session.user.image}
        chatPartner={chatPartner}
        chatId={chatId}
      />
      <ChatInput chatPartner={chatPartner} chatId={chatId} />
    </div>
  );
};

export default page;
