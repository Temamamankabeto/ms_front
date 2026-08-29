<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $this->query($request)
            ->latest('created_at')
            ->limit((int) $request->integer('limit', 20))
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
            'meta' => ['total' => $notifications->count()],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->query($request)->whereNull('read_at')->count();

        return response()->json([
            'success' => true,
            'message' => 'Unread notifications count retrieved successfully',
            'data' => ['count' => $count],
        ]);
    }

    public function markRead(Request $request, string|int $id): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['success' => true, 'message' => 'Notification marked as read', 'data' => null]);
        }

        $this->query($request)->where('id', $id)->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Notification marked as read', 'data' => null]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        if (Schema::hasTable('notifications')) {
            $this->query($request)->whereNull('read_at')->update(['read_at' => now(), 'updated_at' => now()]);
        }

        return response()->json(['success' => true, 'message' => 'All notifications marked as read', 'data' => null]);
    }

    protected function query(Request $request)
    {
        if (! Schema::hasTable('notifications')) {
            return DB::table(DB::raw('(select 1 as id, null as read_at, null as created_at, null as updated_at) as empty_notifications'))->whereRaw('1 = 0');
        }

        $query = DB::table('notifications');
        $user = $request->user();

        if ($user && Schema::hasColumn('notifications', 'notifiable_id')) {
            $query->where('notifiable_id', $user->id);
        } elseif ($user && Schema::hasColumn('notifications', 'user_id')) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }
}
