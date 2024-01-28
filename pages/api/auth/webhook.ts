import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextApiRequest, NextApiResponse } from 'next'
import { buffer } from 'micro'
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405)
  }
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
 
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }
 
  // Get the headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;
 
 
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' })
  }
 
  console.log('headers', req.headers, svix_id, svix_signature, svix_timestamp)
  // Get the body
  const body = (await buffer(req)).toString()
 
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
    return res.status(400).json({ 'Error': err })
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

      const createdUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          username,
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