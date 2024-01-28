import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getCourse(req, res);
  }
  if (req.method === 'PATCH') {
    return await editCourse(req, res);
  }
  if (req.method === 'DELETE') {
    return await deleteCourse(req, res);
  }
}

export async function getCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const courseId = req.query.id as string;
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      }
    });
    return res.status(200).json(course);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error getting course" });
  }
}

export async function editCourse(req: NextApiRequest, res: NextApiResponse) {
  const data = await req.body;
  const courseId = req.query.id as string;

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const editedCourse = await prisma.course.update({
      where: { id: courseId },
      data,
    });
    return res.status(200).json(editedCourse);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error updating course" });
  }
}

export async function deleteCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = req.query.id as string;

    await prisma.course.delete({ where: { id: courseId } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error deleting course" });
  }
}