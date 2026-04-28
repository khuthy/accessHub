import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  previewImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  contentMedia: f({
    image: { maxFileSize: "32MB", maxFileCount: 1 },
    video: { maxFileSize: "512MB", maxFileCount: 1 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  profileImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
