<?php

namespace App\Services;

use App\Models\Service;
use App\Models\ServiceApplication;
use App\Models\Subcity;
use App\Models\User;
use App\Models\Window;
use App\Models\Woreda;
use App\Models\Feedback;
use App\Support\AccessScope;
use App\Support\AppRoles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportingDashboardService
{
    protected array $completedStatuses = ['approved','completed','sent_to_customer','closed_successfully','back_officer_approved','manager_resolved'];
    protected array $rejectedStatuses = ['rejected'];

    public function __construct(protected AccessScope $scope) {}

    public function dashboard(Request $request, User $user): array
    {
        abort_if($this->hasRole($user, AppRoles::CUSTOMER), 403, 'Customer dashboard uses the customer application page.');
        $query = $this->scopedApplicationQuery($user);

        return [
            'service_cards' => $this->serviceCards(clone $query),
            'feedback_cards' => $this->feedbackCards($user),
            'feedback_by_location' => $this->feedbackByLocation($request, $user),
            'feedback_by_window' => $this->feedbackReport($request, $user),
            'scope' => $this->scope($user),
        ];
    }

    public function report(Request $request, User $user): array
    {
        abort_if($this->hasRole($user, AppRoles::CUSTOMER), 403, 'Customer dashboard uses the customer application page.');
        $filters = $this->filters($request, $user);

        if (! $this->hasRequiredSelection($request)) {
            return ['summary' => $this->emptySummary(), 'report' => [], 'feedback' => [], 'feedback_by_location' => [], 'filters' => $filters, 'scope' => $this->scope($user), 'requires_filter' => true];
        }

        $filtered = $this->applyReportFilters($this->scopedApplicationQuery($user), $request);

        return [
            'summary' => $this->summary(clone $filtered),
            'report' => $this->applicationReport(clone $filtered),
            'feedback' => $this->feedbackReport($request, $user),
            'feedback_by_location' => $this->feedbackByLocation($request, $user),
            'filters' => $filters,
            'scope' => $this->scope($user),
            'requires_filter' => false,
        ];
    }

    protected function hasRequiredSelection(Request $request): bool
    {
        return $request->filled('administrative_level') || $request->filled('subcity_id') || $request->filled('woreda_id')
            || $request->filled('window_id') || $request->filled('service_id') || $request->filled('officer_id')
            || $request->filled('status') || $request->filled('time') || $request->filled('from_date') || $request->filled('to_date');
    }

    protected function scopedApplicationQuery(User $user): Builder
    {
        $query = ServiceApplication::query()->with(['service:id,name','customer:id,name','city:id,name','subcity:id,name','woreda:id,name','currentWindow:id,name','currentOfficer:id,name','assignee:id,name']);

        if ($this->hasRole($user, AppRoles::SUPER_ADMIN)) return $query;

        if ($this->hasRole($user, AppRoles::FRONT_OFFICER) || $this->hasRole($user, AppRoles::BACK_OFFICER)) {
            return $query->where(function ($q) use ($user) {
                $q->where('current_officer_id', $user->id)
                    ->orWhere('assigned_to', $user->id)
                    ->orWhereHas('histories', fn ($h) => $h->where('actor_id', $user->id)->orWhere('sender_id', $user->id)->orWhere('receiver_id', $user->id))
                    ->orWhereHas('shares', fn ($s) => $s->where('shared_from_officer_id', $user->id)->orWhere('shared_to_officer_id', $user->id));
            });
        }

        if ($this->hasRole($user, AppRoles::ADMIN) || $this->hasRole($user, AppRoles::MANAGER)) {
            $level = AppRoles::userLevel($user);
            if ($level === AppRoles::LEVEL_CITY && $user->city_id) return $query->where('city_id', $user->city_id);
            if ($level === AppRoles::LEVEL_SUBCITY && $user->subcity_id) return $query->where('city_id', $user->city_id)->where('subcity_id', $user->subcity_id);
            if ($level === AppRoles::LEVEL_WOREDA && $user->woreda_id) return $query->where('city_id', $user->city_id)->where('subcity_id', $user->subcity_id)->where('woreda_id', $user->woreda_id);
        }

        return $query->whereRaw('1 = 0');
    }

    protected function applyReportFilters(Builder $query, Request $request): Builder
    {
        return $query
            ->when($request->filled('administrative_level'), function ($q) use ($request) {
                $level = (string) $request->string('administrative_level');
                if ($level !== 'all') $q->where('administrative_level', $level);
            })
            ->when($request->filled('subcity_id'), fn ($q) => $q->where('subcity_id', $request->integer('subcity_id')))
            ->when($request->filled('woreda_id'), fn ($q) => $q->where('woreda_id', $request->integer('woreda_id')))
            ->when($request->filled('window_id'), fn ($q) => $q->where('current_window_id', $request->integer('window_id')))
            ->when($request->filled('service_id'), fn ($q) => $q->where('service_id', $request->integer('service_id')))
            ->when($request->filled('officer_id'), function ($q) use ($request) {
                $id = $request->integer('officer_id');
                $q->where(fn ($oq) => $oq->where('current_officer_id', $id)->orWhere('assigned_to', $id)
                    ->orWhereHas('histories', fn ($h) => $h->where('actor_id', $id)->orWhere('sender_id', $id)->orWhere('receiver_id', $id)));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('time'), fn ($q) => $this->applyTimeFilter($q, (string) $request->string('time'), $request))
            ->latest('submitted_at');
    }

    protected function applyTimeFilter(Builder $query, string $time, Request $request): Builder
    {
        return match ($time) {
            'today' => $query->whereDate('submitted_at', now()->toDateString()),
            'week', 'this_week' => $query->whereBetween('submitted_at', [now()->startOfWeek(), now()->endOfWeek()]),
            'month', 'this_month' => $query->whereYear('submitted_at', now()->year)->whereMonth('submitted_at', now()->month),
            'year', 'this_year' => $query->whereYear('submitted_at', now()->year),
            'custom' => $query->when($request->filled('from_date'), fn ($q) => $q->whereDate('submitted_at', '>=', $request->date('from_date')))->when($request->filled('to_date'), fn ($q) => $q->whereDate('submitted_at', '<=', $request->date('to_date'))),
            default => $query,
        };
    }

    protected function serviceCards(Builder $query): array
    {
        $all = (clone $query)->get(['id','status']);
        $completed = $all->whereIn('status', $this->completedStatuses)->count();
        $rejected = $all->whereIn('status', $this->rejectedStatuses)->count();
        return ['total_applications' => $all->count(), 'on_progress_applications' => max($all->count() - $completed - $rejected, 0), 'completed_applications' => $completed];
    }

    protected function feedbackCards(User $user): array
    {
        $query = $this->scope->applyFeedbackScope(Feedback::query(), $user);

        return [
            'highly_satisfied' => (clone $query)->where('satisfaction', 'highly_satisfied')->count(),
            'satisfied' => (clone $query)->where('satisfaction', 'satisfied')->count(),
            'dissatisfied' => (clone $query)->where('satisfaction', 'not_satisfied')->count(),
        ];
    }

    protected function emptySummary(): array { return ['total_applications' => 0, 'approved_applications' => 0, 'rejected_applications' => 0, 'in_progress_applications' => 0]; }

    protected function summary(Builder $query): array
    {
        $all = (clone $query)->get(['id','status']);
        $approved = $all->whereIn('status', $this->completedStatuses)->count();
        $rejected = $all->whereIn('status', $this->rejectedStatuses)->count();
        return ['total_applications' => $all->count(), 'approved_applications' => $approved, 'rejected_applications' => $rejected, 'in_progress_applications' => max($all->count() - $approved - $rejected, 0)];
    }

    protected function applicationReport(Builder $query): array
    {
        return $query->limit(5000)->get()->groupBy(fn ($a) => implode('|', [$a->city?->name ?: 'Unassigned City', $a->subcity?->name ?: 'Unassigned Subcity', $a->woreda?->name ?: 'Unassigned Woreda', $a->currentWindow?->name ?: 'Unassigned Window', $a->service?->name ?: 'Unassigned Service', $a->currentOfficer?->name ?: $a->assignee?->name ?: 'Unassigned Officer']))->map(function ($items) {
            $first = $items->first();
            $approvedRejected = $items->whereIn('status', array_merge($this->completedStatuses, $this->rejectedStatuses))->count();
            $total = $items->count();
            return [
                'city' => $first->city?->name ?: 'Unassigned City',
                'subcity' => $first->subcity?->name ?: 'Unassigned Subcity',
                'woreda' => $first->woreda?->name ?: 'Unassigned Woreda',
                'window' => $first->currentWindow?->name ?: 'Unassigned Window',
                'service' => $first->service?->name ?: 'Unassigned Service',
                'officer' => $first->currentOfficer?->name ?: $first->assignee?->name ?: 'Unassigned Officer',
                'total' => $total,
                'approved_rejected' => $approvedRejected,
                'on_progress' => max($total - $approvedRejected, 0),
                'percent' => $total > 0 ? round(($approvedRejected / $total) * 100, 2) : 0,
            ];
        })->sortBy(fn ($row) => implode('|', [$row['city'], $row['subcity'], $row['woreda'], $row['window']]))->values()->all();
    }

    protected function feedbackReport(Request $request, User $user): array
    {
        $query = $this->scope->applyFeedbackScope(
            Feedback::query()->with([
                'service:id,name',
                'window:id,name',
                'city:id,name',
                'subcity:id,name',
                'woreda:id,name',
            ]),
            $user
        );

        $query
            ->when($request->filled('subcity_id'), fn ($q) => $q->where('subcity_id', $request->integer('subcity_id')))
            ->when($request->filled('woreda_id'), fn ($q) => $q->where('woreda_id', $request->integer('woreda_id')))
            ->when($request->filled('window_id'), fn ($q) => $q->where('window_id', $request->integer('window_id')))
            ->when($request->filled('service_id'), fn ($q) => $q->where('service_id', $request->integer('service_id')))
            ->when($request->filled('time'), fn ($q) => $this->applyFeedbackTimeFilter($q, (string) $request->string('time'), $request));

        return $query->limit(5000)->get()
            ->groupBy(fn ($f) => implode('|', [
                $f->city?->name ?: 'Unassigned City',
                $f->subcity?->name ?: 'Unassigned Subcity',
                $f->woreda?->name ?: 'Unassigned Woreda',
                $f->window?->name ?: 'Unassigned Window',
                $f->service?->name ?: 'Unassigned Service',
            ]))
            ->map(function ($items) {
                $first = $items->first();
                $total = $items->count();
                $high = $items->where('satisfaction', 'highly_satisfied')->count();
                $satisfied = $items->where('satisfaction', 'satisfied')->count();
                $dissatisfied = $items->where('satisfaction', 'not_satisfied')->count();
                return [
                    'city' => $first->city?->name ?: 'Unassigned City',
                    'subcity' => $first->subcity?->name ?: 'Unassigned Subcity',
                    'woreda' => $first->woreda?->name ?: 'Unassigned Woreda',
                    'window' => $first->window?->name ?: 'Unassigned Window',
                    'service' => $first->service?->name ?: 'Unassigned Service',
                    'highly_satisfied' => $high,
                    'satisfied' => $satisfied,
                    'not_satisfied' => $dissatisfied,
                    'total' => $total,
                    'percent' => $total > 0 ? round((($high + $satisfied) / $total) * 100, 2) : 0,
                ];
            })->sortBy(fn ($row) => implode('|', [$row['city'], $row['subcity'], $row['woreda'], $row['window']]))->values()->all();
    }

    /**
     * Pure city / subcity / woreda rollup of feedback — independent of
     * window/service, so an agent can see "how is my whole city doing"
     * at a glance, not just per-window numbers.
     */
    protected function feedbackByLocation(Request $request, User $user): array
    {
        $query = $this->scope->applyFeedbackScope(
            Feedback::query()->with([
                'city:id,name',
                'subcity:id,name',
                'woreda:id,name',
            ]),
            $user
        );

        $query
            ->when($request->filled('subcity_id'), fn ($q) => $q->where('subcity_id', $request->integer('subcity_id')))
            ->when($request->filled('woreda_id'), fn ($q) => $q->where('woreda_id', $request->integer('woreda_id')))
            ->when($request->filled('time'), fn ($q) => $this->applyFeedbackTimeFilter($q, (string) $request->string('time'), $request));

        return $query->limit(5000)->get()
            ->groupBy(fn ($f) => implode('|', [
                $f->city?->name ?: 'Unassigned City',
                $f->subcity?->name ?: 'Unassigned Subcity',
                $f->woreda?->name ?: 'Unassigned Woreda',
            ]))
            ->map(function ($items) {
                $first = $items->first();
                $total = $items->count();
                $high = $items->where('satisfaction', 'highly_satisfied')->count();
                $satisfied = $items->where('satisfaction', 'satisfied')->count();
                $dissatisfied = $items->where('satisfaction', 'not_satisfied')->count();
                return [
                    'city' => $first->city?->name ?: 'Unassigned City',
                    'subcity' => $first->subcity?->name ?: 'Unassigned Subcity',
                    'woreda' => $first->woreda?->name ?: 'Unassigned Woreda',
                    'highly_satisfied' => $high,
                    'satisfied' => $satisfied,
                    'not_satisfied' => $dissatisfied,
                    'total' => $total,
                    'percent' => $total > 0 ? round((($high + $satisfied) / $total) * 100, 2) : 0,
                ];
            })->sortBy(fn ($row) => implode('|', [$row['city'], $row['subcity'], $row['woreda']]))->values()->all();
    }

    protected function applyFeedbackTimeFilter(Builder $query, string $time, Request $request): Builder
    {
        return match ($time) {
            'today' => $query->whereDate('created_at', now()->toDateString()),
            'week', 'this_week' => $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]),
            'month', 'this_month' => $query->whereYear('created_at', now()->year)->whereMonth('created_at', now()->month),
            'year', 'this_year' => $query->whereYear('created_at', now()->year),
            'custom' => $query->when($request->filled('from_date'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('from_date')))->when($request->filled('to_date'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('to_date'))),
            default => $query,
        };
    }

    protected function filters(Request $request, User $user): array
    {
        $scoped = $this->scopedApplicationQuery($user);
        $userLevel = AppRoles::userLevel($user);
        $levels = match ($userLevel) {
            AppRoles::LEVEL_SUBCITY => [['label' => 'Subcity', 'value' => AppRoles::LEVEL_SUBCITY], ['label' => 'Woreda', 'value' => AppRoles::LEVEL_WOREDA]],
            AppRoles::LEVEL_WOREDA => [['label' => 'Woreda', 'value' => AppRoles::LEVEL_WOREDA]],
            default => [['label' => 'All', 'value' => 'all'], ['label' => 'City', 'value' => AppRoles::LEVEL_CITY], ['label' => 'Subcity', 'value' => AppRoles::LEVEL_SUBCITY], ['label' => 'Woreda', 'value' => AppRoles::LEVEL_WOREDA]],
        };

        $selectedLevel = (string) $request->string('administrative_level');
        $levelScoped = (clone $scoped)->when($selectedLevel && $selectedLevel !== 'all', fn ($q) => $q->where('administrative_level', $selectedLevel));
        $subcityIds = (clone $levelScoped)->pluck('subcity_id')->filter()->unique()->values();
        $selectedSubcityId = $request->integer('subcity_id') ?: null;

        if ($userLevel === AppRoles::LEVEL_SUBCITY && $user->subcity_id) {
            $subcityIds = collect([$user->subcity_id]);
            $selectedSubcityId = $selectedSubcityId ?: $user->subcity_id;
        }

        $woredaQuery = (clone $levelScoped)->when($selectedSubcityId, fn ($q) => $q->where('subcity_id', $selectedSubcityId));
        if ($userLevel === AppRoles::LEVEL_WOREDA && $user->woreda_id) $woredaQuery->where('woreda_id', $user->woreda_id);
        $woredaIds = $woredaQuery->pluck('woreda_id')->filter()->unique()->values();

        $common = (clone $levelScoped)->when($selectedSubcityId, fn ($q) => $q->where('subcity_id', $selectedSubcityId))->when($request->filled('woreda_id'), fn ($q) => $q->where('woreda_id', $request->integer('woreda_id')));
        $windowIds = (clone $common)->pluck('current_window_id')->filter()->unique()->values();
        $selectedWindowId = $request->integer('window_id') ?: null;
        $selectedServiceId = $request->integer('service_id') ?: null;
        $serviceIds = (clone $common)->when($selectedWindowId, fn ($q) => $q->where('current_window_id', $selectedWindowId))->pluck('service_id')->filter()->unique()->values();
        $officerIds = (clone $common)->when($selectedWindowId, fn ($q) => $q->where('current_window_id', $selectedWindowId))->when($selectedServiceId, fn ($q) => $q->where('service_id', $selectedServiceId))->get(['current_officer_id','assigned_to'])->flatMap(fn ($i) => [$i->current_officer_id, $i->assigned_to])->filter()->unique()->values();

        return [
            'levels' => $levels,
            'subcities' => Subcity::query()->whereIn('id', $subcityIds)->orderBy('name')->get(['id','name']),
            'woredas' => Woreda::query()->whereIn('id', $woredaIds)->orderBy('name')->get(['id','name','subcity_id']),
            'times' => [['label' => 'All', 'value' => ''], ['label' => 'Today', 'value' => 'today'], ['label' => 'This week', 'value' => 'week'], ['label' => 'This Month', 'value' => 'month'], ['label' => 'This Year', 'value' => 'year'], ['label' => 'Custom', 'value' => 'custom']],
            'windows' => Window::query()->whereIn('id', $windowIds)->orderBy('name')->get(['id','name']),
            'services' => Service::query()->whereIn('id', $serviceIds)->orderBy('name')->get(['id','name']),
            'officers' => User::query()->whereIn('id', $officerIds)->orderBy('name')->get(['id','name']),
            'statuses' => ServiceApplication::query()->select('status')->distinct()->orderBy('status')->pluck('status')->values(),
        ];
    }

    protected function scope(User $user): array
    {
        return ['role' => $this->primaryRole($user), 'level' => AppRoles::userLevel($user), 'city_id' => $user->city_id, 'subcity_id' => $user->subcity_id, 'woreda_id' => $user->woreda_id, 'label' => $this->scopeLabel($user)];
    }

    protected function hasRole(User $user, string $role): bool
    {
        if (method_exists($user, 'hasRole') && $user->hasRole($role)) return true;
        return AppRoles::normalize($this->primaryRole($user)) === $role;
    }

    protected function primaryRole(User $user): string
    {
        if (method_exists($user, 'getRoleNames')) return (string) ($user->getRoleNames()->first() ?: $user->role ?: '');
        return (string) ($user->role ?: '');
    }

    protected function scopeLabel(User $user): string
    {
        if ($this->hasRole($user, AppRoles::SUPER_ADMIN)) return 'All city, sub-city and woreda records';
        return match (AppRoles::userLevel($user)) {
            AppRoles::LEVEL_CITY => 'Assigned city and all records under it',
            AppRoles::LEVEL_SUBCITY => 'Assigned sub-city and all woredas under it',
            AppRoles::LEVEL_WOREDA => 'Assigned woreda only',
            default => Str::headline($this->primaryRole($user)) . ' personal scope',
        };
    }
}
