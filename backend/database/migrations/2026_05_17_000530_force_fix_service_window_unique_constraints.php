<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_window', function (Blueprint $table) {
            if (!Schema::hasColumn('service_window', 'assignment_level')) {
                $table->string('assignment_level', 20)->nullable()->after('window_id')->index();
            }
        });

        DB::table('service_window')
            ->whereNull('assignment_level')
            ->update(['assignment_level' => 'city']);

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(<<<SQL
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'service_window'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) LIKE '%service_id%'
          AND pg_get_constraintdef(oid) LIKE '%window_id%'
          AND pg_get_constraintdef(oid) NOT LIKE '%assignment_level%'
    LOOP
        EXECUTE 'ALTER TABLE service_window DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;
SQL);

            DB::statement('DROP INDEX IF EXISTS service_window_service_id_window_id_unique');
            DB::statement('DROP INDEX IF EXISTS service_window_service_window_level_unique');

            DB::statement(<<<SQL
DELETE FROM service_window a
USING service_window b
WHERE a.ctid < b.ctid
  AND a.service_id = b.service_id
  AND a.window_id = b.window_id
  AND COALESCE(a.assignment_level, 'city') = COALESCE(b.assignment_level, 'city')
SQL);

            DB::statement('CREATE UNIQUE INDEX service_window_service_window_level_unique ON service_window (service_id, window_id, assignment_level)');
            return;
        }

        if ($driver === 'mysql') {
            $indexes = DB::select("
                SELECT INDEX_NAME
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'service_window'
                GROUP BY INDEX_NAME
                HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) = 'service_id,window_id'
            ");

            foreach ($indexes as $index) {
                DB::statement("ALTER TABLE service_window DROP INDEX {$index->INDEX_NAME}");
            }

            try {
                DB::statement('ALTER TABLE service_window DROP INDEX service_window_service_window_level_unique');
            } catch (\Throwable $e) {
                //
            }

            DB::statement("
                DELETE sw1 FROM service_window sw1
                INNER JOIN service_window sw2
                WHERE sw1.id > sw2.id
                  AND sw1.service_id = sw2.service_id
                  AND sw1.window_id = sw2.window_id
                  AND COALESCE(sw1.assignment_level, 'city') = COALESCE(sw2.assignment_level, 'city')
            ");

            DB::statement('CREATE UNIQUE INDEX service_window_service_window_level_unique ON service_window (service_id, window_id, assignment_level)');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        try {
            if ($driver === 'pgsql') {
                DB::statement('DROP INDEX IF EXISTS service_window_service_window_level_unique');
            }

            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE service_window DROP INDEX service_window_service_window_level_unique');
            }
        } catch (\Throwable $e) {
            //
        }
    }
};
