<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\ApplicationQueue;
use App\Models\ServiceApplication;
use App\Models\ServiceApplicationData;
use App\Models\ServiceApplicationHistory;
use App\Services\ApplicationFileService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CustomerServiceApplicationController extends Controller
{
    private const STATUS_GROUPS = [
        'pending' => [
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
        ],
        'rejected' => [
            'rejected',
            'returned',
            'returned_to_customer',
            'back_officer_rejected',
            'cancelled',
        ],
        'approved' => [
            'approved',
            'back_officer_approved',
            'manager_resolved',
        ],
        'appointed' => [
            'appointment_scheduled',
        ],
        'completed' => [
            'completed',
            'closed',
            'sent_to_customer',
        ],
    ];

    public function __construct(protected ApplicationFileService $fileService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $baseQuery = ServiceApplication::query();

        $this->applyCustomerOwnership($baseQuery, $user);
        $this->applySearch($baseQuery, $request);

        $statusCounts = $this->statusCounts(clone $baseQuery);

        $applicationsQuery = (clone $baseQuery)->with([
            'service',
            'customer',
            'city',
            'subcity',
            'woreda',
            'appointments',
            'queue',
            'histories',
            'feedback',
        ]);

        $this->applyStatusFilter($applicationsQuery, $request->input('status'));

        $applications = $applicationsQuery
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate(min((int) $request->input('per_page', 10), 100));

        $data = collect($applications->items())->map(function (ServiceApplication $app) {
            $queue = $app->queue;

            $applicationsAhead = null;
            $isNext = false;

            if ($queue) {
                $applicationsAhead = ApplicationQueue::query()
                    ->where('status', 'waiting')
                    ->whereHas('application', function ($query) use ($app) {
                        $query->where('service_id', $app->service_id);
                    })
                    ->where('created_at', '<', $queue->created_at)
                    ->count();

                $isNext = $applicationsAhead === 0 && $queue->status === 'waiting';
            }

            return [
                ...$app->toArray(),
                'queue_info' => $queue ? [
                    'queue_number' => $queue->queue_number,
                    'status' => $queue->status,
                    'position' => $queue->position,
                    'applications_ahead' => $applicationsAhead,
                    'is_next' => $isNext,
                ] : null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Customer applications retrieved successfully',
            'data' => $data,
            'meta' => [
                'current_page' => $applications->currentPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
                'last_page' => $applications->lastPage(),
                'status_counts' => $statusCounts,
            ],
        ]);
    }

    public function show(Request $request, ServiceApplication $application): JsonResponse
    {
        abort_if(!$this->customerOwnsApplication($application, $request->user()), 403);

        $application->load([
            'service',
            'customer',
            'city',
            'subcity',
            'woreda',
            'currentWindow',
            'currentOfficer',
            'assignee',
            'data',
            'files.uploader',
            'appointments.scheduler',
            'workflows.window',
            'workflows.officer',
            'histories.actor',
            'histories.sender',
            'histories.receiver',
            'histories.fromWindow',
            'histories.toWindow',
            'shares.fromOfficer',
            'shares.toOfficer',
            'queue',
            'feedback',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer application retrieved successfully',
            'data' => $application,
        ]);
    }

    public function resubmit(Request $request, ServiceApplication $application): JsonResponse
    {
        abort_if(!$this->customerOwnsApplication($application, $request->user()), 403);

        $status = strtolower((string) $application->status);

        if (!in_array($status, ['rejected', 'returned', 'returned_to_customer', 'back_officer_rejected', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only rejected or returned applications can be resubmitted.'],
            ]);
        }

        $validated = $request->validate([
            'data' => ['nullable', 'array'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:10240'],
            'remark' => ['nullable', 'string', 'max:2000'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $application = DB::transaction(function () use ($application, $request, $validated) {
            foreach (($validated['data'] ?? []) as $field => $value) {
                ServiceApplicationData::updateOrCreate(
                    [
                        'application_id' => $application->id,
                        'field_name' => (string) $field,
                    ],
                    [
                        'field_value' => is_array($value) ? json_encode($value) : $value,
                    ]
                );
            }

            $uploadedFiles = $request->file('files', []);

            if (!empty($uploadedFiles)) {
                $this->fileService->storeFiles($application, $uploadedFiles, $request->user());
            }

            $oldStatus = $application->status;

            $application->forceFill([
                'status' => 'resubmitted',
                'current_stage' => 'resubmitted',
                'submitted_at' => now(),
                'rejection_reason' => null,
                'returned_count' => (int) $application->returned_count + 1,
            ])->save();

            ServiceApplicationHistory::create([
                'application_id' => $application->id,
                'from_status' => $oldStatus,
                'to_status' => 'resubmitted',
                'action' => 'resubmitted',
                'action_type' => 'customer_action',
                'remark' => $validated['remark'] ?? $validated['message'] ?? 'Application resubmitted by customer.',
                'comment' => $validated['remark'] ?? $validated['message'] ?? null,
                'actor_id' => $request->user()->id,
                'sender_id' => $request->user()->id,
                'receiver_id' => $application->current_officer_id,
                'from_window_id' => $application->current_window_id,
                'to_window_id' => $application->current_window_id,
                'administrative_level' => $application->administrative_level,
                'status' => 'resubmitted',
            ]);

            return $application->fresh([
                'service',
                'customer',
                'city',
                'subcity',
                'woreda',
                'data',
                'files',
                'histories.actor',
                'queue',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Application resubmitted successfully',
            'data' => $application,
        ]);
    }

    protected function applyCustomerOwnership(Builder $query, $user): void
    {
        $customerId = (int) $user->id;
        $email = strtolower(trim((string) $user->email));
        $phone = $this->normalizePhone($user->phone ?? null);

        $query->where(function (Builder $ownerQuery) use ($customerId, $email, $phone) {
            $ownerQuery->where('customer_id', $customerId);

            if (Schema::hasColumn('service_applications', 'created_by')) {
                $ownerQuery->orWhere('created_by', $customerId);
            }

            if (Schema::hasColumn('service_applications', 'user_id')) {
                $ownerQuery->orWhere('user_id', $customerId);
            }

            /*
             * Important fallback:
             * Some records can be created under an earlier duplicate customer row,
             * but with the same email/phone. Tracking works because it is public,
             * but the logged-in customer list becomes 0 if we only compare IDs.
             * Match the related customer email/phone too, while still staying
             * scoped to the logged-in user's own identity.
             */
            $ownerQuery->orWhereHas('customer', function (Builder $customerQuery) use ($email, $phone) {
                $customerQuery->where(function (Builder $identityQuery) use ($email, $phone) {
                    if ($email !== '') {
                        $identityQuery->whereRaw('LOWER(email) = ?', [$email]);
                    }

                    if ($phone !== '') {
                        $identityQuery->orWhereRaw(
                            "REPLACE(REPLACE(REPLACE(COALESCE(phone, ''), '+', ''), ' ', ''), '-', '') = ?",
                            [$phone]
                        );
                    }
                });
            });

            $ownerQuery->orWhereHas('histories', function (Builder $historyQuery) use ($customerId) {
                $historyQuery->where('actor_id', $customerId)
                    ->whereIn('action', ['submitted', 'resubmitted']);
            });
        });
    }

    protected function customerOwnsApplication(ServiceApplication $application, $user): bool
    {
        $customerId = (int) $user->id;
        $email = strtolower(trim((string) $user->email));
        $phone = $this->normalizePhone($user->phone ?? null);

        if ((int) $application->customer_id === $customerId) {
            return true;
        }

        if (
            Schema::hasColumn('service_applications', 'created_by') &&
            (int) ($application->created_by ?? 0) === $customerId
        ) {
            return true;
        }

        if (
            Schema::hasColumn('service_applications', 'user_id') &&
            (int) ($application->user_id ?? 0) === $customerId
        ) {
            return true;
        }

        $application->loadMissing('customer');

        if ($application->customer) {
            $customerEmail = strtolower(trim((string) $application->customer->email));
            $customerPhone = $this->normalizePhone($application->customer->phone ?? null);

            if ($email !== '' && $customerEmail === $email) {
                return true;
            }

            if ($phone !== '' && $customerPhone === $phone) {
                return true;
            }
        }

        return $application->histories()
            ->where('actor_id', $customerId)
            ->whereIn('action', ['submitted', 'resubmitted'])
            ->exists();
    }

    protected function normalizePhone(?string $phone): string
    {
        return preg_replace('/\D+/', '', (string) $phone) ?: '';
    }

    protected function applySearch(Builder $query, Request $request): void
    {
        $search = trim((string) $request->input('search', ''));

        if ($search === '') {
            return;
        }

        $query->where(function (Builder $searchQuery) use ($search) {
            $searchQuery
                ->where('tracking_number', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%")
                ->orWhereHas('service', function (Builder $serviceQuery) use ($search) {
                    $serviceQuery->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('queue', function (Builder $queueQuery) use ($search) {
                    $queueQuery->where('queue_number', 'like', "%{$search}%");
                });
        });
    }

    protected function applyStatusFilter(Builder $query, ?string $status): void
    {
        $status = trim((string) $status);

        if ($status === '') {
            return;
        }

        $statuses = self::STATUS_GROUPS[$status] ?? [$status];

        $query->whereIn('status', $statuses);
    }

    protected function statusCounts(Builder $query): array
    {
        $statusValues = (clone $query)
            ->select('status')
            ->pluck('status')
            ->map(fn ($status) => (string) $status)
            ->values();

        $counts = [
            'total' => $statusValues->count(),
            'pending' => 0,
            'rejected' => 0,
            'approved' => 0,
            'appointed' => 0,
            'completed' => 0,
        ];

        foreach ($statusValues as $status) {
            foreach (self::STATUS_GROUPS as $group => $statuses) {
                if (in_array($status, $statuses, true) && array_key_exists($group, $counts)) {
                    $counts[$group]++;
                    break;
                }
            }
        }

        return $counts;
    }
}
