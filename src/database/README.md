### database migrations

hallo! if you're thinking of contributing to discord-ttl and you want to add/change a database table,
you'll want to head over to the `migrations/` folder.

it's important to create a new migration file in ascending order. for example, if the current largest-numbered
file is `000` (i.e. `000.sql`) and you wish to edit a table, then you should create a new file named `001.sql` 
and write SQL updates to get a production database at 000.sql to 001.sql.

the code will apply the migrations in the order of 000.sql -> 001.sql -> ... -> 999.sql automatically during the startup of the bot (see: `api#applyMigrations()`)