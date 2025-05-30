
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NEWS_CATEGORIES, NEWS_COUNTRIES } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

const ALL_CATEGORIES_VALUE = "_all_categories_"; // Special value for "All Categories"
const ANY_COUNTRY_VALUE = "_any_country_"; // Special value for "Any Country"

interface NewsFiltersProps {
  filters: {
    query: string;
    country: string;
    stateOrRegion: string;
    city: string;
    category: string;
  };
  onFilterChange: (name: keyof NewsFiltersProps['filters'], value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading: boolean;
}

export function NewsFilters({ filters, onFilterChange, onApplyFilters, onResetFilters, isLoading }: NewsFiltersProps) {
  const isCountrySelected = !!filters.country && filters.country !== ANY_COUNTRY_VALUE;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="query">Search Keywords</Label>
          <Input
            id="query"
            placeholder="e.g., AI, economy..."
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            disabled={isLoading}
            className="bg-input/50"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="country-select">Country</Label>
          <Select
            value={filters.country || ANY_COUNTRY_VALUE}
            onValueChange={(value) => onFilterChange('country', value === ANY_COUNTRY_VALUE ? "" : value)}
            disabled={isLoading}
          >
            <SelectTrigger id="country-select" className="bg-input/50">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_COUNTRY_VALUE}>Any Country</SelectItem>
              {NEWS_COUNTRIES.map(country => (
                <SelectItem key={country.value} value={country.value}>{country.label} ({country.value.toUpperCase()})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stateOrRegion">State/Region</Label>
          <Input
            id="stateOrRegion"
            placeholder="e.g., California, Bavaria"
            value={filters.stateOrRegion}
            onChange={(e) => onFilterChange('stateOrRegion', e.target.value)}
            disabled={isLoading || !isCountrySelected}
            title={!isCountrySelected ? "Select a country to enable" : ""}
            className="bg-input/50 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g., London, Tokyo"
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            disabled={isLoading || !isCountrySelected}
            title={!isCountrySelected ? "Select a country to enable" : ""}
            className="bg-input/50 disabled:opacity-50"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="category-select">Category</Label>
          <Select
            value={filters.category || ALL_CATEGORIES_VALUE}
            onValueChange={(value) => onFilterChange('category', value === ALL_CATEGORIES_VALUE ? "" : value)}
            disabled={isLoading}
          >
            <SelectTrigger id="category-select" className="bg-input/50">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
              {NEWS_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button onClick={onApplyFilters} disabled={isLoading} className="flex-grow sm:flex-grow-0">
          {isLoading ? "Loading..." : "Apply Filters"}
        </Button>
        <Button onClick={onResetFilters} variant="outline" disabled={isLoading} className="flex-grow sm:flex-grow-0">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset Filters
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/80 mt-2">
        Note: State/Region and City filters are applied as part of the keyword search when a country is selected.
        For broad searches without a specific country, leave the country field as "Any Country".
      </p>
    </div>
  );
}
