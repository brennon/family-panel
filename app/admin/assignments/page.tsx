'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Chore, User, ChoreAssignment } from '@/types';
import { format } from 'date-fns';

/**
 * Admin Assignments Page
 * Allows parents to assign chores to kids for specific dates
 */
export default function AssignmentsPage() {
  const [kids, setKids] = useState<User[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [assignments, setAssignments] = useState<ChoreAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedKid, setSelectedKid] = useState<string>('');
  const [selectedChore, setSelectedChore] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch kids and chores in parallel
      const [kidsResponse, choresResponse] = await Promise.all([
        fetch('/api/users/kids'),
        fetch('/api/chores'),
      ]);

      if (kidsResponse.ok) {
        const kidsData = await kidsResponse.json();
        setKids(kidsData.kids || []);
      }

      if (choresResponse.ok) {
        const choresData = await choresResponse.json();
        setChores(choresData.chores || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        `/api/chore-assignments?date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!selectedKid) {
      newErrors.kid = 'Please select a kid';
    }

    if (!selectedChore) {
      newErrors.chore = 'Please select a chore';
    }

    if (!selectedDate) {
      newErrors.date = 'Please select a date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setSuccessMessage('');

      const response = await fetch('/api/chore-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choreId: selectedChore,
          userId: selectedKid,
          assignedDate: selectedDate,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Chore assigned successfully!');
        setSelectedKid('');
        setSelectedChore('');
        fetchAssignments();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setErrors({ form: data.error || 'Failed to assign chore' });
      }
    } catch (error) {
      console.error('Error assigning chore:', error);
      setErrors({ form: 'Failed to assign chore' });
    } finally {
      setSubmitting(false);
    }
  };

  const getKidName = (userId: string) => {
    const kid = kids.find((k) => k.id === userId);
    return kid?.name || 'Unknown';
  };

  const getChoreName = (choreId: string) => {
    const chore = chores.find((c) => c.id === choreId);
    return chore?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Assign Chores</h1>
        <p className="text-muted-foreground">
          Assign chores to kids for specific dates
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">
                  {errors.form}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded text-sm">
                  {successMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="kid">Kid *</Label>
                <Select value={selectedKid} onValueChange={setSelectedKid}>
                  <SelectTrigger id="kid">
                    <SelectValue placeholder="Select a kid" />
                  </SelectTrigger>
                  <SelectContent>
                    {kids.map((kid) => (
                      <SelectItem key={kid.id} value={kid.id}>
                        {kid.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kid && (
                  <p className="text-sm text-destructive">{errors.kid}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chore">Chore *</Label>
                <Select
                  value={selectedChore}
                  onValueChange={setSelectedChore}
                >
                  <SelectTrigger id="chore">
                    <SelectValue placeholder="Select a chore" />
                  </SelectTrigger>
                  <SelectContent>
                    {chores.map((chore) => (
                      <SelectItem key={chore.id} value={chore.id}>
                        {chore.name} - $
                        {(chore.monetaryValueCents / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.chore && (
                  <p className="text-sm text-destructive">{errors.chore}</p>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Assigning...' : 'Assign Chore'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Assignments for {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No assignments for this date
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kid</TableHead>
                    <TableHead>Chore</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{getKidName(assignment.userId)}</TableCell>
                      <TableCell>{getChoreName(assignment.choreId)}</TableCell>
                      <TableCell>
                        {assignment.completed ? (
                          <Badge variant="default">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
