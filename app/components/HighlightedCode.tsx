"use client";

import { useEffect, useState } from "react";

type Props = {
  code: string;
  language?: "tsx" | "typescript" | "javascript";
};

export function HighlightedCode({ code, language = "tsx" }: Props) {
  const [highlighted, setHighlighted] = useState<{
    code: string;
    html: string;
  } | null>(null);

  useEffect(() => {
    let current = true;

    void import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: language,
          theme: "github-dark-default",
        }),
      )
      .then((html) => {
        if (current) setHighlighted({ code, html });
      })
      .catch(() => undefined);

    return () => {
      current = false;
    };
  }, [code, language]);

  if (!highlighted || highlighted.code !== code) {
    return (
      <div className="highlightedCode highlightedCodeFallback">
        <pre><code>{code}</code></pre>
      </div>
    );
  }

  return (
    <div
      className="highlightedCode isHighlighted"
      dangerouslySetInnerHTML={{ __html: highlighted.html }}
    />
  );
}
