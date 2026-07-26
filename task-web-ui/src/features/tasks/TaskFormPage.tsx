import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTaskStore } from '@/stores/task.store';
import { handleApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Priority, TaskStatus } from '@/types';
import type { Priority as PriorityType, TaskStatus as TaskStatusType } from '@/types';
import { formatPriority, formatTaskStatus } from './task-labels';

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatusType;
  priority: PriorityType;
  dueDate: string;
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  status: TaskStatus.TODO,
  priority: Priority.MEDIUM,
  dueDate: '',
};

export function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { createTask, updateTask, fetchTask, currentTask, isLoading } = useTaskStore();
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTask(id);
    }
  }, [id, fetchTask]);

  useEffect(() => {
    if (isEdit && currentTask && currentTask.id === id) {
      setForm({
        title: currentTask.title,
        description: currentTask.description || '',
        status: currentTask.status,
        priority: currentTask.priority,
        dueDate: currentTask.dueDate ? currentTask.dueDate.slice(0, 10) : '',
      });
    }
  }, [isEdit, currentTask, id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      };

      if (isEdit && id) {
        await updateTask(id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      navigate('/tasks');
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to save task'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="text-2xl font-bold">
            Task Management
          </Link>
          <Button variant="outline" onClick={() => navigate('/tasks')}>
            Back to tasks
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Task' : 'Create Task'}</CardTitle>
            <CardDescription>
              {isEdit ? 'Update title, status, and other details.' : 'Add a personal task to your list.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isEdit && isLoading && !currentTask ? (
                <p className="text-sm text-muted-foreground">Loading task...</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      disabled={saving}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        disabled={saving}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {Object.values(TaskStatus).map((status) => (
                          <option key={status} value={status}>
                            {formatTaskStatus(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        disabled={saving}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                      >
                        {Object.values(Priority).map((priority) => (
                          <option key={priority} value={priority}>
                            {formatPriority(priority)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={form.dueDate}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/tasks')} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
