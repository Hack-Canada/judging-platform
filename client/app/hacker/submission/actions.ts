"use server";

import { redirect } from "next/navigation";

import { getSql } from "@/lib/db";

function optionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function requiredText(formData: FormData, key: string, label: string) {
  const value = optionalText(formData, key);
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

export async function submitProject(formData: FormData) {
  const projectName = requiredText(formData, "projectName", "Project title");
  const fullDescription = requiredText(
    formData,
    "description",
    "Project information",
  );
  const elevatorPitch = optionalText(formData, "tagline");
  const teamMembers = requiredText(formData, "teamMembers", "Team members");
  const builtWith = requiredText(formData, "builtWith", "Tech stack");
  const gitRepo = requiredText(formData, "githubLink", "GitHub URL");
  const youtubeDemo = optionalText(formData, "youtubeLink");
  const livePostDemo = optionalText(formData, "demoLink");
  const emergencyContactName = requiredText(
    formData,
    "emergencyContactName",
    "Emergency contact name",
  );
  const emergencyContactPhone = requiredText(
    formData,
    "emergencyContactPhone",
    "Emergency contact phone number",
  );
  const emergencyContactRelationship = requiredText(
    formData,
    "emergencyContactRelationship",
    "Emergency contact relationship",
  );
  const challengesFaced = optionalText(formData, "challengesFaced");
  const lessonsLearned = optionalText(formData, "lessonsLearned");
  const nextSteps = optionalText(formData, "nextSteps");

  const sql = getSql();

  await sql`
    CREATE EXTENSION IF NOT EXISTS pgcrypto
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_name text NOT NULL,
      devpost_link text UNIQUE,
      tracks text[] NOT NULL DEFAULT ARRAY[]::text[],
      submitter_name text,
      submitter_email text,
      members text[] NOT NULL DEFAULT ARRAY[]::text[],
      submitted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      elevator_pitch text,
      full_description text,
      built_with text,
      git_repo text,
      live_post_demo text,
      youtube_demo text,
      challenges_faced text,
      lessons_learned text,
      next_steps text
    )
  `;

  await sql`
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS project_name text,
      ADD COLUMN IF NOT EXISTS devpost_link text,
      ADD COLUMN IF NOT EXISTS tracks text[] NOT NULL DEFAULT ARRAY[]::text[],
      ADD COLUMN IF NOT EXISTS submitter_name text,
      ADD COLUMN IF NOT EXISTS submitter_email text,
      ADD COLUMN IF NOT EXISTS members text[] NOT NULL DEFAULT ARRAY[]::text[],
      ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS elevator_pitch text,
      ADD COLUMN IF NOT EXISTS full_description text,
      ADD COLUMN IF NOT EXISTS built_with text,
      ADD COLUMN IF NOT EXISTS git_repo text,
      ADD COLUMN IF NOT EXISTS live_post_demo text,
      ADD COLUMN IF NOT EXISTS youtube_demo text,
      ADD COLUMN IF NOT EXISTS challenges_faced text,
      ADD COLUMN IF NOT EXISTS lessons_learned text,
      ADD COLUMN IF NOT EXISTS next_steps text
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS projects_devpost_link_unique_idx
      ON projects (devpost_link)
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS projects_id_unique_idx
      ON projects (id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS project_emergency_contacts (
      project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      contact_name text NOT NULL,
      contact_phone text NOT NULL,
      relationship text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    WITH inserted_project AS (
      INSERT INTO projects (
        project_name,
        tracks,
        members,
        submitted_at,
        elevator_pitch,
        full_description,
        built_with,
        git_repo,
        live_post_demo,
        youtube_demo,
        challenges_faced,
        lessons_learned,
        next_steps
      )
      VALUES (
        ${projectName},
        ARRAY[]::text[],
        ARRAY(
          SELECT trim(member)
          FROM regexp_split_to_table(${teamMembers}, E'[\\n,;]+') AS member
          WHERE trim(member) <> ''
        ),
        now(),
        ${elevatorPitch},
        ${fullDescription},
        ${builtWith},
        ${gitRepo},
        ${livePostDemo},
        ${youtubeDemo},
        ${challengesFaced},
        ${lessonsLearned},
        ${nextSteps}
      )
      RETURNING id
    )
    INSERT INTO project_emergency_contacts (
      project_id,
      contact_name,
      contact_phone,
      relationship
    )
    SELECT
      id,
      ${emergencyContactName},
      ${emergencyContactPhone},
      ${emergencyContactRelationship}
    FROM inserted_project
  `;

  redirect("/hacker/projects");
}
