<?php

namespace App\Services;

use App\Models\ServiceApplication;
use App\Models\ServiceApplicationHistory;
use App\Support\AccessScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceApplicationService
{
    public function __construct(
        protected AccessScope $scope
    ) {}

    public function list(Request $request)
    {
        $query = ServiceApplication::with([
            'service',
            'customer',
            'currentWindow',
            'currentOfficer',
        ]);

        if ($request->user()) {
            $this->scope->applyServiceApplicationScope($query, $request->user());
        }

        foreach (['status', 'priority', 'service_id', 'customer_id', 'current_window_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('tracking_number')) {
            $query->where('tracking_number', 'like', '%' . $request->input('tracking_number') . '%');
        }

        if ($request->filled('submitted_from')) {
            $query->whereDate('submitted_at', '>=', $request->input('submitted_from'));
        }

        if ($request->filled('submitted_to')) {
            $query->whereDate('submitted_at', '<=', $request->input('submitted_to'));
        }

        return $query->latest()->paginate(min((int) $request->input('per_page', 20), 100));
    }

    public function show(ServiceApplication $application): ServiceApplication
    {
        return $application->load([
            'service',
            'customer',
            'currentWindow',
            'currentOfficer',
            'assignee',
            'data',
            'files.uploader',
            'files.verifier',
            'workflows.window',
            'workflows.officer',
            'workflows.actor',
            'histories.actor',
        ]);
    }

    public function update(ServiceApplication $application, array $data, ?int $actorId = null): ServiceApplication
    {
        return DB::transaction(function () use ($application, $data, $actorId) {
            $oldStatus = $application->status;

            $application->update($data);

            if (array_key_exists('status', $data) && $data['status'] !== $oldStatus) {
                ServiceApplicationHistory::create([
                    'application_id' => $application->id,
                    'from_status' => $oldStatus,
                    'to_status' => $data['status'],
                    'action' => 'status_updated',
                    'action_type' => 'admin_update',
                    'remark' => $data['remark'] ?? null,
                    'actor_id' => $actorId,
                ]);
            }

            return $this->show($application->fresh());
        });
    }

    public function delete(ServiceApplication $application): bool
    {
        return (bool) $application->delete();
    }
}
