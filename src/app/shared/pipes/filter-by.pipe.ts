import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy',
  standalone: true
})
export class FilterByPipe implements PipeTransform {
  transform<T extends object>(
    items: readonly T[] | null | undefined,
    searchTerm: string | null | undefined,
    searchField: string,
    exactField?: string,
    exactValue?: string | null
  ): T[] {
    if (!items) return [];

    const query = searchTerm?.trim().toLowerCase() ?? '';
    return items.filter(item => {
      const values = item as Record<string, unknown>;
      const searchableValue = String(values[searchField] ?? '').toLowerCase();
      const matchesSearch = !query || searchableValue.includes(query);
      const matchesExactValue = !exactField || !exactValue || String(values[exactField] ?? '') === exactValue;
      return matchesSearch && matchesExactValue;
    });
  }
}
