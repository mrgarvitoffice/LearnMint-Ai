"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

interface NewsFiltersProps {
  filters: {
    query: string;
    country: string;
    category: string;
  };
  onFilterChange: (name: keyof NewsFiltersProps['filters'], value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading: boolean;
}

export function NewsFilters({ filters, onFilterChange, onApplyFilters, onResetFilters, isLoading }: NewsFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end mb-6 p-4 border rounded-lg bg-card">
      <div className="space-y-1.5">
        <Label htmlFor="query">Search</Label>
        <Input
          id="query"
          placeholder="Keywords..."
          value={filters.query}
          onChange={(e) => onFilterChange('query', e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="country">Country Code</Label>
        <Input
          id="country"
          placeholder="e.g., us, gb, ca"
          value={filters.country}
          onChange={(e) => onFilterChange('country', e.target.value.toLowerCase())}
          disabled={isLoading}
          maxLength={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => onFilterChange('category', value)}
          disabled={isLoading}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {NEWS_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onApplyFilters} disabled={isLoading} className="sm:col-span-2 lg:col-span-1">
        {isLoading ? "Loading..." : "Apply Filters"}
      </Button>
       <Button onClick={onResetFilters} variant="outline" disabled={isLoading} className="sm:col-span-2 lg:col-span-1">
        <RotateCcw className="w-4 h-4 mr-2" /> Reset
      </Button>
    </div>
  );
}
