'use client';

import React from 'react';
import PackEditor from '@/components/admin/PackEditor';
import { useParams } from 'next/navigation';

export default function EditPackPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex-1 flex flex-col h-screen">
      <PackEditor packId={id} />
    </div>
  );
}
