-- =====================================================================
-- Copia — schéma initial (MVP)
-- Cloisonnement par RLS : un enseignant ne voit que ses données,
-- un élève ne voit que ses propres résultats publiés.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- Compte enseignant : forfait et crédits (PRD-09)
create table public.teacher_accounts (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial', 'pro', 'expert', 'lapsed')),
  trial_ends_at timestamptz not null default now() + interval '14 days',
  period_start timestamptz not null default now(),
  included_credits int not null default 250,
  included_balance int not null default 250 check (included_balance >= 0),
  purchased_balance int not null default 0 check (purchased_balance >= 0)
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index on public.credit_ledger (teacher_id, created_at desc);

-- ---------------------------------------------------------------------
-- Classes et élèves (PRD-01)
-- ---------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  level text not null default '',
  subject text not null default '',
  join_code text not null unique check (join_code ~ '^[A-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  -- Identifiant neutre transmis à la place du nom (ADR-004)
  pseudo text not null default ('E-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);
create index on public.students (class_id);
create index on public.students (user_id);

-- ---------------------------------------------------------------------
-- Compétences, évaluations, barèmes (PRD-02, PRD-04)
-- ---------------------------------------------------------------------
create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  unique (teacher_id, label)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null,
  subject text not null default '',
  level text not null default '',
  statement text not null default '',
  total_points numeric(6, 2) not null default 20,
  -- Le barème est figé avant la correction (ADR-006)
  status text not null default 'draft' check (status in ('draft', 'ready')),
  created_at timestamptz not null default now()
);

create table public.criteria (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  position int not null default 0,
  label text not null,
  expected text not null default '',
  points numeric(6, 2) not null check (points > 0),
  competency_id uuid references public.competencies (id) on delete set null
);
create index on public.criteria (evaluation_id);

-- Variantes DYS / PAP (PRD-07) : besoins portés par la variante, pas par l'élève
create table public.variants (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  needs text[] not null default '{}',
  intensity int not null check (intensity between 1 and 3),
  content jsonb not null,
  status text not null default 'proposal' check (status in ('proposal', 'validated')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Copies et correction (PRD-03)
-- ---------------------------------------------------------------------
create table public.copies (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  file_paths text[] not null default '{}',
  status text not null default 'uploaded'
    check (status in ('uploaded', 'analyzing', 'proposed', 'validated', 'published', 'error')),
  mode text check (mode in ('quick', 'deep')),
  transcription text,
  ai_result jsonb,
  final_result jsonb,
  score numeric(6, 2),
  teacher_comment text,
  error text,
  analysis_started_at timestamptz,
  validated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (evaluation_id, student_id)
);
create index on public.copies (evaluation_id);

-- Observations de compétences, alimentées UNIQUEMENT à la validation (ADR-005)
create table public.competency_observations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  competency_id uuid not null references public.competencies (id) on delete cascade,
  source_type text not null check (source_type in ('copy', 'exercise')),
  source_id uuid not null,
  ratio numeric(4, 3) not null check (ratio between 0 and 1),
  created_at timestamptz not null default now(),
  unique (source_type, source_id, competency_id)
);
create index on public.competency_observations (student_id);

-- ---------------------------------------------------------------------
-- Remédiation (PRD-05)
-- ---------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  competency_id uuid references public.competencies (id) on delete set null,
  title text not null,
  statement text not null,
  hints text[] not null check (cardinality(hints) = 2),
  solution text not null default '',
  difficulty int not null check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.exercise_assignments (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned', 'submitted', 'corrected')),
  answer text,
  submitted_at timestamptz,
  feedback text,
  ratio numeric(4, 3),
  corrected_by text check (corrected_by in ('ai', 'teacher')),
  created_at timestamptz not null default now(),
  unique (exercise_id, student_id)
);

-- ---------------------------------------------------------------------
-- Appréciations (PRD-08)
-- ---------------------------------------------------------------------
create table public.appreciations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  status text not null default 'proposal' check (status in ('proposal', 'validated')),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

-- ---------------------------------------------------------------------
-- Scan par QR code (ADR-012) et audit (ADR-011)
-- ---------------------------------------------------------------------
create table public.scan_sessions (
  token text primary key default encode(gen_random_bytes(18), 'hex'),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '2 hours'
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Création du profil à l'inscription
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'teacher');
begin
  if v_role not in ('teacher', 'student') then
    v_role := 'teacher';
  end if;
  insert into public.profiles (id, role, display_name)
  values (new.id, v_role, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  if v_role = 'teacher' then
    insert into public.teacher_accounts (teacher_id) values (new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Crédits : débit atomique et restitution (ADR-009)
-- =====================================================================
create or replace function public.plan_quota(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'pro' then 120 when 'expert' then 250 when 'trial' then 250 else 0 end
$$;

-- Remet le quota inclus à zéro à chaque échéance mensuelle (sans report)
create or replace function public.refresh_period(p_teacher uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v public.teacher_accounts;
begin
  select * into v from public.teacher_accounts where teacher_id = p_teacher for update;
  if not found then return; end if;
  if v.plan = 'trial' and v.trial_ends_at < now() then
    -- Fin d'essai sans souscription : lecture seule (F-09.17)
    update public.teacher_accounts
       set plan = 'lapsed', included_balance = 0, purchased_balance = 0
     where teacher_id = p_teacher;
    return;
  end if;
  if v.period_start + interval '1 month' <= now() then
    update public.teacher_accounts
       set period_start = now(),
           included_credits = public.plan_quota(v.plan),
           included_balance = public.plan_quota(v.plan)
     where teacher_id = p_teacher;
  end if;
end $$;

create or replace function public.consume_credits(p_amount int, p_reason text, p_ref uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_teacher uuid := auth.uid();
  v public.teacher_accounts;
  v_from_included int;
begin
  if v_teacher is null then raise exception 'non authentifié'; end if;
  if p_amount < 0 then raise exception 'montant invalide'; end if;
  perform public.refresh_period(v_teacher);
  select * into v from public.teacher_accounts where teacher_id = v_teacher for update;
  if not found then raise exception 'compte enseignant introuvable'; end if;
  if v.plan = 'lapsed' then raise exception 'abonnement expiré : lecture seule'; end if;
  if p_amount = 0 then return v.included_balance + v.purchased_balance; end if;
  if v.included_balance + v.purchased_balance < p_amount then
    raise exception 'crédits insuffisants';
  end if;
  -- Crédits inclus consommés d'abord, puis crédits achetés (F-09.4)
  v_from_included := least(v.included_balance, p_amount);
  update public.teacher_accounts
     set included_balance = included_balance - v_from_included,
         purchased_balance = purchased_balance - (p_amount - v_from_included)
   where teacher_id = v_teacher;
  insert into public.credit_ledger (teacher_id, delta, reason, ref_id)
  values (v_teacher, -p_amount, p_reason, p_ref);
  return v.included_balance + v.purchased_balance - p_amount;
end $$;

-- Restitution automatique si l'action IA échoue (F-09.2)
-- Uniquement pour un débit existant et pas encore restitué : impossible de créer des crédits
create or replace function public.refund_credits(p_amount int, p_reason text, p_ref uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_teacher uuid := auth.uid();
  v_net_debit int;
begin
  if v_teacher is null or p_ref is null or p_amount <= 0 then return; end if;
  perform 1 from public.teacher_accounts where teacher_id = v_teacher for update;
  select coalesce(-sum(delta), 0) into v_net_debit
    from public.credit_ledger where teacher_id = v_teacher and ref_id = p_ref;
  if v_net_debit < p_amount then return; end if;
  -- Reconstitue d'abord le quota inclus (dans la limite du quota), puis le solde acheté
  update public.teacher_accounts
     set included_balance = included_balance + least(p_amount, included_credits - included_balance),
         purchased_balance = purchased_balance + p_amount - least(p_amount, included_credits - included_balance)
   where teacher_id = v_teacher;
  insert into public.credit_ledger (teacher_id, delta, reason, ref_id)
  values (v_teacher, p_amount, 'restitution : ' || p_reason, p_ref);
end $$;

-- =====================================================================
-- Rattachement d'un élève par code classe (ADR-014)
-- =====================================================================
create or replace function public.join_class(p_code text, p_first_name text, p_last_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_class public.classes;
  v_student uuid;
begin
  if v_user is null then raise exception 'non authentifié'; end if;
  if (select role from public.profiles where id = v_user) <> 'student' then
    raise exception 'réservé aux comptes élèves';
  end if;
  select * into v_class from public.classes where join_code = upper(trim(p_code));
  if not found then raise exception 'code classe inconnu'; end if;

  select id into v_student from public.students
   where class_id = v_class.id and user_id = v_user;
  if found then return v_student; end if;

  -- Rattache une fiche existante créée par l'enseignant si le nom correspond
  select id into v_student from public.students
   where class_id = v_class.id and user_id is null
     and lower(first_name) = lower(trim(p_first_name))
     and lower(last_name) = lower(trim(p_last_name))
   limit 1;
  if found then
    update public.students set user_id = v_user where id = v_student;
  else
    insert into public.students (class_id, teacher_id, first_name, last_name, user_id)
    values (v_class.id, v_class.teacher_id, trim(p_first_name), trim(p_last_name), v_user)
    returning id into v_student;
  end if;
  insert into public.audit_log (actor_id, action, target)
  values (v_user, 'join_class', v_class.id::text);
  return v_student;
end $$;

-- =====================================================================
-- Fonctions d'appartenance utilisées par les politiques RLS
-- =====================================================================
create or replace function public.my_student_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.students where user_id = auth.uid()
$$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.teacher_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.competencies enable row level security;
alter table public.evaluations enable row level security;
alter table public.criteria enable row level security;
alter table public.variants enable row level security;
alter table public.copies enable row level security;
alter table public.competency_observations enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_assignments enable row level security;
alter table public.appreciations enable row level security;
alter table public.scan_sessions enable row level security;
alter table public.audit_log enable row level security;

create policy "profil : lecture de soi" on public.profiles
  for select using (id = auth.uid());

-- Les soldes ne sont modifiables que par les fonctions security definer
create policy "compte : lecture" on public.teacher_accounts
  for select using (teacher_id = auth.uid());
create policy "registre : lecture" on public.credit_ledger
  for select using (teacher_id = auth.uid());

-- Appartenance des objets parents : empêche un enseignant de rattacher
-- ses lignes à la classe, l'élève ou l'évaluation d'un autre enseignant
create or replace function public.owns(p_table text, p_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v boolean;
begin
  if p_id is null then return true; end if;
  if p_table not in ('classes', 'students', 'evaluations', 'exercises', 'competencies') then
    raise exception 'table non autorisée';
  end if;
  execute format('select exists (select 1 from public.%I where id = $1 and teacher_id = auth.uid())', p_table)
    into v using p_id;
  return v;
end $$;

-- Tables possédées par l'enseignant : accès complet à ses lignes, parents vérifiés en écriture
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('classes', 'true'),
      ('competencies', 'true'),
      ('students', 'public.owns(''classes'', class_id)'),
      ('evaluations', 'public.owns(''classes'', class_id)'),
      ('criteria', 'public.owns(''evaluations'', evaluation_id) and public.owns(''competencies'', competency_id)'),
      ('variants', 'public.owns(''evaluations'', evaluation_id)'),
      ('copies', 'public.owns(''evaluations'', evaluation_id) and public.owns(''students'', student_id)'),
      ('competency_observations', 'public.owns(''students'', student_id) and public.owns(''competencies'', competency_id)'),
      ('exercises', 'public.owns(''classes'', class_id) and public.owns(''competencies'', competency_id)'),
      ('exercise_assignments', 'public.owns(''exercises'', exercise_id) and public.owns(''students'', student_id)'),
      ('appreciations', 'public.owns(''students'', student_id)'),
      ('scan_sessions', 'public.owns(''evaluations'', evaluation_id)')
    ) as t(tbl, parent_check)
  loop
    execute format(
      'create policy "enseignant : accès complet" on public.%I for all
         using (teacher_id = auth.uid())
         with check (teacher_id = auth.uid() and %s)', r.tbl, r.parent_check);
  end loop;
end $$;

-- Élève : voit ses fiches, ses classes, et uniquement ce qui est publié / validé
create policy "élève : ses fiches" on public.students
  for select using (user_id = auth.uid());
create policy "élève : ses classes" on public.classes
  for select using (id in (select class_id from public.students where user_id = auth.uid()));
create policy "élève : copies publiées" on public.copies
  for select using (status = 'published' and student_id in (select public.my_student_ids()));
create policy "élève : évaluations publiées" on public.evaluations
  for select using (id in (select evaluation_id from public.copies
                            where status = 'published' and student_id in (select public.my_student_ids())));
create policy "élève : critères publiés" on public.criteria
  for select using (evaluation_id in (select evaluation_id from public.copies
                                       where status = 'published' and student_id in (select public.my_student_ids())));
create policy "élève : ses observations" on public.competency_observations
  for select using (student_id in (select public.my_student_ids()));
create policy "élève : compétences observées" on public.competencies
  for select using (id in (select competency_id from public.competency_observations
                            where student_id in (select public.my_student_ids())));
create policy "élève : ses exercices assignés" on public.exercise_assignments
  for select using (student_id in (select public.my_student_ids()));
create policy "élève : exercices assignés" on public.exercises
  for select using (id in (select exercise_id from public.exercise_assignments
                            where student_id in (select public.my_student_ids())));
create policy "élève : appréciation validée" on public.appreciations
  for select using (status = 'validated' and student_id in (select public.my_student_ids()));

-- Rendu d'exercice : passe par la fonction ci-dessous, jamais par un update direct
create or replace function public.submit_exercise(p_assignment uuid, p_answer text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.exercise_assignments
     set answer = left(p_answer, 5000), status = 'submitted', submitted_at = now()
   where id = p_assignment
     and student_id in (select public.my_student_ids())
     and status = 'assigned';
  if not found then raise exception 'exercice introuvable ou déjà rendu'; end if;
end $$;

-- Audit : l'enseignant lit ses propres actions ; l'écriture passe par le serveur
create policy "audit : lecture" on public.audit_log
  for select using (actor_id = auth.uid());
create policy "audit : écriture de soi" on public.audit_log
  for insert with check (actor_id = auth.uid());

-- =====================================================================
-- Stockage privé des copies (ADR-010) : URL signées uniquement
-- Arborescence : {teacher_id}/{evaluation_id}/{copy_id}/{fichier}
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('copies', 'copies', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "copies : lecture enseignant" on storage.objects
  for select using (bucket_id = 'copies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "copies : dépôt enseignant" on storage.objects
  for insert with check (bucket_id = 'copies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "copies : suppression enseignant" on storage.objects
  for delete using (bucket_id = 'copies' and (storage.foldername(name))[1] = auth.uid()::text);

revoke execute on function public.refresh_period(uuid) from public, anon, authenticated;
