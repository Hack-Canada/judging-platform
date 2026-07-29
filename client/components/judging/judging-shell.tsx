"use client";

import type { ReactNode } from "react";

import ClickSpark from "@/components/ClickSpark";
import { JudgeDeskBuddy } from "@/components/judging/judge-desk-buddy";

export function JudgingShell({ children }: { children: ReactNode }) {
  return (
    <div className="judging-shell" data-judging-shell>
      <ClickSpark
        sparkColor="#4da3ff"
        sparkSize={8}
        sparkRadius={20}
        sparkCount={10}
        duration={460}
        extraScale={1.15}
      >
        <div className="judging-shell-inner">{children}</div>
        <JudgeDeskBuddy />
      </ClickSpark>
    </div>
  );
}
