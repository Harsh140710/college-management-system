import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { TeacherController } from "../controller/teacher.controller";

// verify Teacher role
async function verifyTeacher(auth: any, clerk: any) {
  const { userId } = auth();

  if (!userId) throw new Error("Please login or signup first");

  const currentUser = await clerk.users.getUser(userId);

  const role = currentUser?.publicMetadata?.role;

  if (!role) throw new Error("User role missing in Clerk publicMetadata");

  // todo: for production i have write admin also access hod route after complete change this
  const allowedRoles = ["TEACHER","ADMIN"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized access HOD role required");
  }

  return { userId, role };
}

export const teacherRouter = new Elysia({ prefix: "/v1/teacher" })
  .use(clerkPlugin())

  .get(
    "/",
    async ({ auth, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.getTeachers(userId);

        return {
          message: "Teacher fetched successfully",
          data: res,
        };
      } catch (error: any) {
        console.log("GET TEACHER ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    { detail: { tags: ["Teacher"] } }
  )

  // get attendance
  .get(
    "/attendance/:courseId",
    async ({ auth, clerk, params: { courseId } }) => {
      try {
        await verifyTeacher(auth, clerk);

        const data = await TeacherController.getAttendance(courseId);

        return {
          message: "Attendance fetched successfully",
          data,
        };
      } catch (error: any) {
        console.log("GET ATTENDANCE ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      detail: { tags: ["Teacher - Attendance"] },
    }
  )

  // mark attendance
  .post(
    "/attendance",
    async ({ auth, body, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.markAttendance(userId, body);

        return {
          message: "Attendance marked successfully",
          data: res,
        };
      } catch (error: any) {
        console.log("MARK ATTENDANCE ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      body: t.Object({
        studentId: t.String(),
        courseId: t.String(),
        classId: t.String(),
        status: t.Enum({
          PRESENT: "PRESENT",
          ABSENT: "ABSENT",
          LATE: "LATE",
          EXCUSED: "EXCUSED",
        }),
        date: t.Optional(t.String()),
      }),
      detail: { tags: ["Teacher - Attendance"] },
    }
  )

  // Results
  .post(
    "/results",
    async ({ auth, body, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.createResult(userId, body);

        return { message: "Result created successfully", data: res };
      } catch (error: any) {
        console.log("CREATE RESULT ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      body: t.Object({
        studentId: t.String(),
        examId: t.String(),
        marks: t.Number(),
      }),
      detail: { tags: ["Teacher - Result"] },
    }
  )

  // Assignments
  .post(
    "/assignments",
    async ({ auth, body, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.giveAssignment(userId, body);

        return {
          message: "Assignment created successfully.",
          data: res,
        };
      } catch (error: any) {
        console.log("CREATE ASSIGNMENT ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        courseId: t.String(),
        dueDate: t.String(),
      }),
      detail: { tags: ["Teacher - Assignment"] },
    }
  )

  .get(
    "/assignments/:id/submissions",
    async ({ auth, clerk, params: { id } }) => {
      try {
        await verifyTeacher(auth, clerk);

        const res = await TeacherController.getAssignment(id);

        return { message: "Assignment fetched successfully", data: res };
      } catch (error: any) {
        console.log("GET ASSIGNMENT ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      detail: { tags: ["Teacher - Assignment"] },
    }
  )

  // Materials
  .post(
    "/materials",
    async ({ auth, body, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.addMaterial(userId, body);

        return {
          message: "Material added successfully",
          data: res,
        };
      } catch (error: any) {
        console.log("ADD MATERIAL ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        courseId: t.String(),
        fileUrl: t.String(),
        type: t.Enum({
          PDF: "PDF",
          PPT: "PPT",
          VIDEO: "VIDEO",
          LINK: "LINK",
          DOC: "DOC",
        }),
      }),
      detail: { tags: ["Teacher - Material"] },
    }
  )

  .delete(
    "/materials/:id",
    async ({ auth, clerk, params: { id } }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.deleteMaterial(userId, id);

        return { message: "Material deleted successfully", data: res };
      } catch (error: any) {
        console.log("DELETE MATERIAL ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      detail: { tags: ["Teacher - Material"] },
    }
  )

  // Time-Table
  .post(
    "/timetable",
    async ({ auth, body, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.createTimetable(userId, body);

        return { message: "Timetable created successfully", data: res };
      } catch (error: any) {
        console.log("CREATE TIMETABLE ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      body: t.Object({
        day: t.String(),
        startTime: t.String(),
        endTime: t.String(),
        classId: t.String(),
        courseId: t.String(),
      }),
      detail: { tags: ["Teacher - Timetable"] },
    }
  )

  .get(
    "/timetable",
    async ({ auth, clerk }) => {
      try {
        const { userId } = await verifyTeacher(auth, clerk);

        const res = await TeacherController.getTimetable(userId);

        return { message: "Timetable fetched successfully", data: res };
      } catch (error: any) {
        console.log("GET TIMETABLE ERROR", error);
        
        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      detail: { tags: ["Teacher - Timetable"] },
    }
  );
