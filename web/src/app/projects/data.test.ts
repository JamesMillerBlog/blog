import { describe, it, expect } from "vitest";
import {
  projects,
  getCategories,
  type Project,
} from "./data";

// ---------------------------------------------------------------------------
// Static data integrity
// ---------------------------------------------------------------------------

describe("projects static data", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("every project has required fields", () => {
    const requiredKeys: Array<keyof Project> = [
      "slug",
      "title",
      "description",
      "company",
      "year",
      "category",
      "tags",
    ];

    for (const project of projects) {
      for (const key of requiredKeys) {
        expect(
          project[key],
          `Project "${project.slug}" is missing field "${key}"`
        ).toBeDefined();
      }
    }
  });

  it("every project category is one of the valid values", () => {
    const valid = new Set([
      "Internet of Things",
      "Artificial Intelligence",
      "Web",
      "Extended Reality",
    ]);
    for (const project of projects) {
      expect(
        valid.has(project.category),
        `Project "${project.slug}" has invalid category "${project.category}"`
      ).toBe(true);
    }
  });

  it("every project has a non-empty tags array", () => {
    for (const project of projects) {
      expect(
        Array.isArray(project.tags) && project.tags.length > 0,
        `Project "${project.slug}" has empty or missing tags`
      ).toBe(true);
    }
  });

  it("all slugs are unique", () => {
    const slugs = projects.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("all years are plausible integers", () => {
    for (const project of projects) {
      expect(Number.isInteger(project.year)).toBe(true);
      expect(project.year).toBeGreaterThanOrEqual(2000);
      expect(project.year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
    }
  });
});

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------

describe("getCategories", () => {
  it("returns an array", () => {
    expect(Array.isArray(getCategories())).toBe(true);
  });

  it("includes all expected categories", () => {
    const cats = getCategories();
    expect(cats).toContain("Highlights");
    expect(cats).toContain("Internet of Things");
    expect(cats).toContain("Artificial Intelligence");
    expect(cats).toContain("Web");
    expect(cats).toContain("Extended Reality");
    expect(cats).toContain("All");
  });

  it("returns exactly 6 entries", () => {
    expect(getCategories()).toHaveLength(6);
  });
});
