'use client';

import React, { Suspense } from 'react';
import PackEditor from '@/components/admin/PackEditor';
import { useSearchParams } from 'next/navigation';

function NewPackForm() {
  const searchParams = useSearchParams();
  const isAiTriggered = searchParams.get('ai') === 'true';

  return (
    <div className="flex-1 flex flex-col h-screen">
      <PackEditor initialAiTrigger={isAiTriggered} />
    </div>
  );
}

export default function NewPackPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#0b0e0c]" />}>
      <NewPackForm />
    </Suspense>
  );
}
