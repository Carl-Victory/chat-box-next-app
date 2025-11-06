import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(
      JSON.stringify({ ok: false, error: "Not authenticated" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (!session.user.username) {
    return new Response(
      JSON.stringify({ ok: false, error: "Username not set" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const payload = { id: session.user.id, username: session.user.username };
  // Prefer a dedicated socket token secret, fallback to NEXTAUTH_SECRET if not provided
  const signingSecret = process.env.SOCKET_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!signingSecret) {
    console.error('No signing secret available for socket token');
    return new Response(JSON.stringify({ ok: false, error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = jwt.sign(payload, signingSecret);

  return new Response(JSON.stringify({ ok: true, data: { token } }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
