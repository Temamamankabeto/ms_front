<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\ServiceApplication;
use App\Models\ServiceApplicationAppointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customerId = (int) $request->user()->id;

        $appointments = ServiceApplicationAppointment::query()
            ->with(['application.service'])
            ->whereHas('application', function ($query) use ($customerId) {
                $query->where('customer_id', $customerId);
            })
            ->whereIn('status', ['scheduled', 'pending', 'rescheduled'])
            ->latest('appointment_at')
            ->limit(10)
            ->get()
            ->map(function (ServiceApplicationAppointment $appointment) {
                $application = $appointment->application;

                return [
                    'id' => 'appointment-' . $appointment->id,
                    'type' => 'appointment',
                    'title' => 'Appointment scheduled',
                    'message' => trim(($appointment->message ?: 'You have an appointment for your service application.') . ' ' . ($appointment->location ? 'Location: ' . $appointment->location : '')),
                    'application_id' => $application?->id,
                    'tracking_number' => $application?->tracking_number,
                    'service_name' => $application?->service?->name,
                    'date' => optional($appointment->appointment_at)->toDateTimeString(),
                    'status' => $appointment->status,
                    'href' => '/dashboard/my-applications/' . $application?->id,
                ];
            })
            ->filter(fn ($item) => ! empty($item['application_id']))
            ->values();

        $payments = $this->paymentNotifications($customerId);

        $notifications = $appointments
            ->merge($payments)
            ->sortByDesc(fn ($item) => $item['date'] ?? '')
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Customer notifications retrieved successfully',
            'data' => [
                'unread_count' => $notifications->count(),
                'appointment_count' => $appointments->count(),
                'payment_count' => $payments->count(),
                'notifications' => $notifications,
            ],
        ]);
    }

    private function paymentNotifications(int $customerId)
    {
        if (! Schema::hasTable('payments')) {
            return collect();
        }

        $columns = Schema::getColumnListing('payments');
        $applicationColumn = collect(['service_application_id', 'application_id'])->first(fn ($column) => in_array($column, $columns, true));

        if (! $applicationColumn) {
            return collect();
        }

        $statusColumn = in_array('status', $columns, true) ? 'status' : null;
        $amountColumn = collect(['amount', 'total_amount', 'paid_amount'])->first(fn ($column) => in_array($column, $columns, true));
        $dateColumn = collect(['created_at', 'updated_at'])->first(fn ($column) => in_array($column, $columns, true)) ?? 'id';

        $rows = DB::table('payments')
            ->join('service_applications', 'service_applications.id', '=', 'payments.' . $applicationColumn)
            ->leftJoin('services', 'services.id', '=', 'service_applications.service_id')
            ->where('service_applications.customer_id', $customerId)
            ->when($statusColumn, function ($query) use ($statusColumn) {
                $query->whereIn('payments.' . $statusColumn, ['pending', 'unpaid', 'waiting', 'requested']);
            })
            ->orderByDesc('payments.' . $dateColumn)
            ->limit(10)
            ->get([
                'payments.id as payment_id',
                'service_applications.id as application_id',
                'service_applications.tracking_number',
                'services.name as service_name',
                DB::raw($statusColumn ? 'payments.' . $statusColumn . ' as payment_status' : "'pending' as payment_status"),
                DB::raw($amountColumn ? 'payments.' . $amountColumn . ' as payment_amount' : 'NULL as payment_amount'),
                DB::raw(in_array('created_at', $columns, true) ? 'payments.created_at as payment_date' : 'NULL as payment_date'),
            ]);

        return $rows->map(function ($payment) {
            $amount = $payment->payment_amount ? ' Amount: ' . $payment->payment_amount . '.' : '';

            return [
                'id' => 'payment-' . $payment->payment_id,
                'type' => 'payment',
                'title' => 'Payment pending',
                'message' => 'Your service payment is pending.' . $amount,
                'application_id' => (int) $payment->application_id,
                'tracking_number' => $payment->tracking_number,
                'service_name' => $payment->service_name,
                'date' => $payment->payment_date,
                'status' => $payment->payment_status,
                'href' => '/dashboard/my-applications/' . $payment->application_id,
            ];
        });
    }
}
