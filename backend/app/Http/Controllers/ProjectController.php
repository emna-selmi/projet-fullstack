<?php

/*
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    
    public function index()
{
    $projects = Project::with('tasks')->get();

    $projects->transform(function ($project) {
        $total = $project->tasks->count();
        
        $completed = $project->tasks->filter(function($t) {
            // Nettoyage rigoureux des caractères et accents
            $s = str_replace(['é', 'è', 'ê'], 'e', strtolower(trim($t->etat ?? '')));
            return in_array($s, ['termine', 'done', 'complete']);
        })->count();
        
        // On attache manuellement la valeur pour qu'elle soit sérialisée en JSON
        $project->completion_rate = $total > 0 ? (int)round(($completed / $total) * 100) : 0;
        
        return $project;
    });

    return response()->json($projects);
}

   
    public function store(Request $request)
    {
        $request->validate([
            'nom_projet' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = auth()->user();

        $project = Project::create([
            'nom_projet' => $request->nom_projet,
            'description' => $request->description,
            'id_user_createur' => $user->id_user,
        ]);

        // Le créateur devient Chef de projet
        $project->members()->attach($user->id_user, [
            'role_projet' => 'Chef de projet'
        ]);

        return response()->json($project, 201);
    }

    
    public function addMember(Request $request, $id)
{
    try {
        // 1. Trouver le projet ou renvoyer une erreur 404
        $project = \App\Models\Project::findOrFail($id);

        // 2. Récupérer l'ID de l'utilisateur envoyé par Angular
        $userId = $request->input('id_user');
        $role = $request->input('role_projet', 'Développeur');

        if (!$userId) {
            return response()->json(['message' => 'ID utilisateur manquant'], 400);
        }

        // 3. Attacher l'utilisateur au projet dans la table pivot
        // syncWithoutDetaching évite les doublons si on clique deux fois
        $project->members()->syncWithoutDetaching([
            $userId => ['role_projet' => $role]
        ]);

        return response()->json([
            'message' => 'Membre ajouté avec succès !'
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur technique sur le serveur',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function getMembers($id)
{
    try {
        $project = Project::with('members')->findOrFail($id);
        return response()->json($project->members);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    
public function removeMember($id, $userId) 
{
    $project = Project::findOrFail($id);
    $project->members()->detach($userId); 
    return response()->json(['message' => 'Utilisateur retiré']);
}

    public function show($id)
    {
        return Project::with(['creator', 'members', 'tasks'])->findOrFail($id);
    }

 
    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $user = auth()->user();

        if ($user->role !== 'admin' && $user->id_user !== $project->id_user_createur) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $project->update($request->only([
            'nom_projet', 'description', 'date_debut', 'date_fin', 'status'
        ]));

        return response()->json($project);
    }

    
    public function destroy($id)
    {
        $user = auth()->user();
        if (strtolower($user->role) !== 'admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Projet supprimé']);
    }
}