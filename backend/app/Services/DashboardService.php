<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Service;
use App\Models\ServiceApplication;
use App\Models\ServiceApplicationAppointment;
use App\Models\ServiceForm;
use App\Models\ServiceFormField;
use App\Models\ServiceFormSection;
use App\Models\User;
use App\Models\Window;
use App\Support\AccessScope;
use App\Support\AppRoles;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardService
{
    public function __construct(
        protected AccessScope $scope
    ) {}

    public function overview(User $user): array
    {
        $role = $user->getRoleNames()->first() ?: AppRoles::CUSTOMER;
        $permissions = $user->getAllPermissions()->pluck('name')->values()->all();

        $serviceApplications = ServiceApplication::query();
        $this->scope->applyServiceApplicationScope($serviceApplications, $user);

        $applications = Application::query();
        $this->scope->applyApplicationScope($applications, $user);

        $users = User::query();
        $this->scope->applyUserScope($users, $user);

        $statusCounts = $this->statusCounts(clone $serviceApplications, $user);
        $moduleCounts = $this->moduleCounts($user, clone $serviceApplications, clone $users);

        return [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'avatar_url' => $user->photo_url ?? $user->avatar_url ?? null,
                'role' => $role,
                'role_label' => AppRoles::labels()[$role] ?? $role,
                'location_level' => AppRoles::userLevel($user),
                'scope_label' => $this->scope->scopeLabel($user),
                'city' => $user->city?->name,
                'subcity' => $user->subcity?->name,
                'woreda' => $user->woreda?->name,
            ],
            'permissions' => $permissions,
            'cards' => $this->cardsFor($user, clone $serviceApplications, clone $applications, clone $users, $statusCounts, $moduleCounts),
            'status_counts' => $statusCounts,
            'module_counts' => $moduleCounts,
            'payment_counts' => $this->paymentCounts($user),
            'appointment_counts' => $this->appointmentCounts($user, clone $serviceApplications),
            'complaint_counts' => $this->complaintCounts($user),
            'quick_links' => $this->quickLinksFor($role, $permissions),
            'recent_applications' => $this->recentApplications(clone $serviceApplications),
            'recent_users' => $this->recentUsers(clone $users),
            'role_dashboard' => $this->roleDashboard($user, clone $serviceApplications, clone $users, $statusCounts, $moduleCounts),
        ];
    }

    protected function roleDashboard(User $user, $serviceApplications, $users, array $status, array $modules): array
    {
        if ($user->hasRole(AppRoles::CUSTOMER)) {
            return [
                'title' => 'Customer Service Dashboard',
                'description' => 'Submit applications, track progress, appointments, payments, and documents.',
                'primary_action' => ['label' => 'New Application', 'href' => '/services'],
                'sections' => [
                    [
                        'title' => 'My Application Status',
                        'items' => [
                            ['label' => 'Total Applications', 'value' => $status['total']],
                            ['label' => 'Pending', 'value' => $status['pending']],
                            ['label' => 'Appointments', 'value' => $status['appointed']],
                            ['label' => 'Completed', 'value' => $status['completed']],
                        ],
                    ],
                ],
            ];
        }

        if ($user->hasRole(AppRoles::SUPER_ADMIN)) {
            return [
                'title' => 'Super Admin System Dashboard',
                'description' => 'System-wide users, services, forms, windows, applications, and platform control.',
                'primary_action' => ['label' => 'Manage Users', 'href' => '/dashboard/users'],
                'sections' => [
                    [
                        'title' => 'System Configuration',
                        'items' => [
                            ['label' => 'Users', 'value' => $modules['users']],
                            ['label' => 'Services', 'value' => $modules['services']],
                            ['label' => 'Windows', 'value' => $modules['windows']],
                            ['label' => 'Forms', 'value' => $modules['forms']],
                        ],
                    ],
                    [
                        'title' => 'Workflow Overview',
                        'items' => [
                            ['label' => 'Applications', 'value' => $status['total']],
                            ['label' => 'Pending', 'value' => $status['pending']],
                            ['label' => 'Under Review', 'value' => $status['under_review']],
                            ['label' => 'Completed', 'value' => $status['completed']],
                        ],
                    ],
                ],
            ];
        }

        if ($user->hasRole(AppRoles::ADMIN)) {
            return [
                'title' => 'Admin Operations Dashboard',
                'description' => 'Location-scoped users, services, windows, assignments, and activation operations.',
                'primary_action' => ['label' => 'Create User', 'href' => '/dashboard/users/add'],
                'sections' => [
                    [
                        'title' => 'User Administration',
                        'items' => [
                            ['label' => 'Users in Scope', 'value' => $modules['users']],
                            ['label' => 'Active Users', 'value' => $modules['active_users']],
                            ['label' => 'Disabled Users', 'value' => $modules['inactive_users']],
                            ['label' => 'Activation Requests', 'value' => $modules['activation_requests']],
                        ],
                    ],
                    [
                        'title' => 'Service Setup',
                        'items' => [
                            ['label' => 'Services', 'value' => $modules['services']],
                            ['label' => 'Windows', 'value' => $modules['windows']],
                            ['label' => 'Forms', 'value' => $modules['forms']],
                            ['label' => 'Form Fields', 'value' => $modules['form_fields']],
                        ],
                    ],
                ],
            ];
        }

        if ($user->hasRole(AppRoles::MANAGER)) {
            return [
                'title' => 'Manager Workflow Dashboard',
                'description' => 'Monitor escalations, officer workload, service performance, and application decisions.',
                'primary_action' => ['label' => 'Manager Queue', 'href' => '/dashboard/manager/applications'],
                'sections' => [
                    [
                        'title' => 'Manager Queue',
                        'items' => [
                            ['label' => 'Escalated', 'value' => $status['escalated']],
                            ['label' => 'Under Review', 'value' => $status['under_review']],
                            ['label' => 'Returned', 'value' => $status['returned']],
                            ['label' => 'Completed', 'value' => $status['completed']],
                        ],
                    ],
                    [
                        'title' => 'Scope Performance',
                        'items' => [
                            ['label' => 'Applications', 'value' => $status['total']],
                            ['label' => 'Approved', 'value' => $status['approved']],
                            ['label' => 'Rejected', 'value' => $status['rejected']],
                            ['label' => 'Appointments', 'value' => $status['appointed']],
                        ],
                    ],
                ],
            ];
        }

        if ($user->hasRole(AppRoles::FRONT_OFFICER)) {
            return [
                'title' => 'Front Officer Queue Dashboard',
                'description' => 'Receive submitted applications, appointments, sharing, forwarding, and customer corrections.',
                'primary_action' => ['label' => 'Open Queue', 'href' => '/dashboard/officer/applications'],
                'sections' => [
                    [
                        'title' => 'Front Officer Queue',
                        'items' => [
                            ['label' => 'New Applications', 'value' => $status['submitted']],
                            ['label' => 'Appointments', 'value' => $status['appointed']],
                            ['label' => 'Returned', 'value' => $status['returned']],
                            ['label' => 'Shared To Me', 'value' => (clone $serviceApplications)->where('status', 'shared_to_front_officer')->count()],
                        ],
                    ],
                    [
                        'title' => 'Processing',
                        'items' => [
                            ['label' => 'Under Review', 'value' => $status['under_review']],
                            ['label' => 'Forwarded', 'value' => (clone $serviceApplications)->where('status', 'forwarded_to_back_officer')->count()],
                            ['label' => 'Completed', 'value' => $status['completed']],
                            ['label' => 'Rejected', 'value' => $status['rejected']],
                        ],
                    ],
                ],
            ];
        }

        if ($user->hasRole(AppRoles::BACK_OFFICER)) {
            return [
                'title' => 'Back Officer Review Dashboard',
                'description' => 'Review forwarded/shared applications, approve, reject, share, or escalate.',
                'primary_action' => ['label' => 'Open Review Queue', 'href' => '/dashboard/officer/applications'],
                'sections' => [
                    [
                        'title' => 'Back Officer Queue',
                        'items' => [
                            ['label' => 'Forwarded To Me', 'value' => (clone $serviceApplications)->where('status', 'forwarded_to_back_officer')->count()],
                            ['label' => 'Shared To Me', 'value' => (clone $serviceApplications)->where('status', 'shared_to_back_officer')->count()],
                            ['label' => 'Under Back Review', 'value' => (clone $serviceApplications)->whereIn('status', ['back_officer_review', 'under_back_review'])->count()],
                            ['label' => 'Escalated', 'value' => $status['escalated']],
                        ],
                    ],
                    [
                        'title' => 'Decisions',
                        'items' => [
                            ['label' => 'Approved', 'value' => (clone $serviceApplications)->where('status', 'back_officer_approved')->count()],
                            ['label' => 'Rejected', 'value' => (clone $serviceApplications)->where('status', 'back_officer_rejected')->count()],
                            ['label' => 'Returned', 'value' => $status['returned']],
                            ['label' => 'Completed', 'value' => $status['completed']],
                        ],
                    ],
                ],
            ];
        }

        return [
            'title' => 'Dashboard',
            'description' => 'Role-based dashboard overview.',
            'primary_action' => ['label' => 'Open Dashboard', 'href' => '/dashboard'],
            'sections' => [],
        ];
    }

    protected function cardsFor(User $user, $serviceApplications, $applications, $users, array $status, array $modules): array
    {
        $roleDashboard = $this->roleDashboard($user, clone $serviceApplications, clone $users, $status, $modules);
        $cards = [];

        foreach ($roleDashboard['sections'] as $section) {
            foreach ($section['items'] as $item) {
                $cards[] = [
                    'key' => str($item['label'])->slug('_')->toString(),
                    'label' => $item['label'],
                    'value' => $item['value'],
                    'description' => $section['title'],
                ];
            }
        }

        return $cards;
    }

    protected function moduleCounts(User $user, $serviceApplications, $users): array
    {
        $activationRequests = Schema::hasColumn('users', 'status')
            ? (clone $users)->whereIn('status', ['pending_city_approval', 'pending_subcity_verification', 'pending_activation'])->count()
            : 0;

        return [
            'users' => (clone $users)->count(),
            'active_users' => Schema::hasColumn('users', 'is_active') ? (clone $users)->where('is_active', true)->count() : 0,
            'inactive_users' => Schema::hasColumn('users', 'is_active') ? (clone $users)->where('is_active', false)->count() : 0,
            'activation_requests' => $activationRequests,
            'services' => Service::count(),
            'active_services' => Schema::hasColumn('services', 'status') ? Service::where('status', 'active')->count() : Service::count(),
            'inactive_services' => Schema::hasColumn('services', 'status') ? Service::where('status', 'inactive')->count() : 0,
            'forms' => ServiceForm::count(),
            'form_sections' => class_exists(ServiceFormSection::class) ? ServiceFormSection::count() : 0,
            'form_fields' => class_exists(ServiceFormField::class) ? ServiceFormField::count() : 0,
            'windows' => class_exists(Window::class) ? Window::count() : 0,
            'applications' => (clone $serviceApplications)->count(),
            'appointments' => $this->appointmentCounts($user, clone $serviceApplications)['total'],
        ];
    }

    protected function recentApplications($query): array
    {
        return $query
            ->with(['service', 'customer', 'currentWindow'])
            ->latest('submitted_at')
            ->limit(8)
            ->get()
            ->map(fn (ServiceApplication $application) => [
                'id' => $application->id,
                'tracking_number' => $application->tracking_number,
                'service_name' => $application->service?->name,
                'customer_name' => $application->customer?->name,
                'window_name' => $application->currentWindow?->name,
                'status' => $application->status,
                'submitted_at' => $application->submitted_at,
                'updated_at' => $application->updated_at,
            ])
            ->values()
            ->all();
    }

    protected function recentUsers($query): array
    {
        return $query
            ->with('roles')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
                'is_active' => (bool) ($user->is_active ?? false),
                'created_at' => $user->created_at,
            ])
            ->values()
            ->all();
    }

    protected function statusCounts($query, ?User $user = null): array
    {
        /*
        |--------------------------------------------------------------------------
        | Mutually-exclusive customer dashboard categories
        |--------------------------------------------------------------------------
        | Each raw workflow status belongs to only one customer-facing category.
        | This guarantees:
        | Pending + Rejected + Approved + Appointed + Completed <= Total
        |--------------------------------------------------------------------------
        */
        $pendingStatuses = [
            'draft',
            'submitted',
            'resubmitted',
            'accepted',
            'front_officer_review',
            'under_review',
            'forwarded_to_back_officer',
            'back_officer_review',
            'under_back_review',
            'shared',
            'shared_to_front_officer',
            'shared_to_back_officer',
            'returned_from_share',
            'escalated',
            'escalated_to_manager',
            'manager_review',
            'manager_assigned',
            'manager_forwarded',
            'manager_returned',
            'returned_to_front_officer',
            'returned_to_back_officer',
        ];

        $rejectedStatuses = [
            'rejected',
            'returned',
            'returned_to_customer',
            'back_officer_rejected',
            'cancelled',
        ];

        $approvedStatuses = [
            'approved',
            'back_officer_approved',
            'manager_resolved',
        ];

        $appointedStatuses = [
            'appointment_scheduled',
        ];

        $completedStatuses = [
            'completed',
            'closed',
        ];

        return [
            'total' => (clone $query)->count(),

            'pending' => (clone $query)
                ->whereIn('status', $pendingStatuses)
                ->count(),

            'rejected' => (clone $query)
                ->whereIn('status', $rejectedStatuses)
                ->count(),

            'approved' => (clone $query)
                ->whereIn('status', $approvedStatuses)
                ->count(),

            'appointed' => (clone $query)
                ->whereIn('status', $appointedStatuses)
                ->count(),

            'completed' => (clone $query)
                ->whereIn('status', $completedStatuses)
                ->count(),

            /*
            |--------------------------------------------------------------------------
            | Extra operational counters
            |--------------------------------------------------------------------------
            | These are still useful for staff dashboards but must not be added to
            | the customer card total, because they can overlap with the primary
            | customer categories.
            |--------------------------------------------------------------------------
            */
            'submitted' => (clone $query)->where('status', 'submitted')->count(),

            'under_review' => (clone $query)
                ->whereIn('status', [
                    'front_officer_review',
                    'forwarded_to_back_officer',
                    'back_officer_review',
                    'under_review',
                    'under_back_review',
                    'manager_review',
                ])
                ->count(),

            'shared' => (clone $query)
                ->whereIn('status', [
                    'shared',
                    'shared_to_front_officer',
                    'shared_to_back_officer',
                ])
                ->count(),

            'returned' => (clone $query)
                ->whereIn('status', [
                    'returned',
                    'returned_to_customer',
                    'returned_to_front_officer',
                    'returned_to_back_officer',
                    'returned_from_share',
                    'manager_returned',
                ])
                ->count(),

            'escalated' => (clone $query)
                ->whereIn('status', [
                    'escalated',
                    'escalated_to_manager',
                    'manager_review',
                    'manager_forwarded',
                ])
                ->count(),
        ];
    }

    protected function paymentCounts(User $user): array
    {
        if (! Schema::hasTable('payments')) {
            return ['pending' => 0, 'paid' => 0];
        }

        $query = DB::table('payments');

        if ($user->hasRole(AppRoles::CUSTOMER)) {
            if (Schema::hasColumn('payments', 'user_id')) {
                $query->where('user_id', $user->id);
            } elseif (Schema::hasColumn('payments', 'customer_id')) {
                $query->where('customer_id', $user->id);
            }
        }

        return [
            'pending' => (clone $query)->whereIn('status', ['pending', 'unpaid', 'waiting'])->count(),
            'paid' => (clone $query)->whereIn('status', ['paid', 'completed', 'success'])->count(),
        ];
    }

    protected function appointmentCounts(User $user, $serviceApplications = null): array
    {
        if (! Schema::hasTable('service_application_appointments')) {
            return ['total' => 0, 'upcoming' => 0];
        }

        $applicationIds = $serviceApplications
            ? (clone $serviceApplications)->pluck('id')
            : ServiceApplication::query()->where('customer_id', $user->id)->pluck('id');

        $query = ServiceApplicationAppointment::query()
            ->whereIn('application_id', $applicationIds);

        return [
            'total' => (clone $query)->count(),
            'upcoming' => (clone $query)
                ->where('appointment_at', '>=', now())
                ->whereIn('status', ['scheduled', 'pending', 'confirmed'])
                ->count(),
        ];
    }

    protected function complaintCounts(User $user): array
    {
        foreach (['complaints', 'feedback', 'complaints_feedback'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $query = DB::table($table);

            if ($user->hasRole(AppRoles::CUSTOMER)) {
                if (Schema::hasColumn($table, 'user_id')) {
                    $query->where('user_id', $user->id);
                } elseif (Schema::hasColumn($table, 'customer_id')) {
                    $query->where('customer_id', $user->id);
                }
            }

            return [
                'total' => (clone $query)->count(),
                'open' => Schema::hasColumn($table, 'status')
                    ? (clone $query)->whereIn('status', ['open', 'pending', 'new'])->count()
                    : 0,
            ];
        }

        return ['total' => 0, 'open' => 0];
    }

    protected function quickLinksFor(string $role, array $permissions): array
    {
        $links = [
            ['label' => 'Users', 'href' => '/dashboard/users', 'permission' => 'users.read'],
            ['label' => 'Roles', 'href' => '/dashboard/roles', 'permission' => 'roles.read'],
            ['label' => 'Permissions', 'href' => '/dashboard/permissions', 'permission' => 'permissions.read'],
            ['label' => 'Services', 'href' => '/dashboard/services', 'permission' => 'services.read'],
            ['label' => 'Form Builder', 'href' => '/dashboard/service-forms', 'permission' => 'service_forms.read'],
            ['label' => 'Service Windows', 'href' => '/dashboard/service-window', 'permission' => 'service_windows.read'],
            ['label' => 'Windows', 'href' => '/dashboard/windows', 'permission' => 'windows.read'],
            ['label' => 'Applications', 'href' => '/dashboard/service-applications', 'permission' => 'service_applications.read'],
            ['label' => 'Officer Queue', 'href' => '/dashboard/officer/applications', 'permission' => 'service_applications.review'],
            ['label' => 'New Application', 'href' => '/services', 'permission' => 'applications.own'],
            ['label' => 'Total Application', 'href' => '/dashboard/my-applications', 'permission' => 'applications.own'],
            ['label' => 'Appointments', 'href' => '/dashboard/appointments', 'permission' => 'applications.own'],
            ['label' => 'Payments', 'href' => '/dashboard/payments', 'permission' => 'applications.own'],
            ['label' => 'Complaints & Feedback', 'href' => '/dashboard/complaints-feedback', 'permission' => 'applications.own'],
            ['label' => 'Help & Support', 'href' => '/dashboard/help-support', 'permission' => 'applications.own'],
        ];

        return collect($links)
            ->filter(fn (array $link) => in_array($link['permission'], $permissions, true))
            ->values()
            ->all();
    }
}
