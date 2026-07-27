"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AllergenValue = boolean | "May Contain" | null;

type Meal = {
  name: string;
  vendor: string;
  allergens: Record<string, AllergenValue>;
};

type MealGroup = {
  label: string;
  meals: Meal[];
};

type DayMenu = {
  day: string;
  groups: MealGroup[];
};

const menus: DayMenu[] = [
  {
    day: "Friday",
    groups: [
      {
        label: "Dinner",
        meals: [
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: true,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: false,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
        ],
      },
      {
        label: "Midnight Snack",
        meals: [
          {
            name: "Type of Snack",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: false,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
        ],
      },
    ],
  },
  {
    day: "Saturday",
    groups: [
      {
        label: "Breakfast",
        meals: [
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: null,
              Meat: null,
              Eggs: "May Contain",
              Nuts: "May Contain",
              Gluten: true,
            },
          },
        ],
      },
      {
        label: "Lunch",
        meals: [
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: true,
              Eggs: false,
              Nuts: false,
              Gluten: true,
            },
          },
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: false,
              Eggs: false,
              Nuts: false,
              Gluten: true,
            },
          },
        ],
      },
      {
        label: "Dinner",
        meals: [
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: true,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: false,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
        ],
      },
    ],
  },
  {
    day: "Sunday",
    groups: [
      {
        label: "Breakfast",
        meals: [
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: null,
              Meat: false,
              Eggs: "May Contain",
              Nuts: "May Contain",
              Gluten: true,
            },
          },
        ],
      },
      {
        label: "Lunch",
        meals: [
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: true,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
          {
            name: "Food",
            vendor: "Location",
            allergens: {
              Halal: true,
              Meat: false,
              Eggs: false,
              Nuts: false,
              Gluten: false,
            },
          },
        ],
      },
    ],
  },
];

function allergenDisplay(value: AllergenValue) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return value ?? "Ask staff";
}

export default function FoodPage() {
  const [expandedAllergens, setExpandedAllergens] = useState<
    Record<string, boolean>
  >({});

  function setAllergenPopupOpen(key: string, open: boolean) {
    setExpandedAllergens((current) => ({
      ...current,
      [key]: open,
    }));
  }

  return (
    <main className="h-full w-full overflow-auto bg-[var(--bg-light)] p-4 [font-family:var(--font-figtree)] text-[var(--text-body)] sm:p-6">
      <header
        className="hacker-card-enter mb-6"
        style={{ animationDelay: "40ms" }}
      >
        <p className="[font-family:var(--font-jetbrains-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
          Hacker logistics
        </p>
        <h1 className="[font-family:var(--font-fredoka)] text-3xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]">
          Food Menu
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Check meal options and allergen notes before each food window.
        </p>
      </header>

      <Accordion
        type="multiple"
        defaultValue={["Friday", "Saturday"]}
        className="max-w-4xl gap-3"
      >
        {menus.map((dayMenu, index) => (
          <AccordionItem
            key={dayMenu.day}
            value={dayMenu.day}
            className="hacker-card-enter rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] px-5 shadow-[0_10px_24px_rgba(15,42,67,0.06)]"
            style={{ animationDelay: `${120 + index * 70}ms` }}
          >
            <AccordionTrigger className="[font-family:var(--font-fredoka)] text-xl font-semibold tracking-[-0.01em] text-[var(--brand-secondary)] hover:text-[var(--text-primary)] hover:no-underline">
              {dayMenu.day}
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="flex flex-col gap-6">
                {dayMenu.groups.map((group) => (
                  <section key={`${dayMenu.day}-${group.label}`}>
                    <h2 className="mb-3 [font-family:var(--font-jetbrains-mono)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      {group.label}
                    </h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {group.meals.map((meal, mealIndex) => {
                        const allergenKey = `${dayMenu.day}-${group.label}-${meal.name}-${mealIndex}`;
                        const isExpanded =
                          expandedAllergens[allergenKey] ?? false;

                        return (
                          <article
                            key={allergenKey}
                            className="rounded-2xl border border-[color:var(--bg-gray-dark)]/70 bg-[var(--bg-light)] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-[var(--brand-secondary)]">
                                  {meal.name}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {meal.vendor}
                                </p>
                              </div>
                              <Popover
                                open={isExpanded}
                                onOpenChange={(open) =>
                                  setAllergenPopupOpen(allergenKey, open)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant={isExpanded ? "default" : "outline"}
                                    size="sm"
                                    className={`rounded-full [font-family:var(--font-figtree)] font-semibold shadow-none ${
                                      isExpanded
                                        ? "bg-[var(--brand-secondary)] text-white hover:bg-[var(--brand-secondary)]"
                                        : "border-[color:var(--bg-gray-dark)] bg-white text-[var(--brand-secondary)] hover:bg-[var(--bg-primary-light)] hover:text-[var(--brand-secondary)]"
                                    }`}
                                  >
                                    <Info
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                    Allergens
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  className="w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[color:var(--bg-gray-dark)] bg-[var(--bg-white)] p-0 [font-family:var(--font-figtree)] text-[var(--text-body)] shadow-[0_16px_36px_rgba(15,42,67,0.12)]"
                                >
                                  <div className="border-b border-[var(--bg-gray)] px-4 py-3">
                                    <p className="font-semibold text-[var(--brand-secondary)]">
                                      {meal.name} allergens
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                      {meal.vendor}
                                    </p>
                                  </div>
                                  <div className="max-h-72 overflow-y-auto px-3 pb-3">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Allergen</TableHead>
                                          <TableHead>Status</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {Object.entries(meal.allergens).map(
                                          ([allergen, value]) => (
                                            <TableRow key={allergen}>
                                              <TableCell>{allergen}</TableCell>
                                              <TableCell>
                                                {allergenDisplay(value)}
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  );
}
