import { Webhook } from 'svix'
import type { IncomingHttpHeaders } from 'http';
import type { WebhookRequiredHeaders } from 'svix';
import type { NextApiRequest, NextApiResponse } from 'next';
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma';

async function getUniqueUserName(originalUsername: string, num: number): Promise<string> {
  const username = num === 0 ? originalUsername : `${originalUsername}-${num}`;
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return await getUniqueUserName(originalUsername, num + 1);
  }

  return username
}

function formatUsername(username: string) {
  const pattern = /^[a-zA-Z0-9-_]+$/;

  if (pattern.test(username)) {
    return username;
  } else {
    return username.replace(/[^a-zA-Z0-9-_]/g, '');
  }
}

type NextApiRequestWithSvixRequiredHeaders = NextApiRequest & {
  headers: IncomingHttpHeaders & WebhookRequiredHeaders;
};
 
export default async function handler(
  req: NextApiRequestWithSvixRequiredHeaders,
  res: NextApiResponse
) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
 
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }
 
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
 
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Error occured -- no svix headers" });
  }
 
  // Get the body
  const body = JSON.stringify(req.body);
 
  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);
 
  let evt: WebhookEvent
  
  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: "Error verifying webhook" });
  }

  const user: any = evt.data;
 
  const eventType = evt.type;
  if (eventType === 'user.created') {
    console.log(`User ${user.id} was ${eventType}`);
    const existingUser = await prisma.user.findMany({
      where: { clerkId: user.id },
    });

    if (!existingUser.length) {
      const userEmail = user.email_addresses && user.email_addresses[0]?.email_address;
      let username;
      if (user.username) {
        username = user.username
      } else if (userEmail) {
        username = userEmail.split('@')[0].toLowerCase();
      } else {
        username = (user.first_name + user.last_name).toLowerCase();
      }
      const formattedUsername = formatUsername(username);
      // check if user with this username exists
      const finalUsername = await getUniqueUserName(formattedUsername, 0);

      const createdUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          username: finalUsername,
          email: userEmail,
          avatar: user.profile_image_url,
        }
      })

      return res.status(201).json(createdUser);
    }
  }

  if (eventType === 'user.updated') {
    return res.status(201).json({ message: "User updated" });
  }

  if (eventType === 'user.deleted') {
    await prisma.user.delete({
      where: { clerkId: user.id },
    });

    return res.status(201).json({ message: "User deleted" });
  }

  return res.status(201).json({});
}