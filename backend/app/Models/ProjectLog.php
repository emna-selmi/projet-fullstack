<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectLog extends Model
{
    // SANS CETTE LIGNE, RIEN N'EST SAUVÉ DÉFINITIVEMENT
    protected $fillable = ['project_id', 'user_id', 'action', 'target'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_user');
    }
}