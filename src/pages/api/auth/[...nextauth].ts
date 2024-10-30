// naming structuer , [...nextauth].ts any req sent off with handle by this part

import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth/next";

export default NextAuth(authOptions);
