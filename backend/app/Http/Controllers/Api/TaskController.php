<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use App\Models\Notification;
use App\Models\User;
use App\Models\Comment;
use App\Models\ProjectLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'id_project' => 'required|exists:projects,id_project'
        ]);

        return Task::where('id_project', $request->id_project)
            ->with(['assignee'])
            ->get();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'etat'        => 'required|in:Nouveau,En cours,En attente,Terminé',
            'priorite'    => 'required|in:Basse,Moyenne,Haute',
            'id_project'  => 'required|exists:projects,id_project',
            'id_user_assigne' => 'nullable|exists:users,id_user',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task = Task::create([
            'titre'       => $request->titre,
            'description' => $request->description,
            'etat'        => $request->etat,
            'priorite'    => $request->priorite,
            'id_project'  => $request->id_project,
            'id_user_assigne' => $request->id_user_assigne
        ]);

        ProjectLog::create([
            'project_id' => $task->id_project,
            'user_id'    => auth()->user()->id_user, 
            'action'     => "a créé une nouvelle tâche",
            'target'     => $task->titre
        ]);

        return response()->json(['message' => 'Tâche créée avec succès', 'task' => $task], 201);
    }

    public function assignTask(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $task->id_user_assigne = $request->id_user;
        $task->save();

        // FIX : Suppression de 'type' et 'target_id'
        Notification::create([
            'user_id'   => $task->id_user_assigne,
            'title'     => 'Nouvelle tâche',
            'message'   => "Vous avez été assigné à la tâche : " . $task->titre,
            'is_read'   => false
        ]);

        $assignee = User::find($request->id_user);
        ProjectLog::create([
            'project_id' => $task->id_project,
            'user_id'    => auth()->user()->id_user,
            'action'     => "a assigné la tâche à " . ($assignee->nom ?? 'un membre'),
            'target'     => $task->titre
        ]);

        return response()->json(['message' => 'Tâche assignée et notification envoyée']);
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $task = Task::with('project')->findOrFail($id);
            $nouveauStatut = $request->etat; 
            $ancienStatut = $task->etat;

            $task->update(['etat' => $nouveauStatut]);
            $user = auth()->user();

            ProjectLog::create([
                'project_id' => $task->id_project,
                'user_id'    => $user->id_user, 
                'action'     => "a changé le statut de '{$ancienStatut}' à '{$nouveauStatut}'",
                'target'     => $task->titre
            ]);

            $destinataireId = ($user->id_user == $task->id_user_assigne) 
                ? $task->project->id_user_createur 
                : $task->id_user_assigne;

            if ($destinataireId && $destinataireId != $user->id_user) {
                Notification::create([
                    'user_id'   => $destinataireId,
                    'title'     => 'Mise à jour tâche',
                    'message'   => "Tâche '{$task->titre}' passée à {$nouveauStatut}",
                    'is_read'   => 0
                ]);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function addComment(Request $request, $id) 
    {
        $request->validate(['contenu' => 'required|string']);

        try {
            $task = Task::findOrFail($id);
            $userId = auth()->user()->id_user;

            DB::table('comments')->insert([
                'content'    => $request->contenu,
                'id_task'    => $id,
                'id_user'    => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            ProjectLog::create([
                'project_id' => $task->id_project,
                'user_id'    => $userId,
                'action'     => "a ajouté un commentaire",
                'target'     => $task->titre
            ]);

            return response()->json(['message' => 'Commentaire ajouté !'], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        
        ProjectLog::create([
            'project_id' => $task->id_project,
            'user_id'    => auth()->user()->id_user,
            'action'     => "a supprimé la tâche",
            'target'     => $task->titre
        ]);

        $task->delete();
        return response()->json(['message' => 'Tâche supprimée']);
    }

    public function getTasksByProject($id)
    {
        try {
            $tasks = Task::where('id_project', $id)
                ->with(['assignee', 'comments.user']) 
                ->get();

            return response()->json($tasks);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}