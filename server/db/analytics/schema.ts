import { serviceOptions } from "shared/const";
import { z } from "zod";

export const reportSchema = z.object({
  totalHours: z.number(),
  villages: z.array(
    z.object({
      name: z.string(),
      services: z.array(
        z.object({
          name: z.enum(serviceOptions),
          totalHours: z.number(),
        })
      ),
      totalHours: z.number(),
    })
  ),
  services: z.array(
    z.object({
      name: z.string(),
      totalHours: z.number(),
    })
  ),
});
