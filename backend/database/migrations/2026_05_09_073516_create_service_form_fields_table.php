<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_form_fields', function (Blueprint $table) {

            $table->id();

            $table->foreignId('service_form_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('label');
            $table->string('description')->nullable();
            $table->string('name');

            $table->enum('type', [

                'text',
                'textarea',
                'number',
                'email',
                'tel',
                'date',
                'select',
                'radio',
                'checkbox',
                'file',
                'image',
                

            ]);

            $table->json('options')
                ->nullable();

            $table->string('placeholder')
                ->nullable();

            $table->string('validation_rules')
                ->nullable();

            $table->boolean('is_required')
                ->default(false);

            $table->integer('sort_order')
                ->default(1);

            $table->string('width')
                ->default('full');
                  $table->boolean('is_searchable')->default(false);

            $table->timestamps();
        });
       
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'service_form_fields'
        );
    }
};