<?php

namespace App\Services;

use App\Models\Service;
use App\Models\User;
use App\Models\Window;
use App\Support\AppRoles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class ServiceAvailabilityScopeService
{
    public function applyServiceScope(Builder $query, ?User $actor): Builder
    {
        if (!$actor || $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        $level = AppRoles::userLevel($actor);

        if (!$level) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $query) use ($actor, $level) {
            $query->whereJsonContains('availability->levels', $level)
                ->orWhereJsonContains('availability', $level)
                ->orWhereJsonContains('availability->administrative_levels', $level)
                ->orWhere("availability->{$level}", true);
        })->where(function (Builder $query) use ($actor, $level) {
            $this->applyLocationIdConstraint($query, $actor, $level);
        });
    }

    public function applyWindowScope(Builder $query, ?User $actor): Builder
    {
        if (!$actor || $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        $level = AppRoles::userLevel($actor);

        if (!$level) {
            return $query->whereRaw('1 = 0');
        }

        if ($actor->hasRole(AppRoles::ADMIN) && $level === AppRoles::LEVEL_CITY) {
            return $query->where(function (Builder $query) use ($actor) {
                $query->whereNull('city_id')
                    ->orWhere('city_id', $actor->city_id);
            });
        }

        if ($level === AppRoles::LEVEL_SUBCITY) {
            return $query->where('administrative_level', AppRoles::LEVEL_SUBCITY)
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->whereNull('woreda_id');
        }

        if ($level === AppRoles::LEVEL_WOREDA) {
            return $query->where('administrative_level', AppRoles::LEVEL_WOREDA)
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->where('woreda_id', $actor->woreda_id);
        }

        return $query->where('administrative_level', $level);
    }

    public function assertServiceAndWindowAllowed(User $actor, Service $service, Window $window): void
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        $level = AppRoles::userLevel($actor);

        if (!$level) {
            throw ValidationException::withMessages([
                'scope' => ['Your account has no administrative scope.'],
            ]);
        }

        if (!$this->serviceMatchesActorScope($service, $actor, $level)) {
            throw ValidationException::withMessages([
                'service_id' => ['This service is not available in your administrative scope.'],
            ]);
        }

        if (!$this->windowMatchesActorScope($window, $level)) {
            throw ValidationException::withMessages([
                'window_id' => ['This window is not available in your administrative scope.'],
            ]);
        }
    }

    public function serviceMatchesActorScope(Service $service, User $actor, ?string $level = null): bool
    {
        $level ??= AppRoles::userLevel($actor);

        if (!$level) {
            return false;
        }

        $availability = $this->normalizeAvailability($service->availability);

        if (!$availability || !in_array($level, $availability['levels'], true)) {
            return false;
        }

        if ($level === AppRoles::LEVEL_CITY) {
            return $this->idAllowed($availability['city_ids'], $actor->city_id);
        }

        if ($level === AppRoles::LEVEL_SUBCITY) {
            return $this->idAllowed($availability['subcity_ids'], $actor->subcity_id);
        }

        if ($level === AppRoles::LEVEL_WOREDA) {
            return $this->idAllowed($availability['woreda_ids'], $actor->woreda_id);
        }

        return false;
    }

    public function windowMatchesActorScope(Window $window, ?string $level): bool
    {
        if (!$level) {
            return false;
        }

        if ($window->administrative_level) {
            return $window->administrative_level === $level;
        }

        $availability = $this->normalizeAvailability($window->availability);

        return $availability && in_array($level, $availability['levels'], true);
    }

    public function scopeLabel(?User $actor): string
    {
        if (!$actor) {
            return 'Unknown scope';
        }

        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return 'All administrative levels';
        }

        return match (AppRoles::userLevel($actor)) {
            AppRoles::LEVEL_CITY => 'City level: ' . ($actor->city?->name ?? 'Assigned city'),
            AppRoles::LEVEL_SUBCITY => 'Subcity level: ' . ($actor->subcity?->name ?? 'Assigned subcity'),
            AppRoles::LEVEL_WOREDA => 'Woreda level: ' . ($actor->woreda?->name ?? 'Assigned woreda'),
            default => 'No administrative scope',
        };
    }

    protected function applyLocationIdConstraint(Builder $query, User $actor, string $level): void
    {
        if ($level === AppRoles::LEVEL_CITY) {
            $query->where(function (Builder $q) use ($actor) {
                $q->whereNull('availability->city_ids')
                    ->orWhereJsonLength('availability->city_ids', 0)
                    ->orWhereJsonContains('availability->city_ids', (int) $actor->city_id);
            });

            return;
        }

        if ($level === AppRoles::LEVEL_SUBCITY) {
            $query->where(function (Builder $q) use ($actor) {
                $q->whereNull('availability->subcity_ids')
                    ->orWhereJsonLength('availability->subcity_ids', 0)
                    ->orWhereJsonContains('availability->subcity_ids', (int) $actor->subcity_id);
            });

            return;
        }

        if ($level === AppRoles::LEVEL_WOREDA) {
            $query->where(function (Builder $q) use ($actor) {
                $q->whereNull('availability->woreda_ids')
                    ->orWhereJsonLength('availability->woreda_ids', 0)
                    ->orWhereJsonContains('availability->woreda_ids', (int) $actor->woreda_id);
            });
        }
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

        foreach ([AppRoles::LEVEL_CITY, AppRoles::LEVEL_SUBCITY, AppRoles::LEVEL_WOREDA] as $level) {
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
