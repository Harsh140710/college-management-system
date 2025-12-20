import { prisma } from "../db";

export const TeacherController = {
  // get teachers
  getTeachers: async (teacherId: string) => {
    const teacher = await prisma.user.count({
      where: {
        role: "TEACHER",
      },
    });

    if (!teacher) throw new Error("Teacher not exist");

    // for test this route first need to get access only teacher for fetch this but now i am admin so they give null data
    // todo: Pass teacher token for test this route
    return await prisma.user.findUnique({
      where: {
        id: teacherId,
        role: "TEACHER",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
        department: true,
        profileImg: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  // get attendance with course ID
  getAttendance: async (courseId: string) => {
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    return prisma.attendance.findMany({
      where: {
        courseId: courseId,
      },
      select: {
        id: true,
        date: true,
        status: true,

        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        class: {
          select: {
            id: true,
            className: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
  },

  // mark attendances
  markAttendance: async (
    teacherId: string,
    body: {
      studentId: string;
      classId: string;
      courseId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      date?: string;
    }
  ) => {
    // Check if teacher is assigned to this course
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
    });

    if (!course) throw new Error("Course not found");
    if (course.teacherId !== teacherId)
      throw new Error("Unauthorized: You are not assigned to this course");

    // Create attendance
    return prisma.attendance.create({
      data: {
        studentId: body.studentId,
        classId: body.classId,
        courseId: body.courseId,
        status: body.status,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });
  },

  // create Result
  createResult: async (
    teacherId: string,
    body: { studentId: string; examId: string; marks: number }
  ) => {
    const { studentId, examId, marks } = body;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true },
    });

    // exam exist or not
    if (!exam) throw new Error("Exam not found");

    // check teacher is assigned to provided course
    if (exam.course.teacherId !== teacherId) {
      throw new Error("Unauthorized: You are not assigned to this course");
    }

    let grade: string | undefined;
    const percentage = (marks / exam.totalMarks) * 100;

    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B+";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C+";
    else if (percentage >= 40) grade = "C";
    else if (percentage >= 35) grade = "D";
    else grade = "F";

    return prisma.result.create({
      data: { studentId, examId, marks, grade },
    });
  },

  // give assignment
  giveAssignment: async (
    teacherId: string,
    body: { title: string; courseId: string; dueDate: string }
  ) => {
    const { courseId, title, dueDate } = body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { assignments: true },
    });

    if (!course) throw new Error("Course not found.");
    if (course.teacherId !== teacherId)
      throw new Error("Unauthorized: You are not assigned to this course.");

    return await prisma.assignment.create({
      data: {
        title,
        courseId,
        dueDate: new Date(dueDate),
        teacherId,
      },
    });
  },

  // get assignment
  getAssignment: async (courseId: string) => {
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: courseId,
      },
      include: {
        course: true,
        teacher: true,
        submissions: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!assignment) throw new Error("Assignment not found.");

    return assignment;
  },

  // add material
  addMaterial: async (
    teacherId: string,
    body: {
      title: string;
      courseId: string;
      fileUrl: string;
      type: "PDF" | "PPT" | "VIDEO" | "LINK" | "DOC";
    }
  ) => {
    const { title, courseId, fileUrl, type } = body;

    // check valid type input
    if (!type) throw new Error("Invalid file type.");

    // Check if course exists and teacher is assigned
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) throw new Error("Course not found.");

    if (course.teacherId !== teacherId)
      throw new Error("Unauthorized: You are not assigned to this course.");

    // Create material
    return prisma.studyMaterial.create({
      data: {
        title,
        fileUrl,
        type,
        teacherId,
        courseId,
      },
    });
  },

  // delete material
  deleteMaterial: async (teacherId: string, materialId: string) => {
    const material = await prisma.studyMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material) throw new Error("Material not found");
    if (material.teacherId !== teacherId)
      throw new Error("Unauthorized: You cannot delete this material");

    return prisma.studyMaterial.delete({
      where: { id: materialId },
    });
  },

  // crate timetable
  createTimetable: async (
    teacherId: string,
    body: {
      day: string;
      startTime: string;
      endTime: string;
      classId: string;
      courseId: string;
    }
  ) => {
    const { day, startTime, endTime, classId, courseId } = body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) throw new Error("Course not found");

    if (course.teacherId !== teacherId)
      throw new Error("Unauthorized: You are not assigned to this course");

    // Create timetable entry
    return prisma.timetable.create({
      data: {
        day,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        classId,
        courseId,
        teacherId,
      },
    });
  },

  // get timetable
  getTimetable: async (teacherId: string) => {
    return prisma.timetable.findMany({
      where: { teacherId },
      include: {
        course: true,
        class: true,
      },
      orderBy: { day: "asc" },
    });
  },
};
