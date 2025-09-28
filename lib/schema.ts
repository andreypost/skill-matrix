import { z } from "zod";

export const SalarySchema = z
  .object({
    currency: z.enum(["USD", "EUR", "PLN", "GBP"]),
    min: z.number().int().positive().optional(),
    max: z.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      typeof val.min === "number" &&
      typeof val.max === "number" &&
      val.min > val.max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "salary.min cannot be greater than salary.max",
        path: ["min"],
      });
    }
  });

const nonEmptyStr = z.string().trim().min(1);

export const SkillMatrixSchema = z.object({
  title: nonEmptyStr,
  seniority: z.enum(["junior", "mid", "senior", "lead", "unknown"]),
  skills: z.object({
    frontend: z.array(nonEmptyStr),
    backend: z.array(nonEmptyStr),
    devops: z.array(nonEmptyStr),
    web3: z.array(nonEmptyStr),
    other: z.array(nonEmptyStr),
  }),
  mustHave: z.array(nonEmptyStr),
  niceToHave: z.array(nonEmptyStr),
  salary: SalarySchema.optional(),
  summary: z
    .string()
    .trim()
    .refine((val) => val.split(/\s+/).filter(Boolean).length <= 60, {
      message: "summary must be 60 words or fewer",
    }),
});

export type SkillMatrix = z.infer<typeof SkillMatrixSchema>;
