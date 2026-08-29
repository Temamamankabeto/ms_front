<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'service' => [
                'id' => $this->service?->id,
                'name' => $this->service?->name,
            ],

            'window' => $this->window ? [
                'id' => $this->window->id,
                'name' => $this->window->name,
            ] : null,

            'city' => $this->city ? [
                'id' => $this->city->id,
                'name' => $this->city->name,
            ] : null,

            'subcity' => $this->subcity ? [
                'id' => $this->subcity->id,
                'name' => $this->subcity->name,
            ] : null,

            'woreda' => $this->woreda ? [
                'id' => $this->woreda->id,
                'name' => $this->woreda->name,
            ] : null,

            'satisfaction' => $this->satisfaction,

            'overall_rating' => $this->overall_rating,

            'staff_behavior' => $this->staff_behavior,

            'waiting_time' => $this->waiting_time,

            'service_quality' => $this->service_quality,

            'cleanliness' => $this->cleanliness,

            'comment' => $this->comment,

            'gender' => $this->gender,

            'age' => $this->age,

            'submitted_at' => $this->created_at,

        ];
    }
}
