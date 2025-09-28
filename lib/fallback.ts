import { SkillMatrixSchema, type SkillMatrix } from "./schema";

const FRONTEND = [
  "react",
  "next",
  "vue",
  "nuxt",
  "angular",
  "svelte",
  "typescript",
  "javascript",
  "tailwind",
  "redux",
];
const BACKEND = [
  "node",
  "express",
  "nest",
  "python",
  "django",
  "flask",
  "ruby",
  "rails",
  "java",
  "spring",
  "go",
  "golang",
  "php",
  "laravel",
  "postgres",
  "mysql",
  "mongodb",
  "prisma",
  "typeorm",
  "graphql",
];
const DEVOPS = [
  "docker",
  "kubernetes",
  "k8s",
  "terraform",
  "ansible",
  "aws",
  "gcp",
  "azure",
  "ci/cd",
  "github-actions",
  "gitlab-ci",
  "helm",
  "prometheus",
];
const WEB3 = [
  "solidity",
  "evm",
  "wagmi",
  "viem",
  "hardhat",
  "foundry",
  "ethers",
  "web3.js",
  "metamask",
  "openzeppelin",
  "merkle",
  "staking",
  "defi",
  "erc20",
  "erc721",
  "erc1155",
];

const STOPWORDS = new Set([
  "developer",
  "we",
  "are",
  "looking",
  "for",
  "someone",
  "who",
  "is",
  "extremely",
  "motivated",
  "and",
  "willing",
  "to",
  "learn",
  "this",
  "great",
  "opportunity",
  "join",
  "fast-growing",
  "company",
  "where",
  "you",
  "will",
  "work",
  "with",
  "should",
  "be",
  "passionate",
  "about",
  "technology",
  "interested",
  "in",
  "on",
  "continuous",
  "learning",
  "ready",
  "collaborate",
  "team",
  "members",
  "across",
  "different",
  "time",
  "zones",
  "cultures",
  "must",
  "must-have",
  "nice-to-have",
  "requirements",
  "responsibilities",
  "salary",
  "compensation",
  "bonus",
  "benefits",
  "per",
  "year",
  "monthly",
  "month",
  "annum",
  "remote",
  "onsite",
  "hybrid",
  "usd",
  "eur",
  "gbp",
  "pln",
  "uah",
  "min",
  "from",
  "to",
  "gross",
  "net",
]);

const SENIORITY_MAP: Array<[RegExp, SkillMatrix["seniority"]]> = [
  [/lead|staff|principal/i, "lead"],
  [/senior|sr\./i, "senior"],
  [/\bmid\b|middle|intermediate/i, "mid"],
  [/junior|jr\./i, "junior"],
];

const pickTitle = (text: string) => {
  const m = text.match(/(?:title|role|position)\s*:\s*(.+)/i);
  if (m) return m[1].trim().slice(0, 80);
  const head = text.split("\n")[0]?.trim();
  return head && head.length > 4 && head.length < 120 ? head : "Unknown Title";
};

const inferSeniority = (text: string): SkillMatrix["seniority"] => {
  for (const [re, lvl] of SENIORITY_MAP) if (re.test(text)) return lvl;
  return "unknown";
};

const normalizePhrases = (t: string) => {
  return t
    .replace(/\bgithub\s+actions\b/gi, "github-actions")
    .replace(/\bgitlab\s+ci\b/gi, "gitlab-ci")
    .replace(/\bci\s*\/\s*cd\b/gi, "ci/cd");
};

const bucketSkills = (tokens: string[]) => {
  const out = {
    frontend: [] as string[],
    backend: [] as string[],
    devops: [] as string[],
    web3: [] as string[],
    other: [] as string[],
  };
  const push = (arr: string[], v: string) => {
    if (!arr.includes(v)) arr.push(v);
  };

  for (const raw of tokens) {
    const k = raw.toLowerCase();

    if (FRONTEND.includes(k)) {
      push(out.frontend, k);
      continue;
    }
    if (BACKEND.includes(k)) {
      push(out.backend, k);
      continue;
    }
    if (DEVOPS.includes(k)) {
      push(out.devops, k);
      continue;
    }
    if (WEB3.includes(k)) {
      push(out.web3, k);
      continue;
    }

    if (
      STOPWORDS.has(k) ||
      /^\d+([,.]\d+)?$/.test(k) ||
      /^\d+k$/i.test(k) ||
      /^[\W_]+$/.test(k) ||
      k.length < 2
    )
      continue;

    if (!/^[a-z][a-z0-9.+/-]*$/i.test(k)) continue;

    push(out.other, k);
  }
  return out;
};

