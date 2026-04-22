-- Table : prospects_agences
-- À exécuter dans l'éditeur SQL de Supabase (project ref : utyfpmjhtfoxsxncfoxee)

create extension if not exists "pgcrypto";

create table if not exists public.prospects_agences (
  id             uuid          primary key default gen_random_uuid(),
  place_id       text          not null unique,
  nom            text,
  adresse        text,
  ville          text,
  telephone      text,
  site_web       text,
  email          text,
  activite       text,
  email_envoye   boolean       not null default false,
  created_at     timestamptz   not null default now()
);

create index if not exists prospects_agences_email_envoye_idx
  on public.prospects_agences (email_envoye);

create index if not exists prospects_agences_ville_idx
  on public.prospects_agences (ville);
