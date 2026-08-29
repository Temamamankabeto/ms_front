<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PublicReportController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $serviceTable = 'services';
        $applicationTable = 'service_applications';

        $statusCounts = $this->statusCounts($applicationTable);

        return response()->json([
            'success' => true,
            'message' => 'Public report dashboard loaded successfully.',
            'data' => [
                'summary' => [
                    'total_services' => $this->safeCount($serviceTable),
                    'active_services' => $this->safeCount($serviceTable, 'status', 'active'),
                    'total_applications' => $this->safeCount($applicationTable),
                    'approved_applications' => $statusCounts['approved'] ?? 0,
                    'completed_applications' => $statusCounts['completed'] ?? 0,
                    'pending_applications' => $this->pendingApplications($statusCounts),
                    'rejected_applications' => $statusCounts['rejected'] ?? 0,
                    'total_cities' => $this->safeCount('cities'),
                    'total_subcities' => $this->safeCount('subcities'),
                    'total_woredas' => $this->safeCount('woredas'),
                    'total_revenue' => $this->totalRevenue(),
                ],
                'applications_by_status' => $statusCounts,
                'applications_by_service' => $this->applicationsByService(),
                'applications_by_subcity' => $this->applicationsByLocation('subcities', 'subcity_id'),
                'applications_by_woreda' => $this->applicationsByLocation('woredas', 'woreda_id'),
            ],
            'meta' => null,
        ]);
    }

    private function safeCount(string $table, ?string $column = null, mixed $value = null): int
    {
        if (! Schema::hasTable($table)) {
            return 0;
        }

        $query = DB::table($table);

        if ($column && Schema::hasColumn($table, $column)) {
            $query->where($column, $value);
        }

        return (int) $query->count();
    }

    private function statusCounts(string $table): array
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'status')) {
            return [];
        }

        return DB::table($table)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($total) => (int) $total)
            ->toArray();
    }

    private function pendingApplications(array $statusCounts): int
    {
        $pendingStatuses = [
            'draft',
            'submitted',
            'under_review',
            'returned',
            'pending',
            'waiting_payment',
            'payment_pending',
        ];

        return array_reduce(
            $pendingStatuses,
            fn (int $total, string $status) => $total + (int) ($statusCounts[$status] ?? 0),
            0
        );
    }

    private function applicationsByService(): array
    {
        if (! Schema::hasTable('service_applications') || ! Schema::hasTable('services')) {
            return [];
        }

        return DB::table('service_applications')
            ->join('services', 'services.id', '=', 'service_applications.service_id')
            ->select('services.name', DB::raw('COUNT(service_applications.id) as total'))
            ->groupBy('services.id', 'services.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'total' => (int) $row->total,
            ])
            ->toArray();
    }

    private function applicationsByLocation(string $locationTable, string $foreignKey): array
    {
        if (! Schema::hasTable('service_applications') || ! Schema::hasTable($locationTable)) {
            return [];
        }

        if (! Schema::hasColumn('service_applications', $foreignKey)) {
            return [];
        }

        return DB::table('service_applications')
            ->join($locationTable, $locationTable . '.id', '=', 'service_applications.' . $foreignKey)
            ->select($locationTable . '.name', DB::raw('COUNT(service_applications.id) as total'))
            ->groupBy($locationTable . '.id', $locationTable . '.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'total' => (int) $row->total,
            ])
            ->toArray();
    }

    private function totalRevenue(): float
    {
        if (! Schema::hasTable('payments')) {
            return 0;
        }

        $amountColumn = collect(['amount', 'total_amount', 'paid_amount'])
            ->first(fn ($column) => Schema::hasColumn('payments', $column));

        if (! $amountColumn) {
            return 0;
        }

        $query = DB::table('payments');

        $statusColumn = collect(['status', 'payment_status'])
            ->first(fn ($column) => Schema::hasColumn('payments', $column));

        if ($statusColumn) {
            $query->whereIn($statusColumn, ['paid', 'completed', 'verified', 'success']);
        }

        return (float) $query->sum($amountColumn);
    }
}
