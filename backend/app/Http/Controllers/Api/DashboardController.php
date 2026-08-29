<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function overview(Request $request)
    {
        return response()->json([
            'success' => true,
            'role' => 'mesob-overview',
            'message' => 'MESOB eService Dashboard',
            'data' => $this->summary($request),
        ]);
    }

    public function cityDashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'role' => 'super-admin',
            'message' => 'City Level Dashboard',
            'data' => $this->summary($request),
        ]);
    }

    public function subcityDashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'role' => 'subcity-admin',
            'message' => 'Subcity Level Dashboard',
            'data' => $this->summary($request, ['subcity_id' => $request->user()?->subcity_id]),
        ]);
    }

    public function woredaDashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'role' => 'woreda-admin',
            'message' => 'Woreda Level Dashboard',
            'data' => $this->summary($request, ['woreda_id' => $request->user()?->woreda_id]),
        ]);
    }

    public function officerDashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'role' => 'officer',
            'message' => 'Officer Dashboard',
            'data' => [
                'assigned_requests' => ServiceRequest::where('assigned_officer_id', $request->user()?->id)->count(),
                'pending_tasks' => ServiceRequest::where('assigned_officer_id', $request->user()?->id)->whereIn('status', ['submitted', 'under_review', 'returned'])->count(),
                'completed_tasks' => ServiceRequest::where('assigned_officer_id', $request->user()?->id)->where('status', 'completed')->count(),
            ],
        ]);
    }

    public function customerDashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'role' => 'customer',
            'message' => 'Customer Dashboard',
            'data' => [
                'my_applications' => ServiceRequest::where('customer_id', $request->user()?->id)->count(),
                'pending_requests' => ServiceRequest::where('customer_id', $request->user()?->id)->whereIn('status', ['draft', 'submitted', 'under_review'])->count(),
                'approved_services' => ServiceRequest::where('customer_id', $request->user()?->id)->whereIn('status', ['approved', 'completed'])->count(),
                'returned_applications' => ServiceRequest::where('customer_id', $request->user()?->id)->where('status', 'returned')->count(),
            ],
        ]);
    }

    protected function summary(Request $request, array $scope = []): array
    {
        $users = User::query();
        $customers = Customer::query();
        $requests = ServiceRequest::query();

        foreach ($scope as $field => $value) {
            if ($value) {
                $users->where($field, $value);
                $customers->where($field, $value);
                $requests->where($field, $value);
            }
        }

        return [
            'total_users' => $users->count(),
            'total_customers' => $customers->count(),
            'active_users' => (clone $users)->where('status', 'active')->count(),
            'suspended_users' => (clone $users)->where('status', 'suspended')->count(),
            'total_requests' => $requests->count(),
            'pending_requests' => (clone $requests)->whereIn('status', ['draft', 'submitted', 'under_review', 'returned'])->count(),
            'completed_requests' => (clone $requests)->where('status', 'completed')->count(),
        ];
    }
}
