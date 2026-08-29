<?php

namespace App\Services;

use App\Models\User;
use App\Models\Window;
use App\Support\AppRoles;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class WindowService
{
    public function __construct(
        protected ServiceAvailabilityScopeService $scopeService
    ) {}

    public function getAll(?User $actor = null, array $filters = []): LengthAwarePaginator
    {
        $query = Window::query()
            ->with([
                'city:id,name',
                'subcity:id,name,city_id',
                'woreda:id,name,subcity_id',
            ])
            ->withCount([
                'services as assigned_services_count',
                'officerAssignments as assigned_officers_count' => fn ($q) => $q->where('is_active', true),
            ])
            ->orderBy('id', 'asc');

        $this->applyWindowManagementScope($query, $actor);

        $level = $filters['level'] ?? $filters['administrative_level'] ?? null;

        if ($level && in_array($level, ['city', 'subcity', 'woreda'], true)) {
            $query->where(function (Builder $q) use ($level) {
                $q->whereJsonContains('availability', $level)
                    ->orWhereJsonContains('availability->levels', $level)
                    ->orWhere('administrative_level', $level);
            });
        }

        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city_title', 'like', "%{$search}%")
                    ->orWhere('subcity_title', 'like', "%{$search}%")
                    ->orWhere('woreda_title', 'like', "%{$search}%");
            });
        }

        return $query->paginate(200);
    }

    public function create(array $data, ?User $actor = null): Window
    {
        $payload = $this->normalizePayload($data, $actor);
        $this->assertUniqueWindow($payload);

        return Window::create($payload)->fresh([
            'city',
            'subcity',
            'woreda',
        ]);
    }

    public function update(Window $window, array $data, ?User $actor = null): Window
    {
        $payload = $this->normalizePayload([
            ...$window->only([
                'name',
                'city_title',
                'subcity_title',
                'woreda_title',
                'availability',
                'city_id',
                'subcity_id',
                'woreda_id',
            ]),
            ...$data,
        ], $actor, $window);

        $this->assertUniqueWindow($payload, $window->id);

        $window->update($payload);

        return $window->fresh([
            'city',
            'subcity',
            'woreda',
        ]);
    }

    public function delete(Window $window): bool
    {
        return $window->delete();
    }

    protected function normalizePayload(array $data, ?User $actor = null, ?Window $existing = null): array
    {
        $levels = collect((array) ($data['availability'] ?? []))
            ->map(fn ($level) => strtolower(trim((string) $level)))
            ->filter(fn ($level) => in_array($level, ['city', 'subcity', 'woreda'], true))
            ->unique()
            ->values()
            ->all();

        if (!$levels) {
            throw ValidationException::withMessages([
                'availability' => ['Select at least one administrative level.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Subcity/Woreda admin restrictions
        |--------------------------------------------------------------------------
        | City admin can manage all windows across all levels.
        | Subcity admin can only create subcity title/window.
        | Woreda admin can only create woreda title/window.
        */
        if ($actor && ! $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            $actorLevel = AppRoles::userLevel($actor);

            if ($actor->hasRole(AppRoles::ADMIN) && $actorLevel === AppRoles::LEVEL_SUBCITY) {
                $levels = ['subcity'];
            }

            if ($actor->hasRole(AppRoles::ADMIN) && $actorLevel === AppRoles::LEVEL_WOREDA) {
                $levels = ['woreda'];
            }
        }

        $cityTitle = in_array('city', $levels, true)
            ? trim((string) ($data['city_title'] ?? ''))
            : null;

        $subcityTitle = in_array('subcity', $levels, true)
            ? trim((string) ($data['subcity_title'] ?? ''))
            : null;

        $woredaTitle = in_array('woreda', $levels, true)
            ? trim((string) ($data['woreda_title'] ?? ''))
            : null;

        if (in_array('city', $levels, true) && $cityTitle === '') {
            throw ValidationException::withMessages(['city_title' => ['City window title is required.']]);
        }

        if (in_array('subcity', $levels, true) && $subcityTitle === '') {
            throw ValidationException::withMessages(['subcity_title' => ['Subcity window title is required.']]);
        }

        if (in_array('woreda', $levels, true) && $woredaTitle === '') {
            throw ValidationException::withMessages(['woreda_title' => ['Woreda window title is required.']]);
        }

        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            throw ValidationException::withMessages(['name' => ['Window name is required.']]);
        }

        return [
            'name' => $name,
            /*
            |--------------------------------------------------------------------------
            | title is kept for backward compatibility.
            |--------------------------------------------------------------------------
            */
            'title' => $cityTitle ?: $subcityTitle ?: $woredaTitle ?: $name,
            'city_title' => $cityTitle,
            'subcity_title' => $subcityTitle,
            'woreda_title' => $woredaTitle,
            'administrative_level' => count($levels) === 1 ? $levels[0] : null,
            'city_id' => !empty($data['city_id']) ? (int) $data['city_id'] : null,
            'subcity_id' => !empty($data['subcity_id']) ? (int) $data['subcity_id'] : null,
            'woreda_id' => !empty($data['woreda_id']) ? (int) $data['woreda_id'] : null,
            'availability' => [
                'levels' => $levels,
            ],
        ];
    }

    protected function assertUniqueWindow(array $payload, ?int $ignoreId = null): void
    {
        /*
        |--------------------------------------------------------------------------
        | Window name can be shared across all levels, but duplicate name with the
        | exact same selected level-set is not allowed.
        |--------------------------------------------------------------------------
        */
        $query = Window::query()
            ->where('name', $payload['name'])
            ->where('availability->levels', json_encode($payload['availability']['levels']));

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'name' => ['A window with this name and selected administrative levels already exists.'],
            ]);
        }
    }

    protected function applyWindowManagementScope(Builder $query, ?User $actor): void
    {
        if (! $actor || $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        if (! $actor->hasRole(AppRoles::ADMIN)) {
            $query->whereRaw('1 = 0');
            return;
        }

        $level = AppRoles::userLevel($actor);

        if ($level === AppRoles::LEVEL_CITY) {
            /*
            |--------------------------------------------------------------------------
            | City admin manages all windows across all levels.
            |--------------------------------------------------------------------------
            */
            return;
        }

        if ($level === AppRoles::LEVEL_SUBCITY) {
            $query->where(function (Builder $q) {
                $q->whereJsonContains('availability->levels', 'subcity')
                    ->orWhereJsonContains('availability', 'subcity')
                    ->orWhere('administrative_level', 'subcity');
            });

            return;
        }

        if ($level === AppRoles::LEVEL_WOREDA) {
            $query->where(function (Builder $q) {
                $q->whereJsonContains('availability->levels', 'woreda')
                    ->orWhereJsonContains('availability', 'woreda')
                    ->orWhere('administrative_level', 'woreda');
            });

            return;
        }

        $query->whereRaw('1 = 0');
    }
}
