import Header from '@/components/layout/Header';
import MatrixBoard from '@/components/matrix/MatrixBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* ── Main content ── */}
      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-6">
        <MatrixBoard />
      </main>
    </div>
  );
}
