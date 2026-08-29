<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('service_form_steps', function(Blueprint $table){
   $table->id();
   $table->foreignId('service_form_id')->constrained('service_forms')->cascadeOnDelete();
   $table->string('title');
   $table->integer('step_order')->default(1);
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('service_form_steps'); }
};
