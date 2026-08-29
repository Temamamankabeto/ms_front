<?php

namespace App\Services;

use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApplicationService
{
    public function list(Request $request, User $user)
    {
        $query = Application::with(['customer', 'service', 'assignee']);

        if (!$request->boolean('all')) {
            $query->where('customer_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->integer('service_id'));
        }

        if ($request->filled('application_number')) {
            $query->where('application_number', 'like', '%' . $request->input('application_number') . '%');
        }

        return $query->latest()->paginate(min((int) $request->input('per_page', 20), 100));
    }

    public function create(array $data, User $user): Application
    {
        
        return DB::transaction(function () use ($data, $user) {
            $data['application_number'] = $data['application_number'] ?? $this->generateApplicationNumber();
            $data['customer_id'] = $data['customer_id'] ?? $user->id;

            if (($data['status'] ?? 'draft') === 'submitted' && empty($data['submitted_at'])) {
                $data['submitted_at'] = now();
            }

            return Application::create($data)->load(['customer', 'service', 'assignee']);
        });
    }

    public function show(Application $application): Application
    {
        return $application->load(['customer', 'service', 'assignee']);
    }

    public function update(Application $application, array $data): Application
    {
        if (($data['status'] ?? null) === 'submitted' && !$application->submitted_at) {
            $data['submitted_at'] = now();
        }

        if (($data['status'] ?? null) === 'completed' && !$application->completed_at) {
            $data['completed_at'] = now();
        }

        $application->update($data);

        return $this->show($application->fresh());
    }

    public function delete(Application $application): bool
    {
        return (bool) $application->delete();
    }

    protected function generateApplicationNumber(): string
    {
        do {
            $number = sprintf('APP-%s-%06d', now()->format('Y'), random_int(1, 999999));
        } while (Application::where('application_number', $number)->exists());

        return $number;
    }
}
