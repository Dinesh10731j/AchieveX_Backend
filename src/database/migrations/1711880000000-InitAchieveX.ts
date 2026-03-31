import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAchieveX1711880000000 implements MigrationInterface {
  name = 'InitAchieveX1711880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('user', 'admin')`);
    await queryRunner.query(
      `CREATE TYPE "manifestation_status_enum" AS ENUM ('pending', 'achieved', 'failed', 'expired')`
    );
    await queryRunner.query(`CREATE TYPE "goal_visibility_enum" AS ENUM ('public', 'private')`);
    await queryRunner.query(`CREATE TYPE "proof_type_enum" AS ENUM ('image', 'video', 'text')`);
    await queryRunner.query(`CREATE TYPE "reaction_type_enum" AS ENUM ('like', 'fire', 'clap')`);
    await queryRunner.query(
      `CREATE TYPE "notification_type_enum" AS ENUM ('goal_reminder', 'goal_achieved', 'goal_failed', 'comment', 'reaction', 'follow')`
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(120) NOT NULL,
        "username" varchar(50) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "isActive" boolean NOT NULL DEFAULT true,
        "streakCount" integer NOT NULL DEFAULT 0,
        "lastAchievedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "token" varchar(500) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "revokedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_token" UNIQUE ("token"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "manifestations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "title" varchar(180) NOT NULL,
        "description" text NOT NULL,
        "category" varchar(80) NOT NULL,
        "visibility" "goal_visibility_enum" NOT NULL DEFAULT 'public',
        "status" "manifestation_status_enum" NOT NULL DEFAULT 'pending',
        "deadline" timestamptz NOT NULL,
        "confidenceScore" double precision NOT NULL DEFAULT 0,
        "achievedAt" timestamptz,
        "failedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_manifestations_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "proofs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "manifestationId" uuid NOT NULL,
        "type" "proof_type_enum" NOT NULL,
        "contentUrl" varchar(255),
        "mimeType" varchar(120),
        "textContent" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_proof_manifestation" UNIQUE ("manifestationId"),
        CONSTRAINT "FK_proofs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_proofs_manifestation" FOREIGN KEY ("manifestationId") REFERENCES "manifestations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "manifestationId" uuid NOT NULL,
        "parentCommentId" uuid,
        "content" text NOT NULL,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comments_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_manifestation" FOREIGN KEY ("manifestationId") REFERENCES "manifestations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "manifestationId" uuid NOT NULL,
        "type" "reaction_type_enum" NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_reactions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reactions_manifestation" FOREIGN KEY ("manifestationId") REFERENCES "manifestations"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_reactions_unique" UNIQUE ("userId", "manifestationId", "type")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" varchar(160) NOT NULL,
        "message" text NOT NULL,
        "data" jsonb,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "follows" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "followerId" uuid NOT NULL,
        "followingId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_follows_follower" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_follows_following" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_follows_unique" UNIQUE ("followerId", "followingId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bookmarks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "manifestationId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_bookmarks_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookmarks_manifestation" FOREIGN KEY ("manifestationId") REFERENCES "manifestations"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_bookmarks_unique" UNIQUE ("userId", "manifestationId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "goalReminder" boolean NOT NULL DEFAULT true,
        "goalAchieved" boolean NOT NULL DEFAULT true,
        "comments" boolean NOT NULL DEFAULT true,
        "reactions" boolean NOT NULL DEFAULT true,
        "follows" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_notification_preferences_user" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")`);

    await queryRunner.query(`CREATE INDEX "IDX_manifestations_userId" ON "manifestations" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_manifestations_deadline" ON "manifestations" ("deadline")`);
    await queryRunner.query(`CREATE INDEX "IDX_manifestations_status" ON "manifestations" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_manifestations_user_status" ON "manifestations" ("userId", "status")`);

    await queryRunner.query(`CREATE INDEX "IDX_proofs_userId" ON "proofs" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_proofs_manifestationId" ON "proofs" ("manifestationId")`);

    await queryRunner.query(`CREATE INDEX "IDX_comments_manifestationId" ON "comments" ("manifestationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_userId" ON "comments" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_parentCommentId" ON "comments" ("parentCommentId")`);

    await queryRunner.query(`CREATE INDEX "IDX_reactions_manifestationId" ON "reactions" ("manifestationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reactions_userId" ON "reactions" ("userId")`);

    await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_isRead" ON "notifications" ("isRead")`);

    await queryRunner.query(`CREATE INDEX "IDX_follows_followerId" ON "follows" ("followerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_follows_followingId" ON "follows" ("followingId")`);

    await queryRunner.query(`CREATE INDEX "IDX_bookmarks_userId" ON "bookmarks" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_bookmarks_manifestationId" ON "bookmarks" ("manifestationId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookmarks_manifestationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookmarks_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follows_followingId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follows_followerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_isRead"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reactions_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reactions_manifestationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_parentCommentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_manifestationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_proofs_manifestationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_proofs_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_manifestations_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_manifestations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_manifestations_deadline"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_manifestations_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_userId"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookmarks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "proofs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "manifestations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "proof_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "goal_visibility_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "manifestation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
