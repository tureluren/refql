create table "setting"(
  id serial,
  key varchar(50) not null default '' unique,
  value text not null,
  primary key (id)
);

insert into "setting" (key, value) values ('db_schema_version', '0');