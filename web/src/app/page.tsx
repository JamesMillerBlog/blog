import { HomeContent } from "@/app/_components/home-content";
import { getAllPosts } from "@/common/utils/posts";
import { FEATURED_TAGS } from "@/common/consts/constants";

export default async function Index() {
  const allPosts = await getAllPosts();

  return (
    <main className="max-w-7xl mx-auto px-6 pb-20">
      <HomeContent allPosts={allPosts} featuredTags={FEATURED_TAGS} />
    </main>
  );
}
