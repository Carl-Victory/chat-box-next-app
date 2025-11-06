/*import {  NextResponse } from "next/server";
import prisma from "@/lib/connection.prisma";

export async function GET() {
  //Find many for getting all users
  const allUsers = await prisma.users.findMany();
  //using findmany with select to get certain fields
  const certainUsers = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      firstname: true,
    },
  });
  //Using incl
  const includedUserItems = await prisma.users.findMany({
    include: {
      posts: true, //include all posts of the user
      profile: {
        select: {
          address: true,
          age: true,
        },
      }, //include profile of the user, with the address and age alone dispaying
    },
  });
  return NextResponse.json(
    { allUsers, certainUsers, includedUserItems },
    { status: 200 }
  );
}
*/