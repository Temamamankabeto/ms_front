"use client";

import {
  Button,
} from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;

  lastPage: number;

  onPageChange: (
    page: number
  ) => void;
}

export default function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}: PaginationProps) {

  /*
  |--------------------------------------------------------------------------
  | HIDE PAGINATION
  |--------------------------------------------------------------------------
  */

  if (lastPage <= 1) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <div className="flex items-center justify-between pt-4">

      <Button
        variant="outline"
        disabled={
          currentPage <= 1
        }
        onClick={() =>
          onPageChange(
            currentPage - 1
          )
        }
      >
        Previous
      </Button>

      <div className="text-sm text-muted-foreground">

        Page {currentPage} of {lastPage}

      </div>

      <Button
        variant="outline"
        disabled={
          currentPage >= lastPage
        }
        onClick={() =>
          onPageChange(
            currentPage + 1
          )
        }
      >
        Next
      </Button>

    </div>
  );
}