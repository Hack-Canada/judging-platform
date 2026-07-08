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
    <main className="h-full w-full overflow-auto bg-[#E3F3FF] p-6 text-neutral-950">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase text-black">
          Hacker logistics
        </p>
        <h1 className="text-3xl font-bold">Food Menu</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Check meal options and allergen notes before each food window.
        </p>
      </header>

      <Accordion
        type="multiple"
        defaultValue={["Friday", "Saturday"]}
        className="max-w-4xl gap-3"
      >
        {menus.map((dayMenu) => (
          <AccordionItem
            key={dayMenu.day}
            value={dayMenu.day}
            className="rounded-lg border border-neutral-200 bg-white px-5 shadow-sm"
          >
            <AccordionTrigger className="text-lg font-bold hover:no-underline">
              {dayMenu.day}
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="flex flex-col gap-6">
                {dayMenu.groups.map((group) => (
                  <section key={`${dayMenu.day}-${group.label}`}>
                    <h2 className="mb-3 text-sm font-bold uppercase text-neutral-500">
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
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-neutral-950">
                                  {meal.name}
                                </h3>
                                <p className="text-sm text-neutral-500">
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
                                  className="w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
                                >
                                  <div className="border-b border-neutral-200 px-4 py-3">
                                    <p className="font-semibold text-neutral-950">
                                      {meal.name} allergens
                                    </p>
                                    <p className="text-xs text-neutral-500">
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
