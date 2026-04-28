import { Navbar } from "@/components/shared/Navbar";

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar type="model" />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
