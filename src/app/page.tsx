import { db } from "@/lib/db";

export default async function Home() {
  await db.set("hello", "hello");

  return <div className="text-red-600">hello world</div>;
}
