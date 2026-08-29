<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $this->ensureCityAdmin($user);

        $query = Announcement::query()
            ->with(['city:id,name', 'creator:id,name'])
            ->when($request->filled('search'), function ($builder) use ($request) {
                $term = trim((string) $request->string('search'));
                $builder->where(function ($q) use ($term) {
                    $q->where('title', 'ilike', "%{$term}%")
                      ->orWhere('description', 'ilike', "%{$term}%");
                });
            })
            ->when(! $this->isSuperAdmin($user), fn ($builder) => $builder->where('city_id', $user->city_id))
            ->latest();

        $items = $query->paginate(min(max((int) $request->integer('per_page', 15), 1), 100));

        return response()->json([
            'success' => true,
            'message' => 'News retrieved successfully',
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $this->ensureCityAdmin($user);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $news = Announcement::create([
            ...$data,
            'city_id' => $user->city_id,
            'created_by' => $user->id,
            'status' => $data['status'] ?? 'active',
        ])->load(['city:id,name', 'creator:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'News created successfully',
            'data' => $news,
        ], 201);
    }

    public function show(Request $request, Announcement $news)
    {
        $this->ensureCanManageNews($request->user(), $news);

        return response()->json([
            'success' => true,
            'message' => 'News retrieved successfully',
            'data' => $news->load(['city:id,name', 'creator:id,name']),
        ]);
    }

    public function update(Request $request, Announcement $news)
    {
        $this->ensureCanManageNews($request->user(), $news);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'status' => ['sometimes', 'required', 'in:active,inactive'],
        ]);

        $news->update($data);

        return response()->json([
            'success' => true,
            'message' => 'News updated successfully',
            'data' => $news->fresh()->load(['city:id,name', 'creator:id,name']),
        ]);
    }

    public function destroy(Request $request, Announcement $news)
    {
        $this->ensureCanManageNews($request->user(), $news);
        $news->delete();

        return response()->json([
            'success' => true,
            'message' => 'News deleted successfully',
            'data' => null,
        ]);
    }

    private function ensureCanManageNews($user, Announcement $news): void
    {
        $this->ensureCityAdmin($user);

        abort_unless($this->isSuperAdmin($user) || (int) $news->city_id === (int) $user->city_id, 403, 'You can manage news only for your city.');
    }

    private function ensureCityAdmin($user): void
    {
        $roles = method_exists($user, 'getRoleNames')
            ? $user->getRoleNames()->map(fn ($role) => Str::of($role)->lower()->replace(['-', ' '], '_')->toString())->all()
            : [Str::of((string) $user->role)->lower()->replace(['-', ' '], '_')->toString()];

        $isCityAdmin = in_array('admin', $roles, true)
            && ! empty($user->city_id)
            && empty($user->subcity_id)
            && empty($user->woreda_id);

        abort_unless($this->isSuperAdmin($user) || $isCityAdmin, 403, 'Only city-level administrators can manage news.');
    }

    private function isSuperAdmin($user): bool
    {
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('super_admin') || $user->hasRole('super-admin');
        }

        return in_array(Str::of((string) $user->role)->lower()->replace(['-', ' '], '_')->toString(), ['super_admin'], true);
    }
}
