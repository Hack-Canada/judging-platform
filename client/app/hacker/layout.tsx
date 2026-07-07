import { SideBar } from "./SideBar";

export default function HackerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-screen h-screen">
      <SideBar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
