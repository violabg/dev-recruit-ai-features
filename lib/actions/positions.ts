"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth-server";
import prisma from "../prisma";
import { PositionFormData, positionFormSchema } from "../schemas";

// Position actions
export async function createPosition(values: PositionFormData) {
  const user = await requireUser();

  const payload = positionFormSchema.parse(values);

  const position = await prisma.position.create({
    data: {
      title: payload.title,
      description: payload.description || null,
      experienceLevel: payload.experience_level,
      skills: payload.skills,
      softSkills: payload.soft_skills ?? [],
      contractType: payload.contract_type ?? null,
      createdBy: user.id,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/positions");

  redirect(`/dashboard/positions/${position.id}`);
}

export async function deletePosition(id: string) {
  const user = await requireUser();

  const position = await prisma.position.findUnique({
    where: { id },
    select: { createdBy: true },
  });

  if (!position || position.createdBy !== user.id) {
    throw new Error("Not authorized to delete this position");
  }

  await prisma.position.delete({ where: { id } });

  revalidatePath("/dashboard/positions");
  redirect("/dashboard/positions");
}

export async function updatePosition(id: string, formData: FormData) {
  const user = await requireUser();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const experienceLevel = formData.get("experience_level") as string;
  const skills = JSON.parse(formData.get("skills") as string);
  const softSkills = JSON.parse(
    (formData.get("soft_skills") as string) || "[]"
  );
  const contractType = formData.get("contract_type") as string;

  const current = await prisma.position.findUnique({
    where: { id },
    select: { createdBy: true },
  });

  if (!current || current.createdBy !== user.id) {
    throw new Error("Not authorized to update this position");
  }

  await prisma.position.update({
    where: { id },
    data: {
      title,
      description,
      experienceLevel,
      skills,
      softSkills,
      contractType,
    },
  });

  revalidatePath("/dashboard/positions");
  revalidatePath(`/dashboard/positions/${id}`);

  redirect(`/dashboard/positions/${id}`);
}
