'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Chore } from '@/types';

/**
 * Admin Chores List Page
 * Displays all chores with create, edit, and delete actions
 */
export default function ChoresPage() {
  const router = useRouter();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [choreToDelete, setChoreToDelete] = useState<Chore | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchChores();
  }, []);

  const fetchChores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chores');
      if (response.ok) {
        const data = await response.json();
        setChores(data.chores || []);
      } else {
        console.error('Failed to fetch chores');
      }
    } catch (error) {
      console.error('Error fetching chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!choreToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/chores/${choreToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChores(chores.filter((c) => c.id !== choreToDelete.id));
        setDeleteDialogOpen(false);
        setChoreToDelete(null);
      } else {
        console.error('Failed to delete chore');
      }
    } catch (error) {
      console.error('Error deleting chore:', error);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (chore: Chore) => {
    setChoreToDelete(chore);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading chores...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chores</h1>
        <Button onClick={() => router.push('/admin/chores/new')}>
          Create Chore
        </Button>
      </div>

      {chores.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">No chores yet</p>
          <Button onClick={() => router.push('/admin/chores/new')}>
            Create Your First Chore
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chores.map((chore) => (
                <TableRow key={chore.id}>
                  <TableCell className="font-medium">{chore.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {chore.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(chore.monetaryValueCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/chores/${chore.id}/edit`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(chore)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{choreToDelete?.name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setChoreToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
