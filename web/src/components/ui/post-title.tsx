import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

export function PostTitle({ children }: Props) {
  return (
    <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight md:leading-none mb-12 text-on-surface text-center md:text-left">
      {children}
    </h1>
  );
}
