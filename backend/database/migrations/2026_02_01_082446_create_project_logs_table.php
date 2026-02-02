<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('project_logs', function (Blueprint $table) {
        $table->id(); 
        $table->unsignedBigInteger('project_id');
        $table->unsignedBigInteger('user_id');
        $table->string('action'); 
        $table->string('target'); 
        $table->timestamps();

        // On lie project_id à id_project dans la table projects
        $table->foreign('project_id')->references('id_project')->on('projects')->onDelete('cascade');
        
        // On lie user_id à id_user dans la table users
        $table->foreign('user_id')->references('id_user')->on('users')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_logs');
    }
};
