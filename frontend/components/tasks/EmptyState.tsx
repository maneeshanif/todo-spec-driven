"use client";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-neutral-600 text-6xl mb-6">📝</div>
      <h3 className="text-2xl font-semibold text-white mb-2">No tasks yet</h3>
      <p className="text-neutral-400 text-center max-w-md">
        Start organizing your day by creating your first task. Click the "Add Task" button to get started.
      </p>
    </div>
  );
}