const parseLists = (text: string) => {
  const must: string[] = [];
  const nice: string[] = [];
  const lines = text.split(/\r?\n/);
  let mode: "must" | "nice" | null = null;

  for (const l of lines) {
    const line = l.trim();
    if (/must[-\s]?have/i.test(line)) {
      mode = "must";
      continue;
    }
    if (/nice[-\s]?to[-\s]?have|bonus/i.test(line)) {
      mode = "nice";
      continue;
    }
    const li = line.match(/^[-*•]\s*(.+)/);
    if (li && mode) (mode === "must" ? must : nice).push(li[1].trim());
  }
  return { mustHave: must, niceToHave: nice };
};

const parseSalary = (text: string): SkillMatrix["salary"] | undefined => {
  // Examples: $40-70k, 120k–160k USD, EUR 80 000 - 100 000, 5k-7k PLN
  const norm = text.replace(/\u00A0/g, " ");
  const cur = (
    norm.match(/\b(USD|EUR|PLN|GBP|usd|eur|pln|gbp|\$|€|zł|£)\b/i)?.[0] || ""
  ).toLowerCase();

  const currency =
    cur === "$" || cur === "usd"
      ? "USD"
      : cur === "€" || cur === "eur"
      ? "EUR"
      : cur === "zł" || cur === "pln"
      ? "PLN"
      : cur === "£" || cur === "gbp"
      ? "GBP"
      : undefined;

  const range =
    norm.match(
      /(\d{1,3}(?:[ ,.]?\d{3})*|\d+(?:\.\d+)?)\s*(k)?\s*[-–—]\s*(\d{1,3}(?:[ ,.]?\d{3})*|\d+(?:\.\d+)?)\s*(k)?/i
    ) || norm.match(/(?:from|min)\s*(\d{1,3}(?:[ ,.]?\d{3})*|\d+)(k)?/i);

  let min: number | undefined, max: number | undefined;
  if (range) {
    const m1 = Number(range[1].replace(/[ ,.]/g, ""));
    const k1 = range[2]?.toLowerCase() === "k";
    if (range[3]) {
      const m2 = Number(range[3].replace(/[ ,.]/g, ""));
      const k2 = range[4]?.toLowerCase() === "k";
      min = k1 ? m1 * 1000 : m1;
      max = k2 ? m2 * 1000 : m2;
    } else {
      min = k1 ? m1 * 1000 : m1;
    }
  }
  if (!currency && !min && !max) return undefined;
  const curGuess = currency ?? (/\$/.test(norm) ? "USD" : undefined);
  return curGuess ? { currency: curGuess as any, min, max } : undefined;
};

const summarizeTo60Words = (text: string) => {
  const words = text.replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Role summary not provided.";
  return words.length <= 60
    ? words.join(" ")
    : words.slice(0, 60).join(" ") + "...";
};

export const fallbackExtract = (jd: string = "") => {
  const text = normalizePhrases(jd);
  const title = pickTitle(text);
  const seniority = inferSeniority(text);

  const tokens = Array.from(
    new Set(text.toLowerCase().match(/[a-z0-9+.#/-]+/gi) || [])
  );

  const skills = bucketSkills(tokens);

  const { mustHave, niceToHave } = parseLists(text);

  const salary = parseSalary(text);
  const summary = summarizeTo60Words(text);

  const obj: SkillMatrix = {
    title,
    seniority,
    skills,
    mustHave,
    niceToHave,
    salary,
    summary,
  };

  return SkillMatrixSchema.parse(obj);
};
