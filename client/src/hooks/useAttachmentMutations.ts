import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { allowedAttachmentTypes, maxAttachmentBytes } from "shared/const";
import { trpc, trpcClient } from "../utils/trpc";

// Entities that can own attachments; also the permission resource whose
// `update` action gates upload and delete.
export type AttachmentResource = "clients" | "mps" | "volunteers";

export interface AttachmentUploadInput {
  file: File;
  // The document's own date, entered at upload — not the upload time.
  date: string;
}

// Client-side check mirroring the server's limits; returns the message to
// show, or null when the file is acceptable.
export function validateAttachmentFile(file: File): string | null {
  if (!allowedAttachmentTypes.some((type) => type === file.type)) {
    return "Only images (JPEG, PNG, GIF, WebP), PDFs and documents (.docx, .doc, .odt) are allowed.";
  }
  if (file.size > maxAttachmentBytes) {
    return `File must be ${maxAttachmentBytes / (1024 * 1024)}MB or smaller.`;
  }
  return null;
}

// Upload (presign -> PUT to S3 -> confirm) and delete for one owner. The
// attachment list lives on the owner's getById payload, so both invalidate
// that one cache entry — the same key the detail modals query.
export function useAttachmentMutations(
  ownerId: string,
  resource: AttachmentResource,
) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc[resource].getById.queryKey({ id: ownerId }),
    });

  // One mutation for the whole flow so a failure at any step surfaces as a
  // single error toast.
  const upload = useMutation({
    mutationFn: async ({ file, date }: AttachmentUploadInput) => {
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
      await trpcClient.attachments.confirm.mutate({
        ownerId,
        attachmentId,
        fileName: file.name,
        date,
      });
      return { attachmentId };
    },
    onSuccess: () => {
      toast.success("File uploaded");
      invalidate();
    },
  });

  const remove = useMutation(
    trpc.attachments.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Attachment deleted");
        invalidate();
      },
    }),
  );

  return { upload, remove };
}
