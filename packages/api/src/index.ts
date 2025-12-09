import { Elysia } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { openapi } from "@elysiajs/openapi";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(
    cors({
      origin: Bun.env.FROTNEND_URL,
      credentials: true,
      preflight: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(clerkPlugin())
  .use(openapi())
  .get("/private", async ({ auth, clerk }) => {
    const { userId } = auth();
    console.log(userId);

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await clerk.users.getUser(userId);

    const craeteUser = await clerk.users.createUser({
      emailAddress: ["sutharharsh108@gmail.com"],
      firstName: "Harsh",
      lastName: "Suthar",
      password: "Harsh@140710",
    });

    console.log(craeteUser);

    return { user };
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
