import { describe, it, expect } from "vitest";
import { fallbackExtract } from "./fallback";

const JD = `
Senior Fullstack Engineer – Remote

Must-have
- React.js
- TypeScript
- Node.js
- PostgreSQL
- Docker

Nice-to-have
- Kubernetes
- AWS
- Solidity

Responsibilities:
- Build scalable APIs with Express / Nest
- Implement CI/CD (GitHub Actions, GitLab CI)
- Work with Next.js & Tailwind

Salary: $120k–150k USD per year
`;

describe("fallbackExtract (single Case)", () => {
  it("parses seniority, skills buckets, lists, salary, summary", () => {
    const out = fallbackExtract(JD);

    expect(out.title.toLocaleLowerCase()).toContain(
      "senior fullstack engineer"
    );
    expect(out.seniority).toBe("senior");

    expect(out.skills.frontend).toEqual(
      expect.arrayContaining(["react", "typescript", "next", "tailwind"])
    );

    expect(out.skills.backend).toEqual(
      expect.arrayContaining(["node", "express", "nest", "postgres"])
    );

    expect(out.skills.devops).toEqual(
      expect.arrayContaining([
        "docker",
        "kubernetes",
        "aws",
        "github-actions",
        "gitlab-ci",
        "ci/cd",
      ])
    );

    expect(out.skills.web3).toEqual(expect.arrayContaining(["solidity"]));

    expect(out.mustHave).toEqual(
      expect.arrayContaining([
        "React.js",
        "TypeScript",
        "Node.js",
        "PostgreSQL",
        "Docker",
      ])
    );

    expect(out.niceToHave).toEqual(
      expect.arrayContaining(["Kubernetes", "AWS", "Solidity"])
    );

    expect(out.salary).toEqual({ currency: "USD", min: 120000, max: 150000 });

    const words = out.summary.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeLessThanOrEqual(60);
  });
});
