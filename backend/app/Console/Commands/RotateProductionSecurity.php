<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RotateProductionSecurity extends Command
{
    protected $signature = 'security:rotate-production {--force : Run without an interactive confirmation}';

    protected $description = 'Revoke all API tokens, refresh tokens, and server-side sessions after production credential rotation.';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This will sign out every user. Continue?')) {
            $this->warn('Security rotation cancelled.');
            return self::SUCCESS;
        }

        DB::transaction(function (): void {
            if (Schema::hasTable('personal_access_tokens')) {
                DB::table('personal_access_tokens')->delete();
            }

            User::query()->update([
                'refresh_token' => null,
                'refresh_token_expires_at' => null,
            ]);

            if (Schema::hasTable(config('session.table', 'sessions'))) {
                DB::table(config('session.table', 'sessions'))->delete();
            }
        });

        $this->info('All access tokens, refresh tokens, and sessions were revoked.');
        $this->warn('Rotate APP_KEY only through a controlled encrypted-data migration; do not replace it blindly.');

        return self::SUCCESS;
    }
}
