import { type Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
      create extension citext;

      create table users
      (
          id                uuid primary key,
          email             citext      not null unique,
          name              text        not null,
          email_verified_at timestamptz,
          created_at        timestamptz not null default now(),
          updated_at        timestamptz not null default now()
      );

      create table sessions
      (
          id                 uuid primary key,
          user_id            uuid        not null references users (id) on delete cascade,
          refresh_token_hash text        not null,
          expires_at         timestamptz not null,
          created_at         timestamptz not null default now(),
          updated_at         timestamptz not null default now()
      );

      create table verifications
      (
          id            uuid primary key,
          user_id       uuid        not null references users (id) on delete cascade,
          type          text        not null,
          value         citext      not null,
          otp_hash      text        not null,
          attempt_count integer     not null default 0,
          expired_at    timestamptz not null,
          created_at    timestamptz not null default now(),
          updated_at    timestamptz not null default now()
      );
  `.execute(db)
}
