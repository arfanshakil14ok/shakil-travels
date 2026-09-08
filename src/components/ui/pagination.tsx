import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 text-sm text-slate-600">
      {/* Items count & page size */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <p className="text-xs sm:text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
            <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalItems}</span> entries
          </p>
        )}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-slate-300 py-1 px-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900"
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="text-xs font-medium text-slate-700 px-2">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
