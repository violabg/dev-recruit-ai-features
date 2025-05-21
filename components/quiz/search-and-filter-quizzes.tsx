"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  Filter,
  Loader2,
  Search as SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

type SearchAndFilterQuizzesProps = {
  uniqueLevels: string[];
};

export const SearchAndFilterQuizzes = ({
  uniqueLevels,
}: SearchAndFilterQuizzesProps) => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || ""
  );

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      replace(`/dashboard/quizzes?${params.toString()}`);
    });
  }, 800);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    startTransition(() => {
      replace(`/dashboard/quizzes?${params.toString()}`);
    });
  };

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (value && value !== "all") {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    startTransition(() => {
      replace(`/dashboard/quizzes?${params.toString()}`);
    });
  };

  useEffect(() => {
    setInputValue(searchParams.get("search") || "");
  }, [searchParams]);

  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentFilter = searchParams.get("filter") || "all";

  return (
    <div className="flex sm:flex-row flex-col gap-4">
      <div className="relative flex-1">
        {isPending ? (
          <Loader2 className="top-2.5 left-2.5 absolute w-4 h-4 animate-spin" />
        ) : (
          <SearchIcon className="top-2.5 left-2.5 absolute w-4 h-4 text-muted-foreground" />
        )}
        <Input
          type="search"
          name="search"
          placeholder="Cerca quiz..."
          className="pl-8"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleSearch(e.target.value);
          }}
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2">
        <Select
          name="sort"
          value={currentSort}
          onValueChange={handleSort}
          disabled={isPending}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <SelectValue placeholder="Ordina" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Più recenti</SelectItem>
            <SelectItem value="oldest">Meno recenti</SelectItem>
            <SelectItem value="a-z">A-Z</SelectItem>
            <SelectItem value="z-a">Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Select
          name="filter"
          value={currentFilter}
          onValueChange={handleFilter}
          disabled={isPending}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="Filtra" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i livelli</SelectItem>
            {uniqueLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(currentSearch || currentFilter !== "all") && (
          <Button variant="outlineDestructive" asChild disabled={isPending}>
            <Link href="/dashboard/quizzes">Resetta</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
