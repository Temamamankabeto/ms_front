<?php

namespace App\Services;

use App\Models\Service;
use App\Models\User;
use App\Models\Window;
use App\Support\AppRoles;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceWindowService
{
    public function board(User $actor, string $level = AppRoles::LEVEL_CITY, ?int $subcityId = null, ?int $woredaId = null): array
    {
        $this->assertCityAdmin($actor);
        $level = $this->normalizeLevel($level);

        $windows = $this->scopedWindows($level)
            ->map(function (Window $window) use ($level, $subcityId, $woredaId) {
                $services = $window->services
                    ->filter(fn (Service $service) =>
                        $service->pivot?->assignment_level === $level &&
                        $this->serviceAvailableForLevel($service, $level, $subcityId, $woredaId)
                    )
                    ->values()
                    ->map(fn (Service $service) => $this->servicePayload($service));

                return $this->windowPayload($window, $level, $services);
            })
            ->values();

        $assignedServiceIds = $windows
            ->flatMap(fn (array $window) => collect($window['services'])->pluck('id'))
            ->unique()
            ->values()
            ->all();

        $unassignedServices = $this->scopedServices($level, $subcityId, $woredaId)
            ->reject(fn (Service $service) => in_array($service->id, $assignedServiceIds, true))
            ->values()
            ->map(fn (Service $service) => $this->servicePayload($service));

        return [
            'level' => $level,
            'services' => $unassignedServices,
            'unassigned_services' => $unassignedServices,
            'windows' => $windows,
        ];
    }

    public function move(User $actor, int $serviceId, int $windowId, string $level, int $stepOrder = 1, bool $isRequired = true): Service
    {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($level);
        $service = Service::findOrFail($serviceId);
        $window = Window::findOrFail($windowId);

        $this->assertLevelAllowed($service, $window, $level);

        DB::transaction(function () use ($service, $window, $level, $stepOrder, $isRequired) {
            DB::table('service_window')
                ->where('service_id', $service->id)
                ->where('assignment_level', $level)
                ->delete();

            DB::table('service_window')->insert([
                'service_id' => $service->id,
                'window_id' => $window->id,
                'assignment_level' => $level,
                'step_order' => $stepOrder,
                'is_required' => $isRequired,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return $service->fresh()->load('windows');
    }

    public function unassign(User $actor, Service $service, string $level): void
    {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($level);

        DB::table('service_window')
            ->where('service_id', $service->id)
            ->where('assignment_level', $level)
            ->delete();
    }

    public function assign(User $actor, Service $service, array $windows): Service
    {
        $this->assertCityAdmin($actor);

        foreach ($windows as $window) {
            $windowModel = Window::findOrFail($window['window_id']);
            $level = $this->firstLevel($windowModel->availability);

            if (!$level) {
                throw ValidationException::withMessages([
                    'window_id' => ['Window has no valid availability level.'],
                ]);
            }

            $this->move(
                $actor,
                $service->id,
                $windowModel->id,
                $level,
                (int) ($window['step_order'] ?? 1),
                (bool) ($window['is_required'] ?? true)
            );
        }

        return $service->fresh()->load('windows');
    }

    public function show(User $actor, Service $service): Service
    {
        $this->assertCityAdmin($actor);
        return $service->load('windows');
    }

    protected function assertCityAdmin(User $actor): void
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        if (!$actor->hasRole(AppRoles::ADMIN) || AppRoles::userLevel($actor) !== AppRoles::LEVEL_CITY) {
            throw ValidationException::withMessages([
                'role' => ['Only City Admin can manage service-window assignments.'],
            ]);
        }
    }

    protected function assertLevelAllowed(Service $service, Window $window, string $level): void
    {
        $serviceLevels = $this->levels($service->availability);
        $windowLevels = $this->levels($window->availability);

        if (!in_array($level, $serviceLevels, true)) {
            throw ValidationException::withMessages([
                'service_id' => ["This service is not available at {$level} level."],
            ]);
        }

        if (!in_array($level, $windowLevels, true)) {
            throw ValidationException::withMessages([
                'window_id' => ["This window is not available at {$level} level."],
            ]);
        }
    }

    protected function scopedServices(string $level, ?int $subcityId = null, ?int $woredaId = null): Collection
    {
        return Service::query()
            ->with('windows')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->filter(fn (Service $service) => $this->serviceAvailableForLevel($service, $level, $subcityId, $woredaId))
            ->values();
    }

    protected function scopedWindows(string $level): Collection
    {
        return Window::query()
            ->with([
                'services' => fn ($query) => $query
                    ->where('services.status', 'active')
                    ->wherePivot('assignment_level', $level)
                    ->orderBy('service_window.step_order')
                    ->orderBy('services.name'),
            ])
            ->orderBy('name')
            ->get()
            ->filter(fn (Window $window) => in_array($level, $this->levels($window->availability), true))
            ->values();
    }

    protected function serviceAvailableForLevel(Service $service, string $level, ?int $subcityId = null, ?int $woredaId = null): bool
    {
        $availability = $this->normalizeAvailability($service->availability);

        if (!$availability || !in_array($level, $availability['levels'], true)) {
            return false;
        }

        if ($level === AppRoles::LEVEL_SUBCITY && $subcityId) {
            return $this->idAllowed($availability['subcity_ids'], $subcityId);
        }

        if ($level === AppRoles::LEVEL_WOREDA && $woredaId) {
            return $this->idAllowed($availability['woreda_ids'], $woredaId);
        }

        return true;
    }

    protected function normalizeLevel(string $level): string
    {
        $level = strtolower(trim($level));
        return in_array($level, AppRoles::levels(), true) ? $level : AppRoles::LEVEL_CITY;
    }

    protected function servicePayload(Service $service): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'description' => $service->description,
            'service_fee' => $service->service_fee,
            'availability' => $service->availability,
            'status' => $service->status,
        ];
    }

    protected function windowPayload(Window $window, string $level, mixed $services): array
    {
        $title = $this->windowTitleForLevel($window, $level);

        return [
            'id' => $window->id,
            'name' => $window->name,
            'title' => $title,
            'city_title' => $window->city_title ?? null,
            'subcity_title' => $window->subcity_title ?? null,
            'woreda_title' => $window->woreda_title ?? null,
            'display_name' => trim($window->name . ($title ? " - {$title}" : "")),
            'administrative_level' => $level,
            'availability' => $window->availability,
            'services' => $services,
        ];
    }

    protected function windowTitleForLevel(Window $window, string $level): ?string
    {
        return match ($level) {
            AppRoles::LEVEL_CITY => $window->city_title ?? $window->title ?? null,
            AppRoles::LEVEL_SUBCITY => $window->subcity_title ?? $window->title ?? null,
            AppRoles::LEVEL_WOREDA => $window->woreda_title ?? $window->title ?? null,
            default => $window->title ?? null,
        };
    }

    protected function firstLevel(mixed $availability): ?string
    {
        return $this->levels($availability)[0] ?? null;
    }

    protected function levels(mixed $availability): array
    {
        return $this->normalizeAvailability($availability)['levels'] ?? [];
    }

    protected function normalizeAvailability(mixed $availability): ?array
    {
        if (!$availability) {
            return null;
        }

        if (is_string($availability)) {
            $decoded = json_decode($availability, true);
            $availability = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
        }

        if (!is_array($availability)) {
            return null;
        }

        if (array_key_exists('levels', $availability) || array_key_exists('administrative_levels', $availability)) {
            return [
                'levels' => $this->normalizeLevels($availability['levels'] ?? $availability['administrative_levels'] ?? []),
                'city_ids' => $this->normalizeIds($availability['city_ids'] ?? null),
                'subcity_ids' => $this->normalizeIds($availability['subcity_ids'] ?? null),
                'woreda_ids' => $this->normalizeIds($availability['woreda_ids'] ?? null),
            ];
        }

        if (array_is_list($availability)) {
            return [
                'levels' => $this->normalizeLevels($availability),
                'city_ids' => [],
                'subcity_ids' => [],
                'woreda_ids' => [],
            ];
        }

        $levels = [];

        foreach (AppRoles::levels() as $level) {
            if (($availability[$level] ?? false) === true) {
                $levels[] = $level;
            }
        }

        return $levels ? [
            'levels' => $levels,
            'city_ids' => $this->normalizeIds($availability['city_ids'] ?? null),
            'subcity_ids' => $this->normalizeIds($availability['subcity_ids'] ?? null),
            'woreda_ids' => $this->normalizeIds($availability['woreda_ids'] ?? null),
        ] : null;
    }

    protected function normalizeLevels(mixed $levels): array
    {
        if (is_string($levels)) {
            $levels = [$levels];
        }

        if (!is_array($levels)) {
            return [];
        }

        return collect($levels)
            ->map(fn ($level) => strtolower(trim((string) $level)))
            ->filter(fn ($level) => in_array($level, AppRoles::levels(), true))
            ->unique()
            ->values()
            ->all();
    }

    protected function normalizeIds(mixed $ids): array
    {
        if (!$ids) {
            return [];
        }

        if (is_string($ids) || is_numeric($ids)) {
            $ids = [$ids];
        }

        if (!is_array($ids)) {
            return [];
        }

        return collect($ids)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    protected function idAllowed(array $allowedIds, mixed $selectedId): bool
    {
        if (count($allowedIds) === 0) {
            return true;
        }

        return in_array((int) $selectedId, $allowedIds, true);
    }
}
