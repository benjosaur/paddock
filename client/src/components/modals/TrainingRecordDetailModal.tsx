import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { trpc } from "../../utils/trpc";
import { isIdMp, isIdVolunteer } from "shared/utils";
import { useQuery } from "@tanstack/react-query";
import { TrainingRecordsTable } from "../tables/TrainingRecordsTable";

interface TrainingRecordDetailModalProps {
  carerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TrainingRecordDetailModal({
  carerId,
  isOpen,
  onClose,
}: TrainingRecordDetailModalProps) {
  const mpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id: carerId }), // assertion that not undef as a result of enabled condition
    enabled: isIdMp(carerId),
  });

  const volunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id: carerId }), // assertion that not undef as a result of enabled condition
    enabled: isIdVolunteer(carerId),
  });

  const carer = mpQuery.data || volunteerQuery.data;

  if (!carer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Training Records {carer.details.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Records</h3>
          {carer.trainingRecords.length > 0 ? (
            <TrainingRecordsTable data={carer.trainingRecords} />
          ) : (
            <p className="text-sm text-gray-500">
              No new trainingRecords found for this carer.
            </p>
          )}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
