import { z } from "zod";

//for one message
export const messageValidator = z.object({
  id: z.string(),
  senderId: z.string(),
  text: z.string(),
  timestamp: z.number(),
});

//for array of message
export const messageArrayValidator = z.array(messageValidator);

//type of messsage from db.d.ts but fully validated
export type Message = z.infer<typeof messageValidator>;
