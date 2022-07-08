-- https://database.guide/how-to-create-composite-foreign-key-sql-server-t-sql-example/

create table "season" (
  id serial,
  name text,
  primary key (id)
);

create table "team_player_season" (
  team_id integer references "team"(id) on delete cascade,
  player_id integer references "player"(id) on delete cascade,
  season_id integer references "season"(id) on delete cascade,
  primary key (team_id, player_id, season)
);

create table "team_player_season" (
  team_id integer references "team"(id) on delete cascade,
  player_id integer references "player"(id) on delete cascade,
  primary key (team_id, player_id)
);

begin work; 
  lock table setting in share row exclusive mode;
  insert into "setting" (key, value) values('db_schema_version', '2') on conflict (key) do update set value='2';
commit work;