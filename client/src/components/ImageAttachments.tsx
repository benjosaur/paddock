import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { allowedAttachmentTypes, maxAttachmentBytes } from "shared/const";
import { trpc, trpcClient } from "../utils/trpc";
import { Button } from "./ui/button";
import { DeleteAlert } from "./DeleteAlert";
import { PermissionGate } from "./PermissionGate";
import { formatYmdToDmy } from "@/utils/date";

interface ImageAttachmentsProps {
  ownerId: string;
}

export function ImageAttachments({ ownerId }: ImageAttachmentsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    fileName: string;
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
    mutationFn: async (file: File) => {
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
        throw new Error(`Image upload failed (HTTP ${putResponse.status})`);
      }
      return await trpcClient.attachments.confirm.mutate({
        ownerId,
        attachmentId,
        fileName: file.name,
      });
    },
    onSuccess: () => {
      toast.success("Image uploaded");
      invalidateList();
    },
  });

  const deleteMutation = useMutation(
    trpc.attachments.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Image deleted");
        invalidateList();
      },
    })
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!allowedAttachmentTypes.some((type) => type === file.type)) {
      toast.error("Only JPEG, PNG, GIF, WebP or PDF files are allowed");
      return;
    }
    if (file.size > maxAttachmentBytes) {
      toast.error(
        `File must be ${maxAttachmentBytes / (1024 * 1024)}MB or smaller`
      );
      return;
    }
    uploadMutation.mutate(file);
  };

  const attachments = attachmentsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">Images</h3>
        <PermissionGate resource="clients" action="update">
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
            {uploadMutation.isPending ? "Uploading..." : "Upload Image"}
          </Button>
        </PermissionGate>
      </div>

      {attachmentsQuery.isLoading ? (
        <p className="text-sm text-gray-500">Loading images...</p>
      ) : attachmentsQuery.isError ? (
        <p className="text-sm text-red-600">
          {attachmentsQuery.error.message.includes("not configured")
            ? "Image uploads are not configured for this environment."
            : "Failed to load images."}
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-gray-500">
          No images attached to this client.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              <a href={attachment.url} target="_blank" rel="noreferrer">
                <img
                  src={attachment.url}
                  alt={attachment.details.fileName}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              </a>
              <div className="p-2 text-xs text-gray-600 flex items-center justify-between gap-2">
                <span
                  className="truncate"
                  title={attachment.details.fileName}
                >
                  {attachment.details.fileName}
                </span>
                <span className="shrink-0 text-gray-400">
                  {formatYmdToDmy(attachment.updatedAt.slice(0, 10))}
                </span>
                <PermissionGate resource="clients" action="update">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 px-2 shrink-0"
                    onClick={() =>
                      setDeleteTarget({
                        id: attachment.id,
                        fileName: attachment.details.fileName,
                      })
                    }
                  >
                    Delete
                  </Button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      )}

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
        itemType="image"
      />
    </div>
  );
}
