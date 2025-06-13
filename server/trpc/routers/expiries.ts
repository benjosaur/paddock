import { router, createProtectedProcedure } from "../trpc.ts";
import type { Mp, Volunteer, ExpiryItem } from "shared/types/index.ts";

export const expiriesRouter = router({
  getAll: createProtectedProcedure("expiries", "read").query(
    async ({ ctx }) => {
      const mps = await ctx.db.findAll<Mp>("mps");
      const volunteers = await ctx.db.findAll<Volunteer>("volunteers");

      const expiries: ExpiryItem[] = [];
      let counter = 1;

      // MP DBS expiries
      mps.forEach((mp) => {
        if (mp.dbsExpiry) {
          expiries.push({
            id: counter++,
            date: mp.dbsExpiry,
            type: "dbs",
            person: { id: mp.id, type: "MP", name: mp.name },
            name: "DBS Check",
          });
        }

        // MP training expiries
        mp.trainingRecords.forEach((training) => {
          expiries.push({
            id: counter++,
            date: training.expiry,
            type: "training",
            person: { id: mp.id, type: "MP", name: mp.name },
            name: training.training,
          });
        });
      });

      // Volunteer DBS expiries
      volunteers.forEach((volunteer) => {
        if (volunteer.dbsExpiry) {
          expiries.push({
            id: counter++,
            date: volunteer.dbsExpiry,
            type: "dbs",
            person: {
              id: volunteer.id,
              type: "Volunteer",
              name: volunteer.name,
            },
            name: "DBS Check",
          });
        }

        // Volunteer training expiries
        volunteer.trainingRecords.forEach((training) => {
          expiries.push({
            id: counter++,
            date: training.expiry,
            type: "training",
            person: {
              id: volunteer.id,
              type: "Volunteer",
              name: volunteer.name,
            },
            name: training.training,
          });
        });
      });

      return expiries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }
  ),
});
