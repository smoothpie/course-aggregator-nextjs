import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getCourses(req, res);
  }
  if (req.method === 'POST') {
    return await createCourse(req, res);
  }
}

export async function getCourses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        createdAt: 'desc',
      }
    });
    return res.status(200).json(courses);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error getting courses" });
  }
}

export async function createCourse(req: NextApiRequest, res: NextApiResponse) {
  const data = await req.body;
  const { userId, sessionClaims } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { publicMetadata }: any = sessionClaims;
  const role = publicMetadata?.role;

  try {
    if (role !== 'admin') {
      return res.status(401).json({ error: "You're not an admin" });
    }
    let newCourse = await prisma.course.create({
      data,
    });
    return res.status(200).json(newCourse);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error creating course" });
  }
}