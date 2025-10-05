import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  endDate: string | null | undefined;
  onEndDateChange: (date: string) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  endDescription: string;
  undoDescription: string;
};

export function EndDialog({
  isOpen,
  onOpenChange,
  entityLabel,
  endDate,
  onEndDateChange,
  onConfirm,
  confirmDisabled,
  endDescription,
  undoDescription,
}: Props) {
  const isUndo = endDate === "open";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUndo ? `Undo End ${entityLabel}` : `End ${entityLabel}`}
          </DialogTitle>
          <DialogDescription>
            {isUndo ? undoDescription : endDescription}
          </DialogDescription>
        </DialogHeader>
        {!isUndo && (
          <div className="flex flex-col gap-4 py-4">
            <label className="text-sm text-gray-700">End Date</label>
            <Input
              type="date"
              value={endDate ?? ""}
              onChange={(e) => onEndDateChange(e.target.value)}
              required
            />
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!!confirmDisabled}
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EndDialog;
