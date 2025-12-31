import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Edit } from "lucide-react";
import { capitalise } from "@/utils/helpers";

interface FieldEditModalProps {
  field: string;
  currentValue: string;
  onSubmit: (field: string, fieldValue: string) => void;
  customDescription?: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function FieldEditModal({
  field,
  currentValue,
  onSubmit,
  customDescription,
  externalOpen,
  onExternalOpenChange,
}: FieldEditModalProps) {
  const controlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? externalOpen! : internalOpen;
  const [value, setValue] = useState(currentValue);

  let friendlyFieldName;
  if (field.includes(".")) {
    friendlyFieldName = capitalise(field.split(".").at(-1)!);
  } else {
    friendlyFieldName = capitalise(field);
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (controlled) {
      onExternalOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
    if (newOpen) setValue(currentValue);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {friendlyFieldName}</DialogTitle>
          <DialogDescription hidden>
            Update the value of {friendlyFieldName}. {customDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input
            id={field}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              handleOpenChange(false);
              onSubmit(field, value);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
