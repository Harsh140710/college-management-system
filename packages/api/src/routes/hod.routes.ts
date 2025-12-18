import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { HodController } from "../controller/hod.controller";

// verify hod role
async function verifyHod(auth: any, clerk: any) {
  const { userId } = auth();

  if (!userId) throw new Error("Please login or signup first");

  const currentUser = await clerk.users.getUser(userId);

  const role = currentUser?.publicMetadata?.role;

  if (!role) throw new Error("User role missing in Clerk publicMetadata");

  // todo: for production i have write admin also access hod route after complete change this
  const allowedRoles = ["ADMIN", "HOD"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized access HOD role required");
  }

  return { userId, role };
}

export const hodRouter = new Elysia({ prefix: "/v1/hod" })
  .use(clerkPlugin())

  // get all hod from the database and clerk
  .get(
    "/",
    async ({ auth, clerk }) => {
      try {
        await verifyHod(auth, clerk);
        const res = await HodController.getHod();

        return { message: "HOD get successfully.", data: res };
      } catch (error: any) {
        console.log("GET HOD ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    { detail: { tags: ["HOD"] } }
  )

  .get(
    "/teachers",
    async ({ auth, clerk }) => {
      try {
        await verifyHod(auth, clerk);
        const res = await HodController.getAllTeachers();

        if (res.length === 0)
          throw new Error("There are no teachers assigned.");

        return { message: "Teachers get successfully", data: res };
      } catch (error: any) {
        console.log("GET TEACHER ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    { detail: { tags: ["HOD"] } }
  )

  .get(
    "/students",
    async ({ auth, clerk }) => {
      try {
        await verifyHod(auth, clerk);
        const res = await HodController.getAllStudents();

        return { message: "Student fetched successfully.", data: res };
      } catch (error: any) {
        console.log("GET TEACHER ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    { detail: { tags: ["HOD"] } }
  )

  .post(
    "/assign-teacher",
    async ({ auth, body, clerk }) => {
      try {
        await verifyHod(auth, clerk);

        const { teacherId, courseId } = body;

        const result = await HodController.assignTeacher(teacherId, courseId);

        return {
          message: "Teacher assigned to course successfully.",
          data: result,
        };
      } catch (error: any) {
        console.log("ASSIGN TEACHER ERROR", error);

        return {
          status: 422,
          error: error?.errors?.[0]?.message || error.message,
        };
      }
    },
    {
      body: t.Object({
        teacherId: t.String(),
        courseId: t.String(),
      }),
      detail: { tags: ["HOD"] },
    }
  )

  // todo: This is not working because we don't have any time table created so we need to create them first then it can approved by HOD
  .patch(
    "/timetable/:id/approve",
    async ({ auth, params: { id }, clerk }) => {
      try {
        const { userId } = await verifyHod(auth, clerk);

        const res = await HodController.approveTimeTable(id, userId);

        return {
          message: "Timetable approved successfully.",
          data: res,
        };
      } catch (error: any) {
        console.log("TIMETABLE APPROVE ERROR:", error);

        return {
          status: 422,
          error: error.message,
        };
      }
    },
    {
      detail: { tags: ["HOD"] }
    }
  );
