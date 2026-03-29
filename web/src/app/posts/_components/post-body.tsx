import { ReactElement } from "react";
import markdownStyles from "./markdown-styles.module.css";

type Props = {
  content: ReactElement;
};

export function PostBody({ content }: Props) {
  return (
    <div className="max-w-[980px] mx-auto">
      <div className={markdownStyles["markdown"]}>{content}</div>
    </div>
  );
}
