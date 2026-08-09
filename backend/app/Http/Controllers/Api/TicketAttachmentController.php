<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TicketAttachmentController extends Controller
{
    private const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

    private const MAX_FILE_KB = 10240;

    private const TICKET_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    public function store(Request $request, Ticket $ticket)
    {
        $this->authorize('comment', $ticket);

        $validated = $request->validate([
            'commentid' => [
                'nullable',
                'integer',
                Rule::exists('ticketcomments', 'id')->where('ticketid', $ticket->id),
            ],
        ]);

        $isCommentAttachment = ! empty($validated['commentid']);
        $allowedExtensions = $isCommentAttachment ? self::IMAGE_EXTENSIONS : self::TICKET_EXTENSIONS;

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:'.self::MAX_FILE_KB,
                'mimes:'.implode(',', $allowedExtensions),
            ],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->store('ticket-attachments/'.$ticket->id, 'local');

        $attachment = TicketAttachment::create([
            'ticketid' => $ticket->id,
            'commentid' => $validated['commentid'] ?? null,
            'uploadedby' => $request->user()->id,
            'filename' => $file->getClientOriginalName(),
            'filepath' => $path,
            'filesize' => $file->getSize(),
            'filetype' => $extension,
        ]);

        $this->recordActivity($request, $ticket, 'attachment_added', 'Attachment added: '.$attachment->filename);

        if ($isCommentAttachment) {
            $this->notifyOtherSide($request->user(), $ticket, "New image attached to a comment on {$ticket->ticketrefno}", 'attachment');
        }

        return response()->json($attachment->load('uploader'), 201);
    }

    public function download(Request $request, Ticket $ticket, TicketAttachment $attachment)
    {
        $this->authorize('view', $ticket);

        abort_unless((int) $attachment->ticketid === (int) $ticket->id, 404);

        return Storage::disk('local')->download($attachment->filepath, $attachment->filename);
    }

    public function destroy(Request $request, Ticket $ticket, TicketAttachment $attachment)
    {
        $this->authorize('view', $ticket);

        abort_unless((int) $attachment->ticketid === (int) $ticket->id, 404);

        $user = $request->user();
        abort_unless(
            (int) $attachment->uploadedby === (int) $user->id || $this->isManagingUser($user),
            403,
            'You do not have permission to delete this attachment.'
        );

        Storage::disk('local')->delete($attachment->filepath);
        $attachment->delete();

        $this->recordActivity($request, $ticket, 'attachment_deleted', 'Attachment deleted: '.$attachment->filename);

        return response()->noContent();
    }

    private function notifyOtherSide(User $actor, Ticket $ticket, string $message, string $type): void
    {
        $isActorCreator = (int) $actor->id === (int) $ticket->createdby;

        if ($isActorCreator) {
            if ($ticket->assignedto) {
                $this->notifyUser((int) $ticket->assignedto, $ticket, $message, $type);
            }

            return;
        }

        $this->notifyUser((int) $ticket->createdby, $ticket, $message, $type);
    }

    private function notifyUser(int $userId, ?Ticket $ticket, string $message, string $type): void
    {
        Notification::create([
            'userid' => $userId,
            'ticketid' => $ticket?->id,
            'message' => $message,
            'type' => $type,
        ]);
    }

    private function recordActivity(Request $request, Ticket $ticket, string $action, string $details): void
    {
        ActivityLog::create([
            'userid' => $request->user()?->id,
            'action' => $action,
            'entitytype' => 'ticket',
            'entityid' => $ticket->id,
            'details' => str($details)->limit(500)->toString(),
            'ipaddress' => $request->ip(),
        ]);
    }

    private function isManagingUser(User $user): bool
    {
        return in_array($user->role?->rolename, self::MANAGING_ROLES, true);
    }
}
