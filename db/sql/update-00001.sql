create table "league" (
  id serial,
  name text,
  primary key (id)
);

create table "team" (
  id serial,
  name text,
  league_id integer references "league"(id) on delete cascade,
  primary key (id)
);

create table "position" (
  id serial,
  name text,
  primary key (id)
);

create table "player" (
  id serial,
  first_name text,
  last_name text,
  birthday date,
  team_id integer references "team"(id) on delete cascade,
  position_id integer references "position"(id) on delete cascade,
  primary key (id)
);

create table "game" (
  id serial,
  home_team_id integer references "team"(id) on delete cascade,
  away_team_id integer references "team"(id) on delete cascade,
  league_id integer references "league"(id) on delete cascade,
  result text,
  primary key (id)
);

create table "player_game" (
  player_id integer references "player"(id) on delete cascade,
  game_id integer references "game"(id) on delete cascade,
  primary key (player_id, game_id)
);

create table "goal" (
  id serial,
  game_id integer references "game"(id) on delete cascade,
  player_id integer references "player"(id) on delete cascade,
  own_goal boolean default false,
  minute integer,
  primary key (id),
  CONSTRAINT FK_goal_player_goal FOREIGN KEY (player_id, game_id) REFERENCES player_game(player_id, game_id)
);

create table "assist" (
  id serial,
  game_id integer references "game"(id) on delete cascade,
  goal_id integer references "goal"(id) on delete cascade,
  player_id integer references "player"(id) on delete cascade,
  primary key (id),
  CONSTRAINT FK_assist FOREIGN KEY (player_id, game_id) REFERENCES player_game(player_id, game_id)
);

begin work; 
  lock table setting in share row exclusive mode;
  insert into "setting" (key, value) values('db_schema_version', '1') on conflict (key) do update set value='1';
commit work;