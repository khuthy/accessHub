import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getToken } from "next-auth/jwt";

const f = createUploadthing();

async function requireModel({ req }: { req: Request }) {
  const token = await getToken({
    req: req as Parameters<typeof getToken>[0]["req"],
    secret: process.env.AUTH_SECRET,
  });
  if (!token || token.role !== "MODEL") throw new Error("Unauthorized");
  return { userId: token.sub as string };
}

export const ourFileRouter = {
  // Preview image (public thumbnail) — models only
  previewImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireModel)
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  // Full content media — models only
  contentMedia: f({
    image: { maxFileSize: "32MB", maxFileCount: 1 },
    video: { maxFileSize: "512MB", maxFileCount: 1 },
  })
    .middleware(requireModel)
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  // Profile images (avatar + banner) — models only
  profileImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireModel)
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
