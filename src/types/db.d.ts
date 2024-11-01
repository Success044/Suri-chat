//defination typescript . available anywhere in application.

interface User {
  name: string;
  email: string;
  image: string | null | undefined;
  id: string;
}

interface Chat {
  id: string;
  messages: Message[];
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
}
