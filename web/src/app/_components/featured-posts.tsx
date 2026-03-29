import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types/post";
import { format } from "date-fns";
import { ui } from "@/i18n/en";

type Props = {
  featuredPost: Post;
  secondaryPosts: Post[];
};

export function FeaturedPosts({ featuredPost, secondaryPosts }: Props) {
  return (
    <section className="mb-24">
      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Large Featured Card */}
        <div className="md:col-span-8 group cursor-pointer">
          <Link href={`/posts/${featuredPost.slug}`}>
            <article className="h-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 p-4 border border-outline-variant/10">
              {/* Image */}
              <div className="relative rounded-lg overflow-hidden h-[400px] mb-8">
                <Image
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter font-headline">
                    {ui.home.featuredPosts.badge}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="font-headline text-3xl font-extrabold text-on-surface mb-4 leading-tight">
                {featuredPost.title}
              </h3>
              <p className="font-body text-xl text-on-surface-variant mb-6 line-clamp-2">
                {featuredPost.excerpt}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container" />
                <span className="text-sm font-semibold text-outline font-headline">
                  {format(new Date(featuredPost.date), "MMM d, yyyy")}
                </span>
              </div>
            </article>
          </Link>
        </div>

        {/* Secondary Cards Stack */}
        <div className="md:col-span-4 flex flex-col gap-8">
          {secondaryPosts.slice(0, 2).map((post, index) => (
            <SecondaryCard key={post.slug} post={post} variant={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SecondaryCard({ post, variant }: { post: Post; variant: number }) {
  const colors = [
    { bg: "bg-secondary", text: "text-on-secondary", icon: "text-secondary" },
    { bg: "bg-tertiary", text: "text-on-tertiary", icon: "text-tertiary" },
  ];
  const color = colors[variant % 2];

  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="flex-1 bg-surface-container-low rounded-xl p-8 hover:bg-surface-bright transition-colors group cursor-pointer border border-outline-variant/10">
        <div className="flex justify-between items-start mb-6">
          <span
            className={`${color.bg} ${color.text} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter font-headline`}
          >
            {ui.home.featuredPosts.secondaryBadges[variant % 2]}
          </span>
          <BoltIcon className={color.icon} />
        </div>

        <h3 className="font-headline text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="font-body text-lg text-on-surface-variant line-clamp-3">
          {post.excerpt}
        </p>
      </article>
    </Link>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
    </svg>
  );
}
