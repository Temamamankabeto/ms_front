<?php

namespace App\Services;

use App\Models\Service;
use App\Models\User;
use App\Models\Window;
use App\Support\AppRoles;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserServiceAssignmentService
{
    public function board(
        User $actor,
        string $level = 'city',
        ?int $subcityId = null,
        ?int $woredaId = null
    ): array {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($level);

        $windows = $this->levelWindows($level)
            ->map(function (Window $window) use ($level, $subcityId, $woredaId) {
                $services = $window->services
                    ->filter(fn (Service $service) =>
                        $service->pivot?->assignment_level === $level &&
                        $this->serviceAvailableForLevel($service, $level, $subcityId, $woredaId)
                    )
                    ->values()
                    ->map(fn (Service $service) => [
                        ...$this->servicePayload($service),
                        'front_officers' => $this->assignedOfficers($service, $window, $level, 'front_officer'),
                        'back_officers' => $this->assignedOfficers($service, $window, $level, 'back_officer'),
                    ]);

                $officers = $this->levelOfficers($level, $subcityId, $woredaId)
                    ->filter(fn (User $officer) => $this->officerAssignedToWindow($officer, $window, $level))
                    ->values()
                    ->map(fn (User $officer) => $this->officerPayload($officer));

                return [
                    'id' => $window->id,
                    'name' => $window->name,
                    'title' => $this->windowTitleForLevel($window, $level),
                    'city_title' => $window->city_title ?? null,
                    'subcity_title' => $window->subcity_title ?? null,
                    'woreda_title' => $window->woreda_title ?? null,
                    'display_name' => $this->windowDisplayName($window, $level),
                    'administrative_level' => $level,
                    'availability' => $window->availability,
                    'services' => $services,
                    'officers' => $officers,
                ];
            })
            ->values();

        return [
            'level' => $level,
            'windows' => $windows,
        ];
    }

    public function assignAdvanced(User $actor, array $data): array
    {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($data['level']);
        $service = Service::with('windows')->findOrFail((int) $data['service_id']);
        $officer = User::with('roles')->findOrFail((int) $data['officer_id']);
        $window = Window::findOrFail((int) $data['window_id']);
        $officerType = $this->normalizeOfficerType($data['officer_type']);

        $this->assertAssignmentAllowed($service, $officer, $window, $level, $officerType);

        DB::table('user_service_assignments')->updateOrInsert(
            [
                'user_id' => $officer->id,
                'service_id' => $service->id,
                'window_id' => $window->id,
                'assignment_level' => $level,
                'officer_type' => $officerType,
            ],
            [
                'city_id' => $officer->city_id,
                'subcity_id' => $officer->subcity_id,
                'woreda_id' => $officer->woreda_id,
                'is_active' => true,
                'assigned_by' => $actor->id,
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->audit($actor, 'user_service_assigned', 'Officer assigned to service.', [
            'service_id' => $service->id,
            'officer_id' => $officer->id,
            'window_id' => $window->id,
            'level' => $level,
            'officer_type' => $officerType,
        ]);

        return $this->board(
            $actor,
            $level,
            isset($data['subcity_id']) ? (int) $data['subcity_id'] : null,
            isset($data['woreda_id']) ? (int) $data['woreda_id'] : null
        );
    }

    public function unassignAdvanced(User $actor, array $data): array
    {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($data['level']);
        $officerType = $this->normalizeOfficerType($data['officer_type']);

        DB::table('user_service_assignments')
            ->where('user_id', (int) $data['officer_id'])
            ->where('service_id', (int) $data['service_id'])
            ->where('window_id', (int) $data['window_id'])
            ->where('assignment_level', $level)
            ->where('officer_type', $officerType)
            ->delete();

        $this->audit($actor, 'user_service_unassigned', 'Officer removed from service.', $data);

        return $this->board(
            $actor,
            $level,
            isset($data['subcity_id']) ? (int) $data['subcity_id'] : null,
            isset($data['woreda_id']) ? (int) $data['woreda_id'] : null
        );
    }

    public function assign(User $user, array $serviceIds): User
    {
        foreach ($serviceIds as $serviceId) {
            $exists = DB::table('user_service_assignments')
                ->where('user_id', $user->id)
                ->where('service_id', $serviceId)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('user_service_assignments')->insert([
                'user_id' => $user->id,
                'service_id' => $serviceId,
                'officer_type' => $user->hasRole(AppRoles::BACK_OFFICER) ? 'back_officer' : 'front_officer',
                'assignment_level' => AppRoles::userLevel($user) ?? 'city',
                'city_id' => $user->city_id,
                'subcity_id' => $user->subcity_id,
                'woreda_id' => $user->woreda_id,
                'is_active' => true,
                'assigned_by' => auth()->id(),
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $user->load('assignedServices');
    }

    public function getAssignedServices(User $user): User
    {
        return $user->load('assignedServices');
    }

    public function remove(User $user, int $serviceId): User
    {
        DB::table('user_service_assignments')
            ->where('user_id', $user->id)
            ->where('service_id', $serviceId)
            ->delete();

        return $user->load('assignedServices');
    }

    public function toggle(User $user, int $serviceId): User
    {
        $assignment = DB::table('user_service_assignments')
            ->where('user_id', $user->id)
            ->where('service_id', $serviceId)
            ->first();

        if (!$assignment) {
            return $user->load('assignedServices');
        }

        DB::table('user_service_assignments')
            ->where('id', $assignment->id)
            ->update([
                'is_active' => !$assignment->is_active,
                'updated_at' => now(),
            ]);

        return $user->load('assignedServices');
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

    protected function windowDisplayName(Window $window, string $level): string
    {
        $title = $this->windowTitleForLevel($window, $level);

        return trim($window->name . ($title ? " - {$title}" : ""));
    }

    protected function assertAssignmentAllowed(
        Service $service,
        User $officer,
        Window $window,
        string $level,
        string $officerType
    ): void {
        if (!$officer->is_active) {
            throw ValidationException::withMessages([
                'officer_id' => ['Only active officers can be assigned.'],
            ]);
        }

        if (!$officer->hasRole($officerType)) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer role does not match selected assignment type.'],
            ]);
        }

        if ($officerType === 'back_officer' && !$service->has_back_officer) {
            throw ValidationException::withMessages([
                'officer_type' => ['This service does not require back officer assignment.'],
            ]);
        }

        if (AppRoles::userLevel($officer) !== $level) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer level does not match selected assignment level.'],
            ]);
        }

        if (!$this->serviceAvailableForLevel($service, $level)) {
            throw ValidationException::withMessages([
                'service_id' => ['Service is not available for selected level.'],
            ]);
        }

        if (!in_array($level, $this->levels($window->availability), true)) {
            throw ValidationException::withMessages([
                'window_id' => ['Window is not available for selected level.'],
            ]);
        }

        $serviceInWindow = DB::table('service_window')
            ->where('service_id', $service->id)
            ->where('window_id', $window->id)
            ->where('assignment_level', $level)
            ->exists();

        if (!$serviceInWindow) {
            throw ValidationException::withMessages([
                'window_id' => ['Service must belong to the selected window before assigning officers.'],
            ]);
        }

        if (!$this->officerAssignedToWindow($officer, $window, $level)) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer must be assigned to the same window before assigning to service.'],
            ]);
        }

        if ($level === AppRoles::LEVEL_SUBCITY && (int) $officer->subcity_id <= 0) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer must belong to selected subcity scope.'],
            ]);
        }

        if ($level === AppRoles::LEVEL_WOREDA && (int) $officer->woreda_id <= 0) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer must belong to selected woreda scope.'],
            ]);
        }
    }

    protected function levelWindows(string $level)
    {
        return Window::query()
            ->with([
                'services' => function ($query) use ($level) {
                    $query
                        ->where('services.status', 'active')
                        ->where('service_window.assignment_level', $level)
                        ->orderBy('services.name');
                },
            ])
            ->orderBy('name')
            ->get()
            ->filter(fn (Window $window) => in_array($level, $this->levels($window->availability), true))
            ->values();
    }

    protected function levelOfficers(string $level, ?int $subcityId = null, ?int $woredaId = null)
    {
        $query = User::query()
            ->with('roles')
            ->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', [
                AppRoles::FRONT_OFFICER,
                AppRoles::BACK_OFFICER,
            ]));

        if ($level === AppRoles::LEVEL_CITY) {
            $query
                ->whereNotNull('city_id')
                ->whereNull('subcity_id')
                ->whereNull('woreda_id');
        }

        if ($level === AppRoles::LEVEL_SUBCITY) {
            $query
                ->whereNotNull('subcity_id')
                ->whereNull('woreda_id');

            if ($subcityId) {
                $query->where('subcity_id', $subcityId);
            }
        }

        if ($level === AppRoles::LEVEL_WOREDA) {
            $query->whereNotNull('woreda_id');

            if ($subcityId) {
                $query->where('subcity_id', $subcityId);
            }

            if ($woredaId) {
                $query->where('woreda_id', $woredaId);
            }
        }

        return $query->orderBy('name')->get();
    }

    protected function officerAssignedToWindow(User $officer, Window $window, string $level): bool
    {
        return DB::table('officer_window_assignments')
            ->where('officer_id', $officer->id)
            ->where('window_id', $window->id)
            ->where('assignment_level', $level)
            ->where('is_active', true)
            ->exists();
    }

    protected function assignedOfficers(Service $service, Window $window, string $level, string $type): array
    {
        $officerIds = DB::table('user_service_assignments')
            ->where('service_id', $service->id)
            ->where('window_id', $window->id)
            ->where('assignment_level', $level)
            ->where('officer_type', $type)
            ->where('is_active', true)
            ->pluck('user_id')
            ->values()
            ->all();

        if (empty($officerIds)) {
            return [];
        }

        return User::query()
            ->with('roles')
            ->whereIn('id', $officerIds)
            ->orderBy('name')
            ->get()
            ->map(fn (User $officer) => $this->officerPayload($officer))
            ->values()
            ->all();
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

    protected function servicePayload(Service $service): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'description' => $service->description,
            'has_back_officer' => (bool) $service->has_back_officer,
            'status' => $service->status,
            'availability' => $service->availability,
        ];
    }

    protected function officerPayload(User $officer): array
    {
        $roles = $officer->getRoleNames()->values();

        return [
            'id' => $officer->id,
            'name' => $officer->name,
            'email' => $officer->email,
            'phone' => $officer->phone,
            'role' => $roles->first(),
            'role_names' => $roles,
            'location_level' => AppRoles::userLevel($officer),
            'city_id' => $officer->city_id,
            'subcity_id' => $officer->subcity_id,
            'woreda_id' => $officer->woreda_id,
        ];
    }

    protected function assertCityAdmin(User $actor): void
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        if (!$actor->hasRole(AppRoles::ADMIN) || AppRoles::userLevel($actor) !== AppRoles::LEVEL_CITY) {
            throw ValidationException::withMessages([
                'role' => ['Only City Admin can manage user-service assignments.'],
            ]);
        }
    }

    protected function normalizeLevel(string $level): string
    {
        $level = strtolower(trim($level));

        return in_array($level, AppRoles::levels(), true)
            ? $level
            : AppRoles::LEVEL_CITY;
    }

    protected function normalizeOfficerType(string $type): string
    {
        $type = strtolower(trim($type));

        return match ($type) {
            'front', 'front_officer' => 'front_officer',
            'back', 'back_officer' => 'back_officer',
            default => throw ValidationException::withMessages([
                'officer_type' => ['Invalid officer type.'],
            ]),
        };
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
                'subcity_ids' => $this->normalizeIds($availability['subcity_ids'] ?? null),
                'woreda_ids' => $this->normalizeIds($availability['woreda_ids'] ?? null),
            ];
        }

        if (array_is_list($availability)) {
            return [
                'levels' => $this->normalizeLevels($availability),
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
            'subcity_ids' => $this->normalizeIds($availability['subcity_ids'] ?? null),
            'woreda_ids' => $this->normalizeIds($availability['woreda_ids'] ?? null),
        ] : null;
    }

    protected function levels(mixed $availability): array
    {
        return $this->normalizeAvailability($availability)['levels'] ?? [];
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

    protected function audit(User $actor, string $action, string $message, array $after): void
    {
        try {
            if (function_exists('audit_log')) {
                audit_log($action, $message, 'user_service_assignment', null, null, $after);
            }
        } catch (\Throwable $e) {
            logger()->warning('User service assignment audit skipped: ' . $e->getMessage());
        }
    }
}
