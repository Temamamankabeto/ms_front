<?php

namespace App\Console\Commands;

use App\Models\Window;
use Illuminate\Console\Command;

/**
 * Diagnostic for the /feedback/windows location scoping: lists every
 * window and flags ones missing a city_id (or subcity_id / woreda_id
 * for windows whose administrative_level is subcity/woreda). Those
 * gaps are exactly what would make a window invisible to a scoped
 * feedback officer once city_id/subcity_id/woreda_id are required.
 *
 * Usage: php artisan windows:audit-locations
 */
class AuditWindowLocations extends Command
{
    protected $signature = 'windows:audit-locations';

    protected $description = 'List windows and flag any missing city_id/subcity_id/woreda_id for their administrative level';

    public function handle(): int
    {
        $windows = Window::query()
            ->withCount([
                'services as active_services_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->orderBy('id')
            ->get([
                'id',
                'name',
                'administrative_level',
                'city_id',
                'subcity_id',
                'woreda_id',
            ]);

        if ($windows->isEmpty()) {
            $this->info('No windows found.');

            return self::SUCCESS;
        }

        $rows = $windows->map(function (Window $window) {
            $level = $window->administrative_level;

            $missing = match ($level) {
                'city' => ! $window->city_id,
                'subcity' => ! $window->city_id || ! $window->subcity_id,
                'woreda' => ! $window->city_id || ! $window->subcity_id || ! $window->woreda_id,
                default => is_null($level), // no level set at all
            };

            return [
                $window->id,
                $window->name,
                $level ?? '(none)',
                $window->city_id ?? '-',
                $window->subcity_id ?? '-',
                $window->woreda_id ?? '-',
                $window->active_services_count,
                $missing ? 'MISSING LOCATION' : 'ok',
            ];
        });

        $this->table(
            ['ID', 'Name', 'Level', 'City', 'Subcity', 'Woreda', 'Active Services', 'Status'],
            $rows
        );

        $flagged = $rows->filter(fn ($row) => $row[7] !== 'ok')->count();
        $noServices = $rows->filter(fn ($row) => $row[6] === 0)->count();

        $this->newLine();
        $this->line("Windows missing a location for their level: {$flagged}");
        $this->line("Windows with zero active services (won't appear in /feedback/windows at all): {$noServices}");

        return self::SUCCESS;
    }
}
