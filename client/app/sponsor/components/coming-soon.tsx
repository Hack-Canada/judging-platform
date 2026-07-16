export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl text-blue-700 font-semibold">{title}</h1>
      <p className="text-blue-700">Coming soon.</p>
    </div>
  );
}
