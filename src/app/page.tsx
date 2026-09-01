import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import MatrixBoard from '@/components/matrix/MatrixBoard';
import FilterBar from '@/components/filters/FilterBar';
import { FilterProvider } from '@/lib/filterContext';

export default function Home() {
  return (
    // Suspense is required because FilterProvider uses useSearchParams()
    <Suspense>
      <FilterProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />

          <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-6">
            <FilterBar />
            <MatrixBoard />
          </main>
        </div>
      </FilterProvider>
    </Suspense>
  );
}
