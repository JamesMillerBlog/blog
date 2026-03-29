"use client";

import { useMemo } from "react";
import { Post } from "@/types/post";
import { FEATURED_TAG_MAP } from "@/common/consts/constants";
import { ui } from "@/i18n/en";

type Props = {
  tags: string[];
  posts: Post[];
  selectedTag: string;
  onTagSelect: (tag: string) => void;
};

export function TagCloudSection({ tags, posts, selectedTag, onTagSelect }: Props) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: posts.length };
    for (const tag of tags) {
      const actualTags = FEATURED_TAG_MAP[tag] ?? [tag.toLowerCase()];
      map[tag] = posts.filter((p) =>
        p.tags?.some((t) => actualTags.includes(t))
      ).length;
    }
    return map;
  }, [tags, posts]);

  const allTags = ["All", ...tags];

  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">
          {ui.home.tagCloud.heading}
        </h2>
        <p className="font-body text-base text-on-surface-variant mt-1">
          {ui.home.tagCloud.subheading}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {allTags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => onTagSelect(isSelected && tag !== "All" ? "All" : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold font-headline transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </section>
  );
}
