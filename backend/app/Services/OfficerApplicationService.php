<?php

namespace App\Services;

use Carbon\Carbon;

use App\Models\ServiceApplication;
use App\Models\ServiceApplicationHistory;
use App\Models\ServiceApplicationAppointment;
use App\Models\ServiceApplicationShare;
use App\Models\User;
use App\Models\Window;
use App\Support\AccessScope;
use App\Support\AppRoles;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfficerApplicationService
{
    public function __construct(
        protected AccessScope $scope,
        protected ApplicationFileService $fileService
    ) {}

    public function queue(User $actor, ?string $bucket = null, ?string $search = null)
    {
        $role = $this->actorOfficerRole($actor);

        $query = ServiceApplication::query()
            ->with([
                'service',
                'customer',
                'city',
                'subcity',
                'woreda',
                'currentWindow',
                'currentOfficer',
                'assignee',
            ])
            ->where(function ($query) use ($actor, $role) {
                /*
                |--------------------------------------------------------------------------
                | Directly assigned applications
                |--------------------------------------------------------------------------
                */
                $query
                    ->where('assigned_to', $actor->id)
                    ->orWhere('current_officer_id', $actor->id);

                /*
                |--------------------------------------------------------------------------
                | Front officer intake
                |--------------------------------------------------------------------------
                */
                if ($role === AppRoles::FRONT_OFFICER) {
                    $query->orWhere(function ($q) use ($actor) {
                        $q->whereIn('status', [
                            'submitted',
                            'resubmitted',
                            'returned_to_front_officer',
                            'back_officer_approved',
                            'back_officer_rejected',
                            'appointment_scheduled',
                        ])
                            ->whereNull('assigned_to')
                            ->whereNull('current_officer_id')
                            ->whereHas('service.assignedUsers', function ($assignment) use ($actor) {
                                $assignment
                                    ->where('users.id', $actor->id)
                                    ->where('user_service_assignments.is_active', true)
                                    ->whereIn('user_service_assignments.officer_type', [
                                        AppRoles::FRONT_OFFICER,
                                        'front',
                                    ]);
                            });
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | Back officer queue
                |--------------------------------------------------------------------------
                */
                if ($role === AppRoles::BACK_OFFICER) {
                    $query->orWhere(function ($q) use ($actor) {
                        $q->whereIn('status', [
                            'forwarded_to_back_officer',
                            'shared_to_back_officer',
                            'back_officer_review',
                            'under_back_review',
                        ])
                            ->whereNull('assigned_to')
                            ->whereNull('current_officer_id')
                            ->whereHas('service.assignedUsers', function ($assignment) use ($actor) {
                                $assignment
                                    ->where('users.id', $actor->id)
                                    ->where('user_service_assignments.is_active', true)
                                    ->whereIn('user_service_assignments.officer_type', [
                                        AppRoles::BACK_OFFICER,
                                        'back',
                                    ]);
                            });
                    });
                }
            });

        $this->scope->applyServiceApplicationScope($query, $actor);

        $map = [
            'new' => ['submitted', 'resubmitted'],
            'shared' => ['shared', 'shared_to_front_officer', 'shared_to_back_officer'],
            'accepted' => ['accepted', 'front_officer_review', 'back_officer_review', 'under_review', 'under_back_review'],
            'approved' => ['back_officer_approved', 'approved'],
            'appointment' => ['appointment_scheduled'],
            'escalated' => ['escalated', 'escalated_to_manager', 'assigned_by_manager', 'manager_review'],
            'returned' => ['returned', 'returned_to_front_officer', 'returned_to_customer', 'back_officer_rejected'],
            'rejected' => ['rejected'],
            'completed' => ['completed', 'closed'],
        ];

        if ($bucket && isset($map[$bucket])) {
            $query->whereIn('status', $map[$bucket]);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('administrative_level', 'like', "%{$search}%")
                    ->orWhereHas('service', fn ($service) => $service->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('customer', fn ($customer) => $customer->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('currentWindow', fn ($window) => $window->where('name', 'like', "%{$search}%"));
            });
        }

        return $query
            ->latest('updated_at')
            ->paginate(20);
    }

    public function appointment(
        ServiceApplication $application,
        User $actor,
        array $payload
    ) {
        return DB::transaction(function () use ($application, $actor, $payload) {

            $appointmentAt = $this->resolveAppointmentAt($payload);
            $appointmentLocation = $payload['appointment_location'] ?? $payload['location'] ?? null;
            $appointmentMessage = $payload['appointment_message']
                ?? $payload['message']
                ?? $payload['note']
                ?? $payload['remark']
                ?? null;

            $application->update([
                'status' => 'appointment_scheduled',
                'current_stage' => 'appointment_scheduled',

                'appointment_at' => $appointmentAt,
                'appointment_location' => $appointmentLocation,
                'appointment_message' => $appointmentMessage,
                'appointment_status' => 'scheduled',

                'sla_started_at' => now(),
            ]);

            ServiceApplicationAppointment::create([
                'application_id' => $application->id,
                'scheduled_by' => $actor->id,
                'appointment_at' => $appointmentAt,
                'location' => $appointmentLocation,
                'message' => $appointmentMessage,
                'status' => 'scheduled',
            ]);

            ServiceApplicationHistory::create([
                'application_id' => $application->id,
                'from_status' => $application->getOriginal('status'),
                'to_status' => 'appointment_scheduled',
                'action' => 'appointment_scheduled',
                'action_type' => 'workflow_action',
                'remark' => $appointmentMessage,
                'comment' => $appointmentMessage,
                'actor_id' => $actor->id,
                'sender_id' => $actor->id,
                'receiver_id' => $application->customer_id,
                'from_window_id' => $application->current_window_id,
                'to_window_id' => $application->current_window_id,
                'administrative_level' => $application->administrative_level,
                'status' => 'appointment_scheduled',
            ]);

            return $this->show($application->fresh());
        });
    }

    protected function resolveAppointmentAt(array $payload): Carbon
    {
        if (!empty($payload['appointment_at'])) {
            return Carbon::parse($payload['appointment_at']);
        }

        $date = $payload['appointment_date'] ?? null;
        $time = $payload['appointment_time'] ?? null;

        if (!$date || !$time) {
            throw ValidationException::withMessages([
                'appointment_at' => ['Appointment date and time are required.'],
            ]);
        }

        $time = trim((string) $time);

        try {
            if (preg_match('/\b(AM|PM)\b/i', $time)) {
                return Carbon::createFromFormat('Y-m-d h:i A', $date . ' ' . strtoupper($time));
            }

            return Carbon::createFromFormat('Y-m-d H:i', $date . ' ' . $time);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'appointment_time' => ['Invalid appointment date or time.'],
            ]);
        }
    }

    public function notificationSummary(User $actor): array
    {
        $role = $this->actorOfficerRole($actor);
        $applications = $this->queue($actor, null, null)->getCollection();

        $newStatuses = $role === AppRoles::BACK_OFFICER
            ? ['forwarded_to_back_officer']
            : ['submitted', 'pending', 'resubmitted'];

        $sharedStatuses = $role === AppRoles::BACK_OFFICER
            ? ['shared', 'shared_to_back_officer']
            : ['shared', 'shared_to_front_officer'];

        $returnedStatuses = [
            'back_officer_approved',
            'back_officer_rejected',
            'returned_to_front_officer',
        ];

        $new = $applications->whereIn('status', $newStatuses)->values();
        $shared = $applications->whereIn('status', $sharedStatuses)->values();
        $returned = $role === AppRoles::FRONT_OFFICER
            ? $applications->whereIn('status', $returnedStatuses)->values()
            : collect();

        $notifications = collect()
            ->merge($new->map(fn (ServiceApplication $application) => $this->officerNotificationPayload($application, 'new')))
            ->merge($shared->map(fn (ServiceApplication $application) => $this->officerNotificationPayload($application, 'shared')))
            ->merge($returned->map(fn (ServiceApplication $application) => $this->officerNotificationPayload($application, 'returned_from_back')))
            ->sortByDesc('date')
            ->values();

        return [
            'unread_count' => $notifications->count(),
            'new_count' => $new->count(),
            'shared_count' => $shared->count(),
            'returned_from_back_count' => $returned->count(),
            'notifications' => $notifications,
        ];
    }

    protected function officerNotificationPayload(ServiceApplication $application, string $type): array
    {
        return [
            'id' => $type . '-' . $application->id,
            'type' => $type,
            'title' => match ($type) {
                'shared' => 'Application shared to you',
                'returned_from_back' => 'Returned from Back Officer',
                default => 'New application',
            },
            'message' => match ($type) {
                'shared' => 'A service application has been shared to your queue.',
                'returned_from_back' => 'Back Officer has returned a decision for this application.',
                default => 'A new service application is waiting for your action.',
            },
            'application_id' => $application->id,
            'tracking_number' => $application->tracking_number,
            'service_name' => $application->service?->name,
            'customer_name' => $application->customer?->name,
            'window_name' => $application->currentWindow?->name,
            'status' => $application->status,
            'date' => optional($application->updated_at ?: $application->submitted_at)->toDateTimeString(),
            'href' => '/dashboard/officer/applications/' . $application->id,
        ];
    }

    public function managerQueue(User $manager, ?string $bucket = null)
    {
        $query = ServiceApplication::with(['service','customer','currentWindow','currentOfficer'])
            ->where(function ($query) use ($manager) {
                $query->where('assigned_to', $manager->id)
                    ->orWhere('current_officer_id', $manager->id);
            })
            ->whereIn('status', ['escalated_to_manager','manager_review','assigned_by_manager','returned_to_manager','manager_forwarded','manager_resolved','completed']);

        $this->scope->applyServiceApplicationScope($query, $manager);

        if ($bucket) {
            $map = [
                'new' => ['escalated_to_manager'],
                'assigned' => ['assigned_by_manager'],
                'returned' => ['returned_to_manager'],
                'forwarded' => ['manager_forwarded'],
                'resolved' => ['manager_resolved'],
                'completed' => ['completed'],
            ];
            if (isset($map[$bucket])) $query->whereIn('status', $map[$bucket]);
        }

        return $query->latest()->paginate(10);
    }

    public function show(ServiceApplication $application)
    {
        return $application->load([
            'service.windows','customer','currentWindow','currentOfficer','assignee','data','files',
            'workflows.window','workflows.officer','histories.actor','histories.sender','histories.receiver','histories.fromWindow','histories.toWindow','shares.sharedFromOfficer','shares.sharedToOfficer','shares.fromWindow','shares.toWindow',
        ]);
    }

    public function accept(ServiceApplication $application, User $actor, ?string $remark = null)
    {
        $role = $this->actorOfficerRole($actor);
        $status = $role === AppRoles::BACK_OFFICER ? 'back_officer_review' : 'front_officer_review';
        return $this->transition($application, $actor, $status, 'accepted', $remark, receiverId: $actor->id, assignedTo: $actor->id);
    }

    public function share(ServiceApplication $application, User $actor, array $payload)
    {
        $targetId = (int)($payload['officer_id'] ?? $payload['front_officer_id'] ?? $payload['back_officer_id'] ?? 0);
        $windowId = (int)($payload['to_window_id'] ?? $payload['window_id'] ?? $application->current_window_id);
        $target = User::with('roles')->findOrFail($targetId);
        $window = Window::findOrFail($windowId);
        $level = $application->administrative_level ?: AppRoles::userLevel($actor);

        $this->assertSameLevelAndScope($application, $actor, $target, $level);
        $this->assertOfficerWindow($target, $window, $level);

        $status = $target->hasRole(AppRoles::BACK_OFFICER) ? 'shared_to_back_officer' : 'shared_to_front_officer';

        return DB::transaction(function () use ($application, $actor, $target, $window, $level, $payload, $status) {
            ServiceApplicationShare::create([
                'application_id' => $application->id,
                'shared_from_officer_id' => $actor->id,
                'shared_to_officer_id' => $target->id,
                'from_window_id' => $application->current_window_id,
                'to_window_id' => $window->id,
                'administrative_level' => $level,
                'note' => $payload['remark'] ?? $payload['note'] ?? null,
                'shared_at' => now(),
            ]);

            return $this->transition(
                $application, $actor, $status, 'shared_to_officer', $payload['remark'] ?? $payload['note'] ?? null,
                receiverId: $target->id, toWindowId: $window->id, assignedTo: $target->id, metadata: ['share' => true]
            );
        });
    }

    public function forwardToBackOfficer(ServiceApplication $application, User $actor, array $payload)
    {
        if (!$application->service?->has_back_officer) {
            throw ValidationException::withMessages(['service' => ['This service does not require back officer verification.']]);
        }

        $targetId = (int)($payload['back_officer_id'] ?? $payload['officer_id'] ?? 0);
        $target = $targetId ? User::with('roles')->findOrFail($targetId) : $this->firstAssignedOfficer($application, AppRoles::BACK_OFFICER);
        if (!$target || !$target->hasRole(AppRoles::BACK_OFFICER)) {
            throw ValidationException::withMessages(['back_officer_id' => ['No active back officer is assigned to this same service, window, level, and scope.']]);
        }

        $this->assertSameLevelAndScope($application, $actor, $target, $application->administrative_level);

        return $this->transition($application, $actor, 'forwarded_to_back_officer', 'forwarded_to_back_officer', $payload['remark'] ?? null, receiverId: $target->id, assignedTo: $target->id, assignedRole: AppRoles::BACK_OFFICER);
    }

    public function approve(ServiceApplication $application, User $actor, ?string $remark = null)
    {
        if ($actor->hasRole(AppRoles::BACK_OFFICER)) {
            $front = $this->firstAssignedOfficer($application, AppRoles::FRONT_OFFICER);
            return $this->transition($application, $actor, 'back_officer_approved', 'back_officer_approved', $remark, receiverId: $front?->id, assignedTo: $front?->id, assignedRole: AppRoles::FRONT_OFFICER);
        }
        return $this->transition($application, $actor, 'approved', 'approved', $remark, receiverId: $actor->id, assignedTo: $actor->id);
    }

    public function reject(ServiceApplication $application, User $actor, ?string $remark = null)
    {
        if ($actor->hasRole(AppRoles::BACK_OFFICER)) {
            $front = $this->firstAssignedOfficer($application, AppRoles::FRONT_OFFICER);

            return $this->transition(
                $application,
                $actor,
                'back_officer_rejected',
                'back_officer_rejected',
                $remark,
                receiverId: $front?->id,
                assignedTo: $front?->id,
                assignedRole: AppRoles::FRONT_OFFICER,
                extra: [
                    'rejection_reason' => $remark,
                    'rejected_at' => now(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Front Officer rejection means return for correction.
        |--------------------------------------------------------------------------
        */
        return $this->transition(
            $application,
            $actor,
            'returned_to_customer',
            'returned_to_customer_for_correction',
            $remark,
            receiverId: $application->customer_id,
            assignedTo: $application->customer_id,
            extra: [
                'rejection_reason' => $remark,
                'returned_count' => ((int) $application->returned_count) + 1,
            ]
        );
    }

    public function returnApplication(ServiceApplication $application, User $actor, ?string $remark = null)
    {
        if ($actor->hasRole(AppRoles::BACK_OFFICER)) {
            $front = $this->firstAssignedOfficer($application, AppRoles::FRONT_OFFICER);
            return $this->transition($application, $actor, 'returned_to_front_officer', 'returned_to_front_officer', $remark, receiverId: $front?->id, assignedTo: $front?->id, assignedRole: AppRoles::FRONT_OFFICER);
        }
        return $this->transition($application, $actor, 'returned_to_customer', 'returned_to_customer', $remark, receiverId: $application->customer_id, assignedTo: $application->customer_id, extra: ['returned_count' => ((int)$application->returned_count) + 1]);
    }

    public function complete(ServiceApplication $application, User $actor, ?string $remark = null)
    {
        return $this->transition($application, $actor, 'completed', 'completed', $remark, receiverId: $application->customer_id, assignedTo: $actor->id, extra: ['completed_at' => now()]);
    }

    public function escalateToManager(ServiceApplication $application, User $actor, array $payload)
    {
        $managerId = (int)($payload['manager_id'] ?? 0);
        $manager = $managerId ? User::with('roles')->findOrFail($managerId) : $this->firstManagerForApplication($application);
        if (!$manager || !$manager->hasRole(AppRoles::MANAGER)) {
            throw ValidationException::withMessages(['manager_id' => ['No valid manager found for this level/scope.']]);
        }
        return $this->transition($application, $actor, 'escalated_to_manager', 'escalated_to_manager', $payload['remark'] ?? null, receiverId: $manager->id, assignedTo: $manager->id, assignedRole: AppRoles::MANAGER, metadata: ['escalation' => true, 'manager_id' => $manager->id]);
    }

    public function managerAssign(ServiceApplication $application, User $manager, array $payload)
    {
        $officer = User::with('roles')->findOrFail((int)($payload['officer_id'] ?? 0));
        $window = Window::findOrFail((int)($payload['window_id'] ?? $application->current_window_id));
        $this->assertSameLevelAndScope($application, $manager, $officer, $application->administrative_level);
        $this->assertOfficerWindow($officer, $window, $application->administrative_level);
        $role = $officer->hasRole(AppRoles::BACK_OFFICER) ? AppRoles::BACK_OFFICER : AppRoles::FRONT_OFFICER;
        return $this->transition($application, $manager, 'assigned_by_manager', 'assigned_by_manager', $payload['remark'] ?? null, receiverId: $officer->id, toWindowId: $window->id, assignedTo: $officer->id, assignedRole: $role, metadata: ['manager_assignment' => true]);
    }

    public function managerReturn(ServiceApplication $application, User $manager, ?string $remark = null)
    {
        $receiver = $this->firstAssignedOfficer($application, AppRoles::BACK_OFFICER) ?: $this->firstAssignedOfficer($application, AppRoles::FRONT_OFFICER);
        return $this->transition($application, $manager, 'returned_to_back_officer', 'returned_to_officer_by_manager', $remark, receiverId: $receiver?->id, assignedTo: $receiver?->id);
    }

    public function managerEscalateUp(ServiceApplication $application, User $manager, array $payload)
    {
        $upper = $this->upperManager($manager);
        if (!$upper) throw ValidationException::withMessages(['manager' => ['No upper-level manager found.']]);
        return $this->transition($application, $manager, 'manager_forwarded', 'manager_escalated_up', $payload['remark'] ?? null, receiverId: $upper->id, assignedTo: $upper->id, assignedRole: AppRoles::MANAGER, metadata: ['upper_manager_id' => $upper->id]);
    }

    protected function assertAppointmentIsDue(ServiceApplication $application, string $action): void
    {
        if ($action === 'appointment_scheduled') {
            return;
        }

        $appointmentAt = $application->appointment_at;

        if (
            $application->status === 'appointment_scheduled' &&
            $appointmentAt &&
            now()->lt($appointmentAt)
        ) {
            throw ValidationException::withMessages([
                'appointment_at' => [
                    'This application is locked until the appointment date and time: ' . $appointmentAt->format('Y-m-d H:i')
                ],
            ]);
        }
    }

    protected function transition(ServiceApplication $app, User $actor, string $status, string $action, ?string $remark, ?int $receiverId = null, ?int $toWindowId = null, ?int $assignedTo = null, ?string $assignedRole = null, array $metadata = [], array $extra = [])
    {
        $this->assertAppointmentIsDue($app, $action);

        return DB::transaction(function () use ($app, $actor, $status, $action, $remark, $receiverId, $toWindowId, $assignedTo, $assignedRole, $metadata, $extra) {
            $old = $app->status;
            $fromWindowId = $app->current_window_id;
            $targetWindowId = $toWindowId ?: $fromWindowId;
            $updates = array_merge([
                'status' => $status,
                'current_stage' => $status,
                'current_officer_id' => $assignedTo,
                'assigned_to' => $assignedTo,
                'assigned_role' => $assignedRole,
                'current_window_id' => $targetWindowId,
            ], $extra);
            $app->update($updates);

            $this->storeDocuments($app, $actor);

            ServiceApplicationHistory::create([
                'application_id' => $app->id,
                'from_status' => $old,
                'to_status' => $status,
                'action' => $action,
                'action_type' => $this->actionType($action),
                'remark' => $remark,
                'comment' => $remark,
                'metadata' => $metadata,
                'actor_id' => $actor->id,
                'sender_id' => $actor->id,
                'receiver_id' => $receiverId,
                'from_window_id' => $fromWindowId,
                'to_window_id' => $targetWindowId,
                'administrative_level' => $app->administrative_level,
                'status' => $status,
                'escalation_details' => $metadata['escalation'] ?? false ? $metadata : null,
            ]);

            return $this->show($app->fresh());
        });
    }

    protected function storeDocuments(ServiceApplication $app, User $actor): void
    {
        $files = request()->file('documents', []);
        if (!$files) return;
        $this->fileService->storeFiles($app, ['workflow_documents' => $files], $actor);
    }

    protected function actorOfficerRole(User $actor): string
    {
        return $actor->hasRole(AppRoles::BACK_OFFICER) ? AppRoles::BACK_OFFICER : AppRoles::FRONT_OFFICER;
    }

    protected function actionType(string $action): string
    {
        return str_contains($action, 'manager') || str_contains($action, 'escalat') ? 'manager_escalation' : 'workflow_action';
    }

    protected function firstAssignedOfficer(ServiceApplication $app, string $role): ?User
    {
        $level = $app->administrative_level ?: AppRoles::LEVEL_CITY;

        /*
        |--------------------------------------------------------------------------
        | Back/Front officer lookup for workflow routing
        |--------------------------------------------------------------------------
        | Accept & Forward must find an active Back Officer assigned to:
        | - same service
        | - same administrative level
        | - same administrative scope
        |
        | If the project also has officer_window_assignments, the officer must be
        | assigned to the current application window OR the service assignment row
        | itself must already contain the same window_id.
        |
        | Supports both legacy officer_type values:
        | - back / back_officer
        | - front / front_officer
        */
        $officerTypes = match ($role) {
            AppRoles::BACK_OFFICER => [AppRoles::BACK_OFFICER, 'back'],
            AppRoles::FRONT_OFFICER => [AppRoles::FRONT_OFFICER, 'front'],
            default => [$role],
        };

        $query = User::query()
            ->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->where('name', $role))
            ->whereExists(function ($query) use ($app, $level, $officerTypes) {
                $query->selectRaw('1')
                    ->from('user_service_assignments')
                    ->whereColumn('user_service_assignments.user_id', 'users.id')
                    ->where('user_service_assignments.service_id', $app->service_id)
                    ->where('user_service_assignments.assignment_level', $level)
                    ->whereIn('user_service_assignments.officer_type', $officerTypes)
                    ->where('user_service_assignments.is_active', true)
                    ->where(function ($windowQuery) use ($app) {
                        /*
                        |--------------------------------------------------------------------------
                        | Accept either:
                        | 1) direct user_service_assignments.window_id match
                        | 2) null/legacy window_id plus matching officer_window_assignments row
                        |--------------------------------------------------------------------------
                        */
                        $windowQuery
                            ->where('user_service_assignments.window_id', $app->current_window_id)
                            ->orWhereNull('user_service_assignments.window_id')
                            ->orWhereExists(function ($q) use ($app) {
                                $q->selectRaw('1')
                                    ->from('officer_window_assignments')
                                    ->whereColumn('officer_window_assignments.officer_id', 'users.id')
                                    ->where('officer_window_assignments.window_id', $app->current_window_id)
                                    ->where('officer_window_assignments.assignment_level', $app->administrative_level)
                                    ->where('officer_window_assignments.is_active', true);
                            });
                    });
            });

        $query
            ->when($level === AppRoles::LEVEL_CITY, function ($q) use ($app) {
                $q->where('city_id', $app->city_id)
                    ->whereNull('subcity_id')
                    ->whereNull('woreda_id');
            })
            ->when($level === AppRoles::LEVEL_SUBCITY, function ($q) use ($app) {
                $q->where('city_id', $app->city_id)
                    ->where('subcity_id', $app->subcity_id)
                    ->whereNull('woreda_id');
            })
            ->when($level === AppRoles::LEVEL_WOREDA, function ($q) use ($app) {
                $q->where('city_id', $app->city_id)
                    ->where('subcity_id', $app->subcity_id)
                    ->where('woreda_id', $app->woreda_id);
            });

        return $query->orderBy('id')->first();
    }

    protected function firstManagerForApplication(ServiceApplication $app): ?User
    {
        return User::role(AppRoles::MANAGER)
            ->where('is_active', true)
            ->when($app->administrative_level === AppRoles::LEVEL_CITY, fn ($q) => $q->where('city_id', $app->city_id)->whereNull('subcity_id')->whereNull('woreda_id'))
            ->when($app->administrative_level === AppRoles::LEVEL_SUBCITY, fn ($q) => $q->where('subcity_id', $app->subcity_id)->whereNull('woreda_id'))
            ->when($app->administrative_level === AppRoles::LEVEL_WOREDA, fn ($q) => $q->where('woreda_id', $app->woreda_id))
            ->first();
    }

    protected function upperManager(User $manager): ?User
    {
        if ($manager->woreda_id) return User::role(AppRoles::MANAGER)->where('subcity_id', $manager->subcity_id)->whereNull('woreda_id')->where('is_active', true)->first();
        if ($manager->subcity_id) return User::role(AppRoles::MANAGER)->where('city_id', $manager->city_id)->whereNull('subcity_id')->where('is_active', true)->first();
        return null;
    }

    protected function assertOfficerWindow(User $officer, Window $window, ?string $level): void
    {
        $assigned = \App\Models\OfficerWindowAssignment::query()
            ->where('officer_id', $officer->id)
            ->where('window_id', $window->id)
            ->where('assignment_level', $level)
            ->where('is_active', true)
            ->exists();
        if (!$assigned) throw ValidationException::withMessages(['window_id' => ['Selected officer is not assigned to this window.']]);
    }

    protected function assertSameLevelAndScope(ServiceApplication $app, User $actor, User $target, ?string $level): void
    {
        if (AppRoles::userLevel($target) !== $level) throw ValidationException::withMessages(['officer_id' => ['Target user is not on the same administrative level.']]);
        if ($level === AppRoles::LEVEL_CITY && (int)$target->city_id !== (int)$app->city_id) throw ValidationException::withMessages(['officer_id' => ['Target city scope mismatch.']]);
        if ($level === AppRoles::LEVEL_SUBCITY && (int)$target->subcity_id !== (int)$app->subcity_id) throw ValidationException::withMessages(['officer_id' => ['Target subcity scope mismatch.']]);
        if ($level === AppRoles::LEVEL_WOREDA && (int)$target->woreda_id !== (int)$app->woreda_id) throw ValidationException::withMessages(['officer_id' => ['Target woreda scope mismatch.']]);
    }
}
