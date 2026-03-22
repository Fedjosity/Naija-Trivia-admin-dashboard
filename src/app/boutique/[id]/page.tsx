'use client';

import { use } from 'react';
import BoutiqueEditor from '@/components/admin/BoutiqueEditor';

export default function EditBoutiqueItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BoutiqueEditor itemId={id} />;
}
