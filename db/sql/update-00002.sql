insert into `position` (`name`)
values
  ('Goalkeeper'), ('Right-back'), ('Right-centre-back'),
  ('Left-centre-back'), ('Left-back'), ('Defensive midfielder'),
  ('Central midfielder'), ('Attacking midfielder'), ('Right winger'),
  ('Striker'), ('Left winger');

update `setting` set `key_value` = '2' where `key_name` = 'db_schema_version';