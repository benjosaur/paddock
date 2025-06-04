import { router, publicProcedure } from "../trpc.ts";
import type { Mp, Volunteer, ExpiryItem } from "shared/types/index.ts";

export const expiriesRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const mps = await ctx.db.findAll<Mp>("mps");
    const volunteers = await ctx.db.findAll<Volunteer>("volunteers");

    const expiries: ExpiryItem[] = [];

    // MP DBS expiries
    mps.forEach((mp) => {
      if (mp.dbsExpiry) {
        expiries.push({
          id: mp.id,
          date: mp.dbsExpiry,
          type: "dbs",
          mpVolunteer: mp.name,
          name: "DBS Check",
          personType: "MP",
        });
      }

      // MP training expiries
      mp.trainingRecords.forEach((training) => {
        expiries.push({
          id: mp.id,
          date: training.expiry,
          type: "training",
          mpVolunteer: mp.name,
          name: training.training,
          personType: "MP",
        });
      });
    });

    // Volunteer DBS expiries
    volunteers.forEach((volunteer) => {
      if (volunteer.dbsExpiry) {
        expiries.push({
          id: volunteer.id,
          date: volunteer.dbsExpiry,
          type: "dbs",
          mpVolunteer: volunteer.name,
          name: "DBS Check",
          personType: "Volunteer",
        });
      }

      // Volunteer training expiries
      volunteer.trainingRecords.forEach((training) => {
        expiries.push({
          id: volunteer.id,
          date: training.expiry,
          type: "training",
          mpVolunteer: volunteer.name,
          name: training.training,
          personType: "Volunteer",
        });
      });
    });

    return expiries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }),
});
