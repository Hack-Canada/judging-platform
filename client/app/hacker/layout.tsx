import { SideBar } from "./SideBar";

export default function HackerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-dvh w-screen overflow-hidden bg-[var(--bg-light)]">
      <div className="flex h-dvh w-screen flex-col overflow-hidden lg:flex-row">
        <SideBar />
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
