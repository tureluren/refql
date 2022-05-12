insert into "position" (name)
values
  ('Goalkeeper'), ('Right-back'), ('Right-centre-back'),
  ('Left-centre-back'), ('Left-back'), ('Defensive midfielder'),
  ('Central midfielder'), ('Attacking midfielder'), ('Right winger'),
  ('Striker'), ('Left winger');

begin work; 
  lock table setting in share row exclusive mode;
  insert into "setting" (key, value) values('db_schema_version', '2') on conflict (key) do update set value='2';
commit work;