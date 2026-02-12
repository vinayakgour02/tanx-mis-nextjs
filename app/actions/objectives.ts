'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';

interface CreateObjectiveData {
  type: 'Project' | 'Organization' | 'Program';
  projectId?: string;
  programId?: string;
  organizationId?: string;
  level: string;
  description: string;
}

interface UpdateObjectiveData {
  id: string;
  type: 'Project' | 'Program' | 'Organization';
  level: string;
  description: string;
  projectId?: string | null;
  programId?: string | null;
  organizationId?: string | null; // allow null here
}

export async function createObjective(data: CreateObjectiveData) {
  try {
    // console.log('Creating objective:', data); // Debug log
    
    // Generate a unique code
    const code = nanoid(8).toUpperCase();

    // Create the objective
    const objective = await prisma.objective.create({
      data: {
        code,
        level: data.level,
        description: data.description,
        projectId: data.type === 'Project' ? data.projectId : null,
        programId: data.type === 'Program' ? data.programId : null,
        organizationId: data.organizationId,
      },
    });

    revalidatePath('/org-dashboard/objectives');
    return { success: true, data: objective };
  } catch (error) {
    console.error('Error creating objective:', error);
    return { success: false, error: 'Failed to create objective' };
  }
} 

export async function updateObjective(data: UpdateObjectiveData) {
  try {
    const session = await getServerSession(authOptions)
    const updated = await prisma.objective.update({
      where: { id: data.id },
      data: {
        level: data.level,
        description: data.description,
        projectId: data.type === 'Project' ? data.projectId ?? null : null,
        programId: data.type === 'Program' ? data.programId ?? null : null,
        organizationId: session?.user.organizationId,
      },
    });

    // Revalidate cache for objectives list
    revalidatePath('/org-dashboard/objectives');

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating objective:', error);
    return { success: false, error: 'Failed to update objective' };
  }
}

export async function deleteObjective(id: string) {
  try {
    await prisma.objective.delete({
      where: { id },
    });

    revalidatePath('/org-dashboard/objectives');

    return { success: true };
  } catch (error) {
    console.error('Error deleting objective:', error);
    return { success: false, error: 'Failed to delete objective' };
  }
}