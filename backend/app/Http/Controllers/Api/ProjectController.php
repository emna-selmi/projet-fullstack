<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use App\Models\ProjectComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    /**
     * Projets où l'utilisateur est créateur ou membre
     */
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

    /**
     * Création d'un projet
     */
    public function store(Request $request)
{
    try {
        $project = \App\Models\Project::create([
            'nom_projet'         => $request->nom_projet,
            'description'        => $request->description,
            'date_fin'           => $request->date_fin,
            'id_user_createur'   => auth()->id(), // CHANGÉ ICI
        ]);

        return response()->json($project, 201);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}




    /**
     * Ajouter un membre à un projet
     */
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

    /**
     * RETIRER un membre du projet
     */
    // Dans ProjectController.php
public function removeMember($id, $userId) 
{
    $project = Project::findOrFail($id);
    $project->members()->detach($userId); 
    return response()->json(['message' => 'Utilisateur retiré']);
}


public function getComments($id)
{
    try {
        $project = \App\Models\Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Projet non trouvé'], 404);
        }

        $comments = DB::table('project_comments')
            ->join('users', 'project_comments.id_user', '=', 'users.id_user')
            ->where('project_comments.id_project', $id)
            ->select(
                'project_comments.*', 
                'users.nom as user_nom' // Cet alias doit être utilisé dans le HTML
            )
            ->orderBy('project_comments.created_at', 'desc')
            ->get();

        // On force le fuseau horaire pour éviter le décalage de 1h
        $comments->transform(function($comment) {
            // Transforme la date en objet Carbon puis en chaîne ISO pour Angular
            $comment->created_at = \Carbon\Carbon::parse($comment->created_at, 'UTC')
                ->setTimezone('Africa/Tunis') // Ajuste selon ta ville
                ->toIso8601String();
            return $comment;
        });

        return response()->json($comments);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Erreur SQL',
            'message' => $e->getMessage()
        ], 500);
    }
}

    // app/Http/Controllers/Api/ProjectController.php

public function postComment(Request $request, $id_project) 
{
    try {
        $comment = \App\Models\ProjectComment::create([
            'id_project' => $id_project,
            'id_user'    => auth()->id(), // VERIFIE LE NOM DE CETTE COLONNE EN BASE
            'contenu'    => $request->contenu
        ]);

        // ... code pour les notifications ...

        return response()->json($comment, 201);
    } catch (\Exception $e) {
        // Cela te permettra de voir l'erreur SQL directement dans Angular
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    /**
     * Détails d'un projet
     */
    public function show($id) {
    // On charge le créateur avec le projet pour qu'Angular puisse comparer les ID
    $project = Project::with('creator')->find($id);
    
    if (!$project) {
        return response()->json(['message' => 'Projet non trouvé'], 404);
    }
    
    return response()->json($project);
}

    /**
     * Liste des membres d'un projet
     */


    /**
     * Mise à jour d'un projet
     */
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



    public function getLogs($id)
{
    // On s'assure que project_id correspond bien au nom de ta colonne en DB
    $logs = \App\Models\ProjectLog::where('project_id', $id)
        ->with('user:id_user,nom') // Charge le nom de celui qui a fait l'action
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($logs);
}

    /**
     * Suppression d'un projet
     */
    public function destroy($id)
{
    $project = Project::find($id);

    if (!$project) {
        return response()->json(['message' => 'Projet non trouvé'], 404);
    }

    // On supprime les relations avant le projet
    $project->tasks()->delete(); // Supprime les tâches
    $project->members()->detach(); // Supprime les liens avec les utilisateurs (table pivot)
    
    $project->delete(); // Enfin, on supprime le projet

    return response()->json(['message' => 'Projet supprimé avec succès']);
}

// Dans ProjectController.php
public function getActivities($id)
{
    // On récupère les tâches récentes comme "activités" pour éviter de créer une nouvelle table
    return \App\Models\Task::where('id_project', $id)
        ->with('user') // Assurez-vous d'avoir la relation user() dans votre modèle Task
        ->orderBy('updated_at', 'desc')
        ->limit(10)
        ->get()
        ->map(function($task) {
            return [
                'id_user' => $task->id_user_assigne,
                'user_nom' => $task->user ? $task->user->nom : 'Système',
                'description' => "a mis à jour la tâche : " . $task->title
            ];
        });
}


}