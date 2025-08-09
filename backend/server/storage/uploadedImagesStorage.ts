import { db } from "../infra/db";
import { uploaded_images, UploadedImage, UploadedImageInsert } from "../schemas/uploadedImagesSchema";
import { eq } from "drizzle-orm";

export async function getAllUploadedImages(): Promise<UploadedImage[]> {
    return db.select().from(uploaded_images);
}

export async function addUploadedImage(image: UploadedImageInsert): Promise<UploadedImage> {
    const [created] = await db.insert(uploaded_images).values(image).returning();
    return created;
}

export async function getUploadedImageById(id: number): Promise<UploadedImage | null> {
    const res = await db.select().from(uploaded_images).where(eq(uploaded_images.id, id));
    return res[0] ?? null;
}

export async function deleteUploadedImage(id: number): Promise<boolean> {
    const [deleted] = await db.delete(uploaded_images).where(eq(uploaded_images.id, id)).returning();
    return !!deleted;
}
