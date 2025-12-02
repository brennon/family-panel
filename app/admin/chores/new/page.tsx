'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * New Chore Form Page
 * Allows parents to create new chores
 */
export default function NewChorePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monetaryValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Chore name is required';
    }

    if (formData.monetaryValue && isNaN(parseFloat(formData.monetaryValue))) {
      newErrors.monetaryValue = 'Value must be a valid number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      // Convert dollar amount to cents
      const monetaryValueCents = formData.monetaryValue
        ? Math.round(parseFloat(formData.monetaryValue) * 100)
        : 0;

      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          monetaryValueCents,
        }),
      });

      if (response.ok) {
        router.push('/admin/chores');
      } else {
        const data = await response.json();
        setErrors({ form: data.error || 'Failed to create chore' });
      }
    } catch (error) {
      console.error('Error creating chore:', error);
      setErrors({ form: 'Failed to create chore' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Chore</h1>
        <p className="text-muted-foreground">
          Create a new chore that can be assigned to kids
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chore Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
                {errors.form}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Wash Dishes"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description of the chore"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monetaryValue">Value ($)</Label>
              <Input
                id="monetaryValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.monetaryValue}
                onChange={(e) =>
                  setFormData({ ...formData, monetaryValue: e.target.value })
                }
                placeholder="0.00"
                aria-invalid={!!errors.monetaryValue}
              />
              {errors.monetaryValue && (
                <p className="text-sm text-destructive">
                  {errors.monetaryValue}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                How much kids will earn for completing this chore
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Chore'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/chores')}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
