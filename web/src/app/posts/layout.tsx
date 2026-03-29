import { ReadingProgress } from "@/app/posts/_components/reading-progress";

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReadingProgress />
      {children}
    </>
  );
}
