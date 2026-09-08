'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { Pagination } from './pagination';
import { Input } from './input';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T | ((item: T) => string);
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  initialPageSize?: number;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  isLoading = false,
  emptyMessage = 'No records found matching your criteria.',
  initialPageSize = 10,
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Handle Search Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (typeof searchKey === 'function') {
        return searchKey(item).toLowerCase().includes(term);
      }
      if (searchKey && item[searchKey] !== undefined) {
        return String(item[searchKey]).toLowerCase().includes(term);
      }
      // Global search across all string/number fields of item
      return Object.values(item).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Handle Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination Slice
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="max-w-md w-full">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" aria-hidden="true" />}
            aria-label="Search records"
          />
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>

      {/* Table Section */}
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.className}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-navy-900" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-navy-900" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 hover:text-slate-600" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-navy-900" aria-hidden="true" />
                    <span className="text-sm font-medium">Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {searchTerm && (
                      <p className="text-xs text-slate-400">Try adjusting your search query</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, idx) => (
                <TableRow key={item.id || idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(item) : item[col.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
