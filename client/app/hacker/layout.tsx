import ClickSpark from "@/components/ClickSpark";

import { SideBar } from "./SideBar";

export default function HackerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-dvh w-screen overflow-hidden bg-[var(--bg-light)]">
      <ClickSpark
        sparkColor="#4da3ff"
        sparkSize={9}
        sparkRadius={22}
        sparkCount={8}
        duration={420}
        extraScale={1.1}
      >
        <div className="flex h-dvh w-screen flex-col overflow-hidden lg:flex-row">
          <SideBar />
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </ClickSpark>
    </div>
  );
}
