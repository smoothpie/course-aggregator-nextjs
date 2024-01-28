import { useState } from 'react';
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Sorter from '@/components/Courses/Sorter';
import Filters from '@/components/Courses/Filters';
import CourseCard from '@/components/Courses/CourseCard';
import { Course } from '@/types/course';
import s from './Courses.module.scss';

async function getCourses() {
  const res = await fetch(`${process.env.CLIENT_URL}/api/courses`);

  if (res.ok) {
    const courses = await res.json();
    return courses;
  } else {
    const errorText = await res.text();
    console.log("Error fetching courses:", errorText);
    throw new Error("Error fetching courses");
  }
}

export const getServerSideProps = async () => {
  const courses = await getCourses()

  return {
    props: {
      courses
    }
  }
}

type CoursesProps = {
  courses: Course[];
}

const CoursesPage = ({ courses }: CoursesProps) => {
  const [filterValues, setFilterValues] = useState<any>({});
  const [filteredResults, setFilteredResults] = useState<any[]>(courses);
  const { user } = useUser();
  const isAdmin = user && (user.publicMetadata?.role === 'admin');

  return (
    <div className={s.main}>
      <div className={s.header}>
        <h1>Browse coding courses</h1>
        {isAdmin && (
          <Link href="/courses/add">
            <button>Add new</button>
          </Link>
        )}
      </div>
      <div className={s.topBar}>
        <input
          className={s.search}
          placeholder="Search..."
          onChange={e => setFilterValues({ ...filterValues, search: e.target.value })}
        />
        <Sorter filteredResults={filteredResults} setFilteredResults={setFilteredResults} />
        <div className={s.resultsCount}>
          <div className={s.resultsCountNumber}>{filteredResults.length}</div>&nbsp;results
        </div>
      </div>
      <section className={s.content}>
        <Filters
          courses={courses}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
          setFilteredResults={setFilteredResults}
        />

        <div className={s.courses}>
          {filteredResults.map((course) => (
            <CourseCard key={course.id} course={course} isAdmin={!!isAdmin} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default CoursesPage