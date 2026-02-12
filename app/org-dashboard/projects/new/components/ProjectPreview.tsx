'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { type ProjectFormValues } from '../lib/schema';

interface ProjectPreviewProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function ProjectPreview({ form }: ProjectPreviewProps) {
  const values = form.watch();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: values.currency,
    }).format(amount);
  };

  const objectives = values.objectives || [];
  const indicators = values.indicators || [];
  const funding = values.funding || [];
  const team = values.team || [];

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Project Summary</h3>
        <p className="text-sm text-muted-foreground">Preview of project details</p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Basic Details</h4>
          <div className="mt-2 space-y-2">
            <p className="text-sm">
              <span className="font-medium">Name:</span> {values.name || 'Not set'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Theme:</span> {values.theme || 'Not set'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              {values.status.charAt(0) + values.status.slice(1).toLowerCase().replace('_', ' ')}
            </p>
            <p className="text-sm">
              <span className="font-medium">Duration:</span>{' '}
              {values.startDate && values.endDate
                ? `${format(values.startDate, 'MMM d, yyyy')} - ${format(values.endDate, 'MMM d, yyyy')}`
                : 'Not set'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Budget:</span>{' '}
              {values.totalBudget ? formatCurrency(values.totalBudget) : 'Not set'}
            </p>
          </div>
        </div>

        {objectives.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Objectives</h4>
            <div className="mt-2 space-y-2">
              {objectives.map((objective, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{objective.level}:</span>{' '}
                  {objective.description.substring(0, 100)}
                  {objective.description.length > 100 ? '...' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {indicators.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Indicators</h4>
            <div className="mt-2 space-y-2">
              {indicators.map((indicator, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{indicator.name}</span>
                  <p className="text-xs text-muted-foreground">
                    Type: {indicator.type}, Target: {indicator.target || 'Not set'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {funding.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Funding</h4>
            <div className="mt-2 space-y-2">
              {funding.map((fund, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">Source {index + 1}:</span>{' '}
                  {formatCurrency(fund.amount)} ({fund.year})
                </div>
              ))}
            </div>
          </div>
        )}

        {team.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Team</h4>
            <div className="mt-2 space-y-2">
              {team.map((member, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">Team Member {index + 1}</span>
                  <p className="text-xs text-muted-foreground">
                    Role: {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 