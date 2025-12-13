"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';

export default function AddTaskButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
      <CreateTaskModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
}