<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('service_form_field_conditions', function(Blueprint $table){
   $table->id();
   $table->foreignId('field_id')->constrained('service_form_fields')->cascadeOnDelete();
   $table->foreignId('depends_on_field_id')->constrained('service_form_fields')->cascadeOnDelete();
   $table->string('operator')->default('equals');
   $table->text('expected_value');
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('service_form_field_conditions'); }
};
