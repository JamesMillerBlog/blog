"use client";

import { useState } from "react";
import { HeroSection } from "./hero-section";
import { FeaturedPosts } from "./featured-posts";
import { TagCloudSection } from "./tag-cloud-section";
import { FilteredPostGrid } from "./filtered-post-grid";
import { Post } from "@/types/post";

type Props = {
  allPosts: Post[];
  featuredTags: string[];
};

export function HomeContent({ allPosts, featuredTags }: Props) {
  const [selectedTag, setSelectedTag] = useState("All");

  const featuredPost = allPosts[0];
  const secondaryPosts = allPosts.slice(1, 3);
  const morePosts = allPosts.slice(3);

  function handleTagSelect(tag: string) {
    setSelectedTag(tag);
  }

  return (
    <>
      <HeroSection />
      <FeaturedPosts featuredPost={featuredPost} secondaryPosts={secondaryPosts} />
      <TagCloudSection
        tags={featuredTags}
        posts={morePosts}
        selectedTag={selectedTag}
        onTagSelect={handleTagSelect}
      />
      {morePosts.length > 0 && (
        <FilteredPostGrid
          posts={morePosts}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
        />
      )}
    </>
  );
}
