-- Jimee — mode à deux (V17). À coller une seule fois dans Supabase → SQL Editor → Run.
-- Lecture ouverte (clé publique), écriture UNIQUEMENT par les fonctions ci-dessous.

create table if not exists public.jimee_joueurs(
  id text primary key, partie text not null, pseudo text not null, univers text not null,
  galaxie text not null, galaxie_nom text, jimee jsonb, mission jsonb, maj timestamptz not null default now());
create index if not exists jimee_joueurs_partie on public.jimee_joueurs(partie);

create table if not exists public.jimee_epaves(
  id text primary key, partie text not null, proprietaire text not null, pseudo text not null, univers text not null,
  galaxie text not null, galaxie_nom text, planete_id text not null, nom_planete text not null, jimee_nom text,
  objets jsonb not null default '[]', pilles jsonb not null default '[]', tentatives jsonb not null default '[]',
  cree timestamptz not null default now(), maj timestamptz not null default now());
create index if not exists jimee_epaves_partie on public.jimee_epaves(partie);

create table if not exists public.jimee_evenements(
  id bigserial primary key, partie text not null, joueur text not null, pseudo text not null,
  type text not null, texte text not null, cree timestamptz not null default now());
create index if not exists jimee_evenements_partie on public.jimee_evenements(partie, id);

alter table public.jimee_joueurs enable row level security;
alter table public.jimee_epaves enable row level security;
alter table public.jimee_evenements enable row level security;
drop policy if exists lecture on public.jimee_joueurs;   create policy lecture on public.jimee_joueurs   for select using (true);
drop policy if exists lecture on public.jimee_epaves;    create policy lecture on public.jimee_epaves    for select using (true);
drop policy if exists lecture on public.jimee_evenements;create policy lecture on public.jimee_evenements for select using (true);
revoke insert, update, delete on public.jimee_joueurs, public.jimee_epaves, public.jimee_evenements from anon, authenticated;
grant select on public.jimee_joueurs, public.jimee_epaves, public.jimee_evenements to anon, authenticated;

-- Position du joueur (appelée toutes les 10 s)
create or replace function public.jimee_presence(p_id text, p_partie text, p_pseudo text, p_univers text, p_galaxie text, p_galaxie_nom text, p_jimee jsonb, p_mission jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(p_partie) < 4 or length(p_partie) > 40 or length(p_pseudo) > 30 then raise exception 'parametres'; end if;
  insert into jimee_joueurs(id,partie,pseudo,univers,galaxie,galaxie_nom,jimee,mission,maj)
  values (p_id,p_partie,p_pseudo,p_univers,p_galaxie,p_galaxie_nom,p_jimee,p_mission,now())
  on conflict (id) do update set partie=excluded.partie,pseudo=excluded.pseudo,univers=excluded.univers,galaxie=excluded.galaxie,
    galaxie_nom=excluded.galaxie_nom,jimee=excluded.jimee,mission=excluded.mission,maj=now();
end $$;

-- Épave publiée par son propriétaire : les objets déjà pillés par un autre joueur ne réapparaissent jamais
create or replace function public.jimee_publier_epave(p_id text, p_partie text, p_proprietaire text, p_pseudo text, p_univers text, p_galaxie text,
  p_galaxie_nom text, p_planete_id text, p_nom_planete text, p_jimee_nom text, p_objets jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pilles jsonb; v_objets jsonb;
begin
  select pilles into v_pilles from jimee_epaves where id=p_id and proprietaire=p_proprietaire;
  v_pilles := coalesce(v_pilles,'[]'::jsonb);
  select coalesce(jsonb_agg(o),'[]'::jsonb) into v_objets from jsonb_array_elements(p_objets) o where not (v_pilles ? (o->>'id'));
  insert into jimee_epaves(id,partie,proprietaire,pseudo,univers,galaxie,galaxie_nom,planete_id,nom_planete,jimee_nom,objets)
  values (p_id,p_partie,p_proprietaire,p_pseudo,p_univers,p_galaxie,p_galaxie_nom,p_planete_id,p_nom_planete,p_jimee_nom,v_objets)
  on conflict (id) do update set objets=v_objets, maj=now() where jimee_epaves.proprietaire=p_proprietaire;
  return v_pilles;
end $$;

-- Pillage par un autre joueur : une tentative par joueur et par épave ; tous les objets tentés doivent être encore là
create or replace function public.jimee_piller(p_epave text, p_joueur text, p_pseudo text, p_tentes jsonb, p_retires jsonb, p_texte text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e jimee_epaves%rowtype; dispo jsonb; manquant int;
begin
  select * into e from jimee_epaves where id=p_epave for update;
  if not found then return jsonb_build_object('ok',false,'raison','introuvable'); end if;
  if e.proprietaire=p_joueur then return jsonb_build_object('ok',false,'raison','proprietaire'); end if;
  if e.tentatives ? p_joueur then return jsonb_build_object('ok',false,'raison','deja'); end if;
  select coalesce(jsonb_agg(o->>'id'),'[]'::jsonb) into dispo from jsonb_array_elements(e.objets) o where not (e.pilles ? (o->>'id'));
  select count(*) into manquant from jsonb_array_elements_text(p_tentes) t where not (dispo ? t);
  if manquant>0 then return jsonb_build_object('ok',false,'raison','change'); end if;
  update jimee_epaves set pilles=pilles||p_retires, tentatives=tentatives||to_jsonb(p_joueur), maj=now() where id=p_epave;
  insert into jimee_evenements(partie,joueur,pseudo,type,texte) values (e.partie,p_joueur,p_pseudo,'pillage',left(p_texte,300));
  return jsonb_build_object('ok',true);
end $$;

-- Fil d'actualité (mort d'un Jimee, etc.)
create or replace function public.jimee_evenement(p_partie text, p_joueur text, p_pseudo text, p_type text, p_texte text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into jimee_evenements(partie,joueur,pseudo,type,texte) values (p_partie,p_joueur,left(p_pseudo,30),left(p_type,20),left(p_texte,300));
end $$;

revoke execute on function public.jimee_presence, public.jimee_publier_epave, public.jimee_piller, public.jimee_evenement from public;
grant execute on function public.jimee_presence, public.jimee_publier_epave, public.jimee_piller, public.jimee_evenement to anon, authenticated;
