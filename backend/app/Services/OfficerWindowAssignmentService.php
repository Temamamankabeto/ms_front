<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\OfficerWindowAssignment;
use App\Models\ServiceApplication;
use App\Models\ServiceApplicationHistory;
use App\Models\ServiceApplicationShare;
use App\Models\User;
use App\Models\Window;
use App\Support\AppRoles;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfficerWindowAssignmentService
{
    public function __construct(
        protected ApplicationFileService $fileService
    ) {}

    public function board(
        User $actor,
        string $level = AppRoles::LEVEL_CITY,
        ?int $subcityId = null,
        ?int $woredaId = null
    ): array {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($level);

        $windows = Window::query()
            ->with([
                'assignedOfficers' => function ($query) use ($level, $subcityId, $woredaId) {
                    $query
                        ->wherePivot('assignment_level', $level)
                        ->wherePivot('is_active', true)
                        ->where('users.is_active', true)
                        ->with('roles')
                        ->orderBy('users.name');

                    $this->applyOfficerLocationFilter($query, $level, $subcityId, $woredaId);
                },
            ])
            ->orderBy('name')
            ->get()
            ->filter(fn (Window $window) => $this->windowAvailableForLevel($window, $level))
            ->values()
            ->map(fn (Window $window) => [
                'id' => $window->id,
                'name' => $window->name,
                'title' => $this->windowTitleForLevel($window, $level),
                'city_title' => $window->city_title,
                'subcity_title' => $window->subcity_title,
                'woreda_title' => $window->woreda_title,
                'display_name' => $this->windowDisplayName($window, $level),
                'administrative_level' => $level,
                'availability' => $window->availability,
                'officers' => $window->assignedOfficers
                    ->map(fn (User $officer) => $this->officerPayload($officer))
                    ->values(),
            ]);

        $assignedOfficerIds = $windows
            ->flatMap(fn (array $window) => collect($window['officers'])->pluck('id'))
            ->unique()
            ->values()
            ->all();

        $officers = $this->availableOfficers($level, $subcityId, $woredaId)
            ->reject(fn (User $officer) => in_array($officer->id, $assignedOfficerIds, true))
            ->values()
            ->map(fn (User $officer) => $this->officerPayload($officer));

        return [
            'level' => $level,
            'windows' => $windows,
            'officers' => $officers,
            'available_officers' => $officers,
        ];
    }

    public function assign(
        User $actor,
        int $officerId,
        int $windowId,
        string $level,
        ?int $subcityId = null,
        ?int $woredaId = null
    ): OfficerWindowAssignment {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($level);
        $officer = User::with('roles')->findOrFail($officerId);
        $window = Window::findOrFail($windowId);

        $this->assertOfficerAllowedForLevel($officer, $level);
        $this->assertWindowAllowedForLevel($window, $level);
        $this->assertOfficerMatchesSelectedLocation($officer, $level, $subcityId, $woredaId);

        $assignment = OfficerWindowAssignment::updateOrCreate(
            [
                'officer_id' => $officer->id,
                'window_id' => $window->id,
                'assignment_level' => $level,
            ],
            [
                'city_id' => $officer->city_id,
                'subcity_id' => $officer->subcity_id,
                'woreda_id' => $officer->woreda_id,
                'assigned_by' => $actor->id,
                'is_active' => true,
                'assigned_at' => now(),
            ]
        );

        $this->audit(
            $actor,
            'officer_window_assigned',
            'Officer assigned to window.',
            'officer_window_assignment',
            $assignment->id,
            null,
            $assignment->toArray()
        );

        return $assignment->fresh(['officer.roles', 'window']);
    }

    public function unassign(
        User $actor,
        int $officerId,
        int $windowId,
        string $level
    ): void {
        $this->assertCityAdmin($actor);

        $level = $this->normalizeLevel($level);

        OfficerWindowAssignment::query()
            ->where('officer_id', $officerId)
            ->where('window_id', $windowId)
            ->where('assignment_level', $level)
            ->delete();

        $this->audit(
            $actor,
            'officer_window_unassigned',
            'Officer removed from window.',
            'officer_window_assignment',
            $officerId,
            null,
            [
                'officer_id' => $officerId,
                'window_id' => $windowId,
                'assignment_level' => $level,
            ]
        );
    }

    public function sharingWindowsForOfficer(User $officer, ?int $serviceId = null): array
    {
        $level = AppRoles::userLevel($officer);

        if (!$level) {
            return [];
        }

        /*
        |--------------------------------------------------------------------------
        | Return every window available on the officer's administrative level.
        |--------------------------------------------------------------------------
        | The officer does not need to be assigned to the window before seeing it.
        | After selecting a window, officers assigned to that selected window are loaded.
        */
        return Window::query()
            ->orderBy('name')
            ->get()
            ->filter(fn (Window $window) => $this->windowAvailableForLevel($window, $level))
            ->map(fn (Window $window) => [
                'id' => $window->id,
                'name' => $window->name,
                'title' => $this->windowTitleForLevel($window, $level),
                'display_name' => $this->windowDisplayName($window, $level),
                'level' => $level,
            ])
            ->values()
            ->all();
    }

    public function officersForWindow(
        User $actor,
        int $windowId,
        ?string $level = null,
        ?int $serviceId = null
    ): array {
        $level = $this->normalizeLevel(
            $level ?: AppRoles::userLevel($actor) ?: AppRoles::LEVEL_CITY
        );

        $query = User::query()
            ->with('roles')
            ->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', [
                AppRoles::FRONT_OFFICER,
                AppRoles::BACK_OFFICER,
            ]))
            ->whereHas('officerWindowAssignments', function ($query) use ($windowId, $level) {
                $query
                    ->where('window_id', $windowId)
                    ->where('assignment_level', $level)
                    ->where('is_active', true);
            });

        $this->applyOfficerLocationFilter($query, $level, $actor->subcity_id, $actor->woreda_id);

        $query->where('users.id', '!=', $actor->id);

        return $query
            ->orderBy('name')
            ->get()
            ->map(fn (User $officer) => $this->officerPayload($officer))
            ->values()
            ->all();
    }

    public function shareApplication(
        User $actor,
        ServiceApplication $application,
        int $toWindowId,
        int $toOfficerId,
        ?string $note = null
    ): ServiceApplicationShare {
        $level = $this->normalizeLevel(
            $application->administrative_level
                ?: AppRoles::userLevel($actor)
                ?: AppRoles::LEVEL_CITY
        );

        if (AppRoles::userLevel($actor) !== $level) {
            throw ValidationException::withMessages([
                'level' => ['You can share applications only within your own administrative level.'],
            ]);
        }

        $targetOfficer = User::with('roles')->findOrFail($toOfficerId);
        $targetWindow = Window::findOrFail($toWindowId);

        $this->assertOfficerAllowedForLevel($targetOfficer, $level);
        $this->assertWindowAllowedForLevel($targetWindow, $level);

        $assigned = OfficerWindowAssignment::query()
            ->where('officer_id', $targetOfficer->id)
            ->where('window_id', $targetWindow->id)
            ->where('assignment_level', $level)
            ->where('is_active', true)
            ->exists();

        if (!$assigned) {
            throw ValidationException::withMessages([
                'officer_id' => ['Selected officer is not assigned to the selected window.'],
            ]);
        }


        return DB::transaction(function () use ($actor, $application, $targetOfficer, $targetWindow, $level, $note) {
            $share = ServiceApplicationShare::create([
                'application_id' => $application->id,
                'shared_from_officer_id' => $actor->id,
                'shared_to_officer_id' => $targetOfficer->id,
                'from_window_id' => $application->current_window_id,
                'to_window_id' => $targetWindow->id,
                'administrative_level' => $level,
                'note' => $note,
                'shared_at' => now(),
            ]);

            $this->storeDocuments($application, $actor);

            $oldStatus = $application->status;

            $application->update([
                'current_window_id' => $targetWindow->id,
                'current_officer_id' => $targetOfficer->id,
                'assigned_to' => $targetOfficer->id,
                'status' => 'shared',
                'current_stage' => 'shared',
            ]);

            ServiceApplicationHistory::create([
                'application_id' => $application->id,
                'from_status' => $oldStatus,
                'to_status' => 'shared',
                'action' => 'shared_to_officer',
                'action_type' => 'officer_share',
                'remark' => $note,
                'actor_id' => $actor->id,
            ]);

            $this->audit(
                $actor,
                'application_shared',
                'Application shared between officers/windows.',
                'service_application',
                $application->id,
                null,
                $share->toArray()
            );

            return $share->fresh([
                'sharedFromOfficer',
                'sharedToOfficer',
                'fromWindow',
                'toWindow',
            ]);
        });
    }

    protected function storeDocuments(ServiceApplication $application, User $actor): void
    {
        $files = request()->file('documents', []);

        if (!$files) {
            return;
        }

        $this->fileService->storeFiles($application, ['workflow_documents' => $files], $actor);
    }

    protected function availableOfficers(
        string $level,
        ?int $subcityId = null,
        ?int $woredaId = null
    ) {
        $query = User::query()
            ->with('roles')
            ->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', [
                AppRoles::FRONT_OFFICER,
                AppRoles::BACK_OFFICER,
            ]));

        $this->applyOfficerLocationFilter($query, $level, $subcityId, $woredaId);

        return $query->orderBy('name')->get();
    }

    protected function applyOfficerLocationFilter(
        $query,
        string $level,
        ?int $subcityId = null,
        ?int $woredaId = null
    ): void {
        if ($level === AppRoles::LEVEL_CITY) {
            $query
                ->whereNotNull('users.city_id')
                ->whereNull('users.subcity_id')
                ->whereNull('users.woreda_id');

            return;
        }

        if ($level === AppRoles::LEVEL_SUBCITY) {
            $query
                ->whereNotNull('users.subcity_id')
                ->whereNull('users.woreda_id');

            if ($subcityId) {
                $query->where('users.subcity_id', $subcityId);
            }

            return;
        }

        if ($level === AppRoles::LEVEL_WOREDA) {
            $query->whereNotNull('users.woreda_id');

            if ($subcityId) {
                $query->where('users.subcity_id', $subcityId);
            }

            if ($woredaId) {
                $query->where('users.woreda_id', $woredaId);
            }
        }
    }

    protected function assertCityAdmin(User $actor): void
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        if (
            !$actor->hasRole(AppRoles::ADMIN) ||
            AppRoles::userLevel($actor) !== AppRoles::LEVEL_CITY
        ) {
            throw ValidationException::withMessages([
                'role' => ['Only City Admin can manage officer-window assignments.'],
            ]);
        }
    }

    protected function assertOfficerAllowedForLevel(User $officer, string $level): void
    {
        if (!$officer->hasAnyRole([
            AppRoles::FRONT_OFFICER,
            AppRoles::BACK_OFFICER,
        ])) {
            throw ValidationException::withMessages([
                'officer_id' => ['Selected user is not a front/back officer.'],
            ]);
        }

        if (AppRoles::userLevel($officer) !== $level) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer administrative level does not match selected assignment level.'],
            ]);
        }
    }

    protected function assertOfficerMatchesSelectedLocation(
        User $officer,
        string $level,
        ?int $subcityId,
        ?int $woredaId
    ): void {
        if ($level === AppRoles::LEVEL_SUBCITY && $subcityId && (int) $officer->subcity_id !== $subcityId) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer does not belong to the selected subcity.'],
            ]);
        }

        if ($level === AppRoles::LEVEL_WOREDA && $woredaId && (int) $officer->woreda_id !== $woredaId) {
            throw ValidationException::withMessages([
                'officer_id' => ['Officer does not belong to the selected woreda.'],
            ]);
        }
    }

    protected function assertWindowAllowedForLevel(Window $window, string $level): void
    {
        if (!$this->windowAvailableForLevel($window, $level)) {
            throw ValidationException::withMessages([
                'window_id' => ['Window administrative level does not match selected assignment level.'],
            ]);
        }
    }

    protected function windowAvailableForLevel(Window $window, string $level): bool
    {
        return in_array($level, $this->levels($window->availability), true);
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
            'city_id' => $officer->city_id,
            'subcity_id' => $officer->subcity_id,
            'woreda_id' => $officer->woreda_id,
            'location_level' => AppRoles::userLevel($officer),
        ];
    }

    protected function normalizeLevel(string $level): string
    {
        $level = strtolower(trim($level));

        return in_array($level, AppRoles::levels(), true)
            ? $level
            : AppRoles::LEVEL_CITY;
    }

    protected function levels(mixed $availability): array
    {
        if (!$availability) {
            return [];
        }

        if (is_string($availability)) {
            $decoded = json_decode($availability, true);
            $availability = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
        }

        if (!is_array($availability)) {
            return [];
        }

        if (array_key_exists('levels', $availability)) {
            $levels = $availability['levels'];
        } elseif (array_key_exists('administrative_levels', $availability)) {
            $levels = $availability['administrative_levels'];
        } elseif (array_is_list($availability)) {
            $levels = $availability;
        } else {
            $levels = [];

            foreach (AppRoles::levels() as $level) {
                if (($availability[$level] ?? false) === true) {
                    $levels[] = $level;
                }
            }
        }

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

    protected function audit(
        User $actor,
        string $action,
        string $message,
        string $entityType,
        int|string|null $entityId,
        mixed $before = null,
        mixed $after = null
    ): void {
        try {
            if (function_exists('audit_log')) {
                audit_log($action, $message, $entityType, $entityId, $before, $after);
                return;
            }

            AuditLog::create([
                'user_id' => $actor->id,
                'role_name' => $actor->roles()->pluck('name')->first(),
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => $action,
                'message' => $message,
                'before' => $before,
                'after' => $after,
            ]);
        } catch (\Throwable $exception) {
            logger()->warning('Audit logging skipped: ' . $exception->getMessage());
        }
    }
}
