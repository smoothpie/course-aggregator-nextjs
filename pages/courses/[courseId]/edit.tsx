import { useRouter } from 'next/navigation'
import Image from 'next/image';
import CourseForm from '@/components/Courses/CourseForm';
import { Course, CourseFormValues } from '@/types/course';
import s from './EditCourse.module.scss';

async function getCourse(id: string) {
  const res = await fetch(`${process.env.CLIENT_URL}/api/courses/${id}`);

  if (res.ok) {
    const course = await res.json();
    return course;
  } else {
    const errorText = await res.text();
    console.log("Error fetching course:", errorText);
    throw new Error("Error fetching course");
  }
}

export const getServerSideProps = async ({ params }: any) => {
  const currentCourse = await getCourse(params.courseId)

  return {
    props: {
      currentCourse
    }
  }
}

type EditCourseProps = {
  currentCourse: Course;
}

const EditCoursePage = ({ currentCourse }: EditCourseProps) => {
  const router = useRouter()

  const handleSubmit = async (courseData: CourseFormValues) => {
    const { id, isPaid, ...rest } = courseData;
    const res = await fetch(`/api/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest),
    });
    if (res.ok) {
      router.push('/courses');
    } else {
      const errorText = await res.text();
      console.log('Error editing course:', errorText);
      alert(errorText);
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/courses/${currentCourse.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      router.push('/courses');
    } else {
      const errorText = await res.text();
      console.log('Error deleting course:', errorText);
      alert(errorText);
    }
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>Edit the course</h1>
        <div className={s.deleteIcon}>
          <Image src="/trash.svg" alt="Delete course" width={20} height={20} onClick={handleDelete} />
        </div>
      </div>

      <CourseForm onSubmit={handleSubmit} initialValues={currentCourse} />
    </div>
  )
}

export default EditCoursePage