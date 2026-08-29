<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class AccessScope
{
    public function applyUserScope(Builder $query, User $actor): Builder
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        if ($actor->hasRole(AppRoles::CUSTOMER)) {
            return $query->where('id', $actor->id);
        }

        return $this->applyLocationColumns($query, $actor);
    }

    public function applyServiceApplicationScope(Builder $query, User $actor): Builder
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        if ($actor->hasRole(AppRoles::CUSTOMER)) {
            return $query->where('customer_id', $actor->id);
        }

        return $this->applyApplicationLocationColumns($query, $actor);
    }

    public function applyApplicationScope(Builder $query, User $actor): Builder
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        if ($actor->hasRole(AppRoles::CUSTOMER)) {
            return $query->where('customer_id', $actor->id);
        }

        return $this->applyApplicationLocationColumns($query, $actor);
    }

    /**
     * Scope feedback to the agent's own city / subcity / woreda, using the
     * columns stored directly on the feedback row (populated at submission
     * time from the submitting agent, or from the window for anonymous
     * kiosk submissions).
     */
    public function applyFeedbackScope(Builder $query, User $actor): Builder
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        $level = AppRoles::userLevel($actor);

        if (!$level) {
            // Unscoped, non-super-admin roles (e.g. customer) see nothing here.
            return $query->whereRaw('1 = 0');
        }

        return $this->applyLocationColumns($query, $actor);
    }

    /**
     * Scope windows (and, by extension, the services attached to them) to
     * the actor's own city / subcity / woreda — mirroring applyFeedbackScope
     * but against the windows table's own location columns instead of the
     * denormalized ones on feedback rows.
     *
     * - City-level actor: only windows that belong to their city AND are
     *   offered at the city level.
     * - Subcity-level actor: windows that belong to their subcity AND are
     *   offered at the subcity level, PLUS woreda-level windows for any
     *   woreda under that same subcity (so a subcity feedback officer sees
     *   their own subcity window and every woreda window beneath it).
     * - Woreda-level actor: only the woreda-level window(s) for their exact
     *   woreda.
     */
    public function applyWindowScope(Builder $query, User $actor): Builder
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return $query;
        }

        $level = AppRoles::userLevel($actor);

        if (!$level) {
            return $query->whereRaw('1 = 0');
        }

        if ($level === AppRoles::LEVEL_CITY && $actor->city_id) {
            return $query
                ->where('city_id', $actor->city_id)
                ->where(fn (Builder $q) => $this->matchesLevel($q, AppRoles::LEVEL_CITY));
        }

        if ($level === AppRoles::LEVEL_SUBCITY && $actor->subcity_id) {
            return $query
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->where(function (Builder $q) {
                    $this->matchesLevel($q, AppRoles::LEVEL_SUBCITY);
                    $q->orWhere(fn (Builder $qq) => $this->matchesLevel($qq, AppRoles::LEVEL_WOREDA));
                });
        }

        if ($level === AppRoles::LEVEL_WOREDA && $actor->woreda_id) {
            return $query
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->where('woreda_id', $actor->woreda_id)
                ->where(fn (Builder $q) => $this->matchesLevel($q, AppRoles::LEVEL_WOREDA));
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * A window "belongs" to a level either via the new single
     * administrative_level column or the legacy availability JSON
     * (plain array, or {levels:[...]} shape).
     */
    protected function matchesLevel(Builder $query, string $level): Builder
    {
        return $query
            ->where('administrative_level', $level)
            ->orWhereJsonContains('availability->levels', $level)
            ->orWhereJsonContains('availability', $level);
    }

    public function applyLocationColumns(Builder $query, User $actor): Builder
    {
        $level = AppRoles::userLevel($actor);

        if ($level === AppRoles::LEVEL_CITY && $actor->city_id) {
            return $query->where('city_id', $actor->city_id);
        }

        if ($level === AppRoles::LEVEL_SUBCITY && $actor->subcity_id) {
            return $query
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id);
        }

        if ($level === AppRoles::LEVEL_WOREDA && $actor->woreda_id) {
            return $query
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->where('woreda_id', $actor->woreda_id);
        }

        return $query;
    }

    public function applyApplicationLocationColumns(Builder $query, User $actor): Builder
    {
        $level = AppRoles::userLevel($actor);

        if ($level === AppRoles::LEVEL_CITY && $actor->city_id) {
            return $query
                ->where('administrative_level', AppRoles::LEVEL_CITY)
                ->where('city_id', $actor->city_id);
        }

        if ($level === AppRoles::LEVEL_SUBCITY && $actor->subcity_id) {
            return $query
                ->where('administrative_level', AppRoles::LEVEL_SUBCITY)
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id);
        }

        if ($level === AppRoles::LEVEL_WOREDA && $actor->woreda_id) {
            return $query
                ->where('administrative_level', AppRoles::LEVEL_WOREDA)
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->where('woreda_id', $actor->woreda_id);
        }

        return $query;
    }

    public function scopeLabel(User $actor): string
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return 'System wide';
        }

        if ($actor->hasRole(AppRoles::CUSTOMER)) {
            return 'My account';
        }

        $level = AppRoles::userLevel($actor);

        return match ($level) {
            AppRoles::LEVEL_CITY => 'City level',
            AppRoles::LEVEL_SUBCITY => 'Subcity level',
            AppRoles::LEVEL_WOREDA => 'Woreda level',
            default => 'Unscoped',
        };
    }
}
