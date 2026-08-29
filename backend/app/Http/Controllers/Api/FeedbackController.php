<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FeedbackResource;
use App\Models\Feedback;
use App\Models\Service;
use App\Models\Window;
use App\Support\AccessScope;
use App\Support\AppRoles;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeedbackController extends Controller
{
    public function __construct(
        protected AccessScope $scope
    ) {}


    /**
     * Display feedback list, scoped to the authenticated agent's
     * city / subcity / woreda. A super_admin sees everything; a
     * city/subcity/woreda-level agent only sees feedback left at a
     * window inside their own jurisdiction.
     */
    public function index(Request $request)
    {

        $feedbacks = Feedback::with([
            'service.windows',
            'window',
            'city',
            'subcity',
            'woreda',
        ])

            ->when(
                $request->user(),
                function ($query) use ($request) {

                    $this->scope->applyFeedbackScope(
                        $query,
                        $request->user()
                    );

                }
            )


            ->when(
                $request->service_id,
                function ($query) use ($request) {

                    $query->where(
                        'service_id',
                        $request->service_id
                    );

                }
            )


            ->when(
                $request->window_id,
                function ($query) use ($request) {

                    $query->where(
                        'window_id',
                        $request->window_id
                    );

                }
            )


            ->when(
                $request->city_id,
                function ($query) use ($request) {

                    $query->where('city_id', $request->city_id);

                }
            )


            ->when(
                $request->subcity_id,
                function ($query) use ($request) {

                    $query->where('subcity_id', $request->subcity_id);

                }
            )


            ->when(
                $request->woreda_id,
                function ($query) use ($request) {

                    $query->where('woreda_id', $request->woreda_id);

                }
            )


            ->when(
                $request->rating,
                function ($query) use ($request) {

                    $query->where(
                        'overall_rating',
                        $request->rating
                    );

                }
            )


            ->when(
                $request->satisfaction,
                function ($query) use ($request) {

                    $query->where(
                        'satisfaction',
                        $request->satisfaction
                    );

                }
            )


            ->when(
                $request->date,
                function ($query) use ($request) {

                    $query->whereDate(
                        'created_at',
                        $request->date
                    );

                }
            )


            ->latest()
            ->paginate(20);



        return FeedbackResource::collection(
            $feedbacks
        );

    }






    /**
     * Windows available to the authenticated feedback officer (or any
     * scoped agent), limited to their own jurisdiction — cascading the
     * same way feedback itself does: a city-level agent sees every
     * window in their city (including its subcities/woredas), a
     * subcity-level agent sees their subcity plus every woreda window
     * under it, and a woreda-level agent sees only their own woreda's
     * window. A super_admin sees every window system-wide. Each window
     * comes back with its active services already attached so the
     * frontend does not need a second request per window.
     */
    public function windows(Request $request)
    {
        $actor = $request->user();

        $windowsQuery = Window::query()
            ->whereHas('services', function ($query) {
                $query->where('services.status', 'active');
            });

        if (! $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            $windowsQuery = $this->applyWindowLocationScope(
                $windowsQuery,
                $actor
            );
        }

        $windows = $windowsQuery
            ->with([
                'services' => function ($query) {
                    $query->where('services.status', 'active');
                },
            ])
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'title',
                'city_title',
                'subcity_title',
                'woreda_title',
                'administrative_level',
                'city_id',
                'subcity_id',
                'woreda_id',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Windows retrieved successfully',
            'data' => $windows,
        ]);
    }



    /**
     * Scope a Window query to the actor's own city / subcity / woreda.
     *
     * Unlike Feedback (where city_id/subcity_id/woreda_id are always
     * filled in at submission time), existing Window rows may have
     * these columns left empty — the admin "create window" form does
     * not require them. Treating a NULL location column as "not yet
     * assigned to a specific location" (visible to everyone at that
     * level) avoids a window silently disappearing for every officer
     * the moment this scoping ships, while still fully isolating
     * windows that *do* have a location set. Once every window has
     * its location filled in via the admin Windows page, the NULL
     * branches below simply stop matching anything.
     */
    private function applyWindowLocationScope(\Illuminate\Database\Eloquent\Builder $query, $actor): \Illuminate\Database\Eloquent\Builder
    {

        $level = AppRoles::userLevel($actor);

        if (! $level) {
            // Unscoped, non-super-admin roles see nothing here.
            return $query->whereRaw('1 = 0');
        }

        if ($level === AppRoles::LEVEL_CITY && $actor->city_id) {
            return $query->where(function ($q) use ($actor) {
                $q->whereNull('city_id')
                    ->orWhere('city_id', $actor->city_id);
            });
        }

        if ($level === AppRoles::LEVEL_SUBCITY && $actor->subcity_id) {
            return $query->where(function ($q) use ($actor) {
                $q->whereNull('subcity_id')
                    ->orWhere(function ($q2) use ($actor) {
                        $q2->where('city_id', $actor->city_id)
                            ->where('subcity_id', $actor->subcity_id);
                    });
            });
        }

        if ($level === AppRoles::LEVEL_WOREDA && $actor->woreda_id) {
            return $query->where(function ($q) use ($actor) {
                $q->whereNull('woreda_id')
                    ->orWhere(function ($q2) use ($actor) {
                        $q2->where('city_id', $actor->city_id)
                            ->where('subcity_id', $actor->subcity_id)
                            ->where('woreda_id', $actor->woreda_id);
                    });
            });
        }

        return $query;

    }




    /**
     * Store public feedback
     */
    public function store(Request $request)
    {

        $validated = $request->validate([

            'service_id' => [
                'required',
                'exists:services,id'
            ],


            'window_id' => [
                'nullable',
                'exists:windows,id'
            ],


            'overall_rating' => [
                'required',
                'integer',
                'between:1,5'
            ],


            'staff_behavior' => [
                'nullable',
                'integer',
                'between:1,5'
            ],


            'waiting_time' => [
                'nullable',
                'integer',
                'between:1,5'
            ],


            'service_quality' => [
                'nullable',
                'integer',
                'between:1,5'
            ],


            'cleanliness' => [
                'nullable',
                'integer',
                'between:1,5'
            ],


            'satisfaction' => [
                'required',
                Rule::in([
                    'highly_satisfied',
                    'satisfied',
                    'not_satisfied'
                ])
            ],


            'comment' => [
                'nullable',
                'string',
                'max:1000'
            ],


            'gender' => [
                'nullable',
                Rule::in([
                    'male',
                    'female'
                ])
            ],


            'age' => [
                'nullable',
                'integer',
                'between:1,120'
            ]

        ]);





        /*
        |--------------------------------------------------------------------------
        | Check Active Service
        |--------------------------------------------------------------------------
        */


        $service = Service::where(
            'id',
            $validated['service_id']
        )

            ->where(
                'status',
                'active'
            )

            ->firstOrFail();







        /*
        |--------------------------------------------------------------------------
        | Resolve Location
        |--------------------------------------------------------------------------
        | If a feedback officer (or any logged-in staff) is submitting this,
        | the feedback belongs to their own city/subcity/woreda. Otherwise
        | (anonymous kiosk customer) it's copied from the selected window.
        */


        $actor = $request->user();

        if ($actor) {

            $cityId = $actor->city_id;
            $subcityId = $actor->subcity_id;
            $woredaId = $actor->woreda_id;

        } elseif (! empty($validated['window_id'])) {

            $window = \App\Models\Window::find($validated['window_id']);

            $cityId = $window?->city_id;
            $subcityId = $window?->subcity_id;
            $woredaId = $window?->woreda_id;

        } else {

            $cityId = null;
            $subcityId = null;
            $woredaId = null;

        }




        /*
        |--------------------------------------------------------------------------
        | Create Feedback
        |--------------------------------------------------------------------------
        */


        $feedback = Feedback::create([


            'service_id' => $service->id,


            'window_id'
            => $validated['window_id'] ?? null,


            'city_id'
            => $cityId,


            'subcity_id'
            => $subcityId,


            'woreda_id'
            => $woredaId,


            'overall_rating'
            => $validated['overall_rating'],


            'staff_behavior'
            => $validated['staff_behavior'] ?? null,


            'waiting_time'
            => $validated['waiting_time'] ?? null,


            'service_quality'
            => $validated['service_quality'] ?? null,


            'cleanliness'
            => $validated['cleanliness'] ?? null,


            'age'
            => $validated['age'] ?? null,


            'satisfaction'
            => $validated['satisfaction'],


            'comment'
            => $validated['comment'] ?? null,


            'gender'
            => $validated['gender'] ?? null,



            'ip_address'
            => $request->ip(),


            'user_agent'
            => $request->userAgent(),


            'device'
            => $this->detectDevice(
                $request->userAgent()
            ),

        ]);
        return (new FeedbackResource(

            $feedback->load([
                'service.windows',
                'window',
                'city',
                'subcity',
                'woreda',
            ])

        ))

            ->additional([

                'success' => true,

                'message' =>
                    'Thank you for your feedback.'

            ])

            ->response()

            ->setStatusCode(201);

    }







    /**
     * Display single feedback
     */
    public function show(Request $request, Feedback $feedback)
    {

        if ($request->user()) {
            $this->authorizeFeedbackAccess($request->user(), $feedback);
        }

        return new FeedbackResource(

            $feedback->load([
                'service.windows',
                'window',
                'city',
                'subcity',
                'woreda',
            ])

        );

    }








    /**
     * Update feedback (e.g. correcting satisfaction/comment).
     */
    public function update(Request $request, Feedback $feedback)
    {

        if ($request->user()) {
            $this->authorizeFeedbackAccess($request->user(), $feedback);
        }

        $validated = $request->validate([

            'satisfaction' => [
                'sometimes',
                Rule::in([
                    'highly_satisfied',
                    'satisfied',
                    'not_satisfied'
                ])
            ],

            'comment' => [
                'nullable',
                'string',
                'max:1000'
            ],

        ]);

        $feedback->update($validated);

        return new FeedbackResource(

            $feedback->fresh()->load([
                'service.windows',
                'window',
                'city',
                'subcity',
                'woreda',
            ])

        );

    }



    /**
     * Delete feedback
     */
    public function destroy(Request $request, Feedback $feedback)
    {

        if ($request->user()) {
            $this->authorizeFeedbackAccess($request->user(), $feedback);
        }

        $feedback->delete();


        return response()->json([

            'success'=>true,

            'message'=>
                'Feedback deleted successfully.'

        ]);

    }



    /**
     * Abort with 403 if the feedback's window falls outside the
     * actor's city / subcity / woreda jurisdiction.
     */
    private function authorizeFeedbackAccess($actor, Feedback $feedback): void
    {

        $allowed = Feedback::whereKey($feedback->id)
            ->when(
                true,
                fn ($query) => $this->scope->applyFeedbackScope($query, $actor)
            )
            ->exists();

        abort_unless($allowed, 403, 'You do not have access to this feedback.');

    }








    /**
     * Detect device
     */
    private function detectDevice(?string $userAgent): string
    {

        $agent = strtolower(
            $userAgent ?? ''
        );


        if(
            str_contains($agent,'android')
            ||
            str_contains($agent,'iphone')
            ||
            str_contains($agent,'mobile')
        ){

            return 'mobile';

        }



        if(
            str_contains($agent,'ipad')
            ||
            str_contains($agent,'tablet')
        ){
            return 'tablet';
        }
        return 'desktop';
    }

}
