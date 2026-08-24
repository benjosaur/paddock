import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import { allowedAttachmentTypes, maxAttachmentBytes } from "shared/const";
import { trpc, trpcClient } from "../utils/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { DeleteAlert } from "./DeleteAlert";
import { PermissionGate } from "./PermissionGate";
import { formatYmdToDmy } from "@/utils/date";

export type AttachmentResource = "clients" | "mps" | "volunteers";

interface AttachmentsProps {
  ownerId: string;
  // Permission resource of the owning entity: upload/delete need its update.
  resource: AttachmentResource;
  // grid: thumbnail tiles (detail modals). list: compact rows (dialog).
  layout: "grid" | "list";
}

const isImage = (contentType: string) => contentType.startsWith("image/");

export function Attachments({ ownerId, resource, layout }: AttachmentsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

  // File picked but awaiting its document date before the upload runs.
  const [pendingUpload, setPendingUpload] = useState<{
    file: File;
    date: string;
  } | null>(null);

  const attachmentsQuery = useQuery(
    trpc.attachments.listByOwner.queryOptions({ ownerId })
  );

  const invalidateList = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.attachments.listByOwner.queryKey({ ownerId }),
    });

  // One mutation for the whole flow (presign -> PUT to S3 -> confirm) so a
  // failure at any step surfaces as a single error toast.
  const uploadMutation = useMutation({
    mutationFn: async ({ file, date }: { file: File; date: string }) => {
      const { attachmentId, uploadUrl } =
        await trpcClient.attachments.createUploadUrl.mutate({
          ownerId,
          contentType: file.type as (typeof allowedAttachmentTypes)[number],
          size: file.size,
        });
      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) {
        throw new Error(`Upload failed (HTTP ${putResponse.status})`);
      }
      return await trpcClient.attachments.confirm.mutate({
        ownerId,
        attachmentId,
        fileName: file.name,
        date,
      });
    },
    onSuccess: () => {
      toast.success("File uploaded");
      invalidateList();
    },
  });

  const deleteMutation = useMutation(
    trpc.attachments.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Attachment deleted");
        invalidateList();
      },
    })
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!allowedAttachmentTypes.some((type) => type === file.type)) {
      toast.error(
        "Only images (JPEG, PNG, GIF, WebP), PDFs and documents (.docx, .doc, .odt) are allowed"
      );
      return;
    }
    if (file.size > maxAttachmentBytes) {
      toast.error(
        `File must be ${maxAttachmentBytes / (1024 * 1024)}MB or smaller`
      );
      return;
    }
    // Ask for the document's date before uploading (defaults to today).
    setPendingUpload({ file, date: new Date().toISOString().split("T")[0] });
  };

  const attachments = attachmentsQuery.data ?? [];

  const uploadButton = (
    <PermissionGate resource={resource} action="update">
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedAttachmentTypes.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        {uploadMutation.isPending ? "Uploading..." : "Upload File"}
      </Button>
    </PermissionGate>
  );

  const deleteButton = (attachment: { id: string; fileName: string }) => (
    <PermissionGate resource={resource} action="update">
      <Button
        variant="destructive"
        size="sm"
        // At h-6 scale the Button hover animation reads as a resize:
        // hover:shadow-sm pins the shadow-md swell, and transition-none stops
        // WebKit re-rasterizing the label mid-transition (text drops its
        // subpixel smoothing and thins, so the pill looks narrower for ~1s).
        className="h-6 px-2 shrink-0 hover:shadow-sm transition-none"
        onClick={() => setDeleteTarget(attachment)}
      >
        Delete
      </Button>
    </PermissionGate>
  );

  const statusMessage = attachmentsQuery.isLoading ? (
    <p className="text-sm text-gray-500">Loading attachments...</p>
  ) : attachmentsQuery.isError ? (
    <p className="text-sm text-red-600">
      {attachmentsQuery.error.message.includes("not configured")
        ? "Attachments are not configured for this environment."
        : "Failed to load attachments."}
    </p>
  ) : attachments.length === 0 ? (
    <p className="text-sm text-gray-500">No attachments yet.</p>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {layout === "grid" ? (
          <h3 className="text-lg font-semibold text-gray-700">Attachments</h3>
        ) : (
          <span className="text-sm text-gray-500">
            Images, PDFs and documents (.docx, .doc, .odt), up to{" "}
            {maxAttachmentBytes / (1024 * 1024)}MB
          </span>
        )}
        {uploadButton}
      </div>

      {statusMessage ??
        (layout === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="border rounded-lg overflow-hidden bg-white"
              >
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  {isImage(attachment.details.contentType) ? (
                    <img
                      src={attachment.url}
                      alt={attachment.details.fileName}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full flex items-center justify-center bg-gray-50 text-gray-400">
                      <FileText className="h-12 w-12" />
                    </div>
                  )}
                </a>
                <div className="p-2 text-xs text-gray-600 flex items-center justify-between gap-2">
                  <span
                    className="truncate"
                    title={attachment.details.fileName}
                  >
                    {attachment.details.fileName}
                  </span>
                  <span className="shrink-0 text-gray-400">
                    {formatYmdToDmy(attachment.date)}
                  </span>
                  {deleteButton({
                    id: attachment.id,
                    fileName: attachment.details.fileName,
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y border rounded-lg bg-white">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-3 p-2 text-sm"
              >
                {isImage(attachment.details.contentType) ? (
                  <img
                    src={attachment.url}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                ) : (
                  <span className="h-10 w-10 rounded bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                    <FileText className="h-5 w-5" />
                  </span>
                )}
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-gray-700 hover:underline"
                  title={attachment.details.fileName}
                >
                  {attachment.details.fileName}
                </a>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatYmdToDmy(attachment.date)}
                </span>
                {deleteButton({
                  id: attachment.id,
                  fileName: attachment.details.fileName,
                })}
              </li>
            ))}
          </ul>
        ))}

      <Dialog
        open={pendingUpload !== null}
        onOpenChange={(open) => {
          if (!open) setPendingUpload(null);
        }}
      >
        <DialogContent className="md:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload attachment</DialogTitle>
          </DialogHeader>
          {pendingUpload && (
            <div className="space-y-4">
              <p
                className="text-sm text-gray-600 truncate"
                title={pendingUpload.file.name}
              >
                {pendingUpload.file.name}
              </p>
              <div>
                <label
                  htmlFor="attachment-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Document date
                </label>
                <Input
                  id="attachment-date"
                  type="date"
                  value={pendingUpload.date}
                  onChange={(e) =>
                    setPendingUpload({ ...pendingUpload, date: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPendingUpload(null)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={pendingUpload.date === ""}
                  onClick={() => {
                    uploadMutation.mutate(pendingUpload);
                    setPendingUpload(null);
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteAlert
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ ownerId, attachmentId: deleteTarget.id });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.fileName}
        itemType="attachment"
      />
    </div>
  );
}

interface AttachmentsDialogProps {
  ownerId: string | null;
  resource: AttachmentResource;
  onClose: () => void;
}

// On-demand attachments manager used by the table row dropdowns and the edit
// forms; nothing fetches until it opens (ownerId set).
export function AttachmentsDialog({
  ownerId,
  resource,
  onClose,
}: AttachmentsDialogProps) {
  return (
    <Dialog open={ownerId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="md:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attachments</DialogTitle>
        </DialogHeader>
        {ownerId && (
          <Attachments ownerId={ownerId} resource={resource} layout="list" />
        )}
      </DialogContent>
    </Dialog>
  );
}
