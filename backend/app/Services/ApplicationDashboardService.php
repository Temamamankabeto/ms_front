<?php

namespace App\Services;

use App\Models\ServiceApplication;
use App\Models\User;
use App\Support\AccessScope;

class ApplicationDashboardService
{
    public function __construct(
        protected AccessScope $scope
    ) {}

    public function stats(?User $user = null): array
    {
        $query = ServiceApplication::query();

        if ($user) {
            $this->scope->applyServiceApplicationScope($query, $user);
        }

        return [
            'total' => (clone $query)->count(),
            'submitted' => (clone $query)->where('status', 'submitted')->count(),
            'under_review' => (clone $query)->where('status', 'under_review')->count(),
            'returned' => (clone $query)->where('status', 'returned')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
        ];
    }
}
