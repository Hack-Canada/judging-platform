"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", invested: 0, cumulative: 0 },
  { date: "2024-04-02", invested: 43, cumulative: 43 },
  { date: "2024-04-05", invested: 92, cumulative: 135 },
  { date: "2024-04-08", invested: 28, cumulative: 163 },
  { date: "2024-04-12", invested: 67, cumulative: 230 },
  { date: "2024-04-15", invested: 35, cumulative: 265 },
  { date: "2024-04-18", invested: 125, cumulative: 390 },
  { date: "2024-04-22", invested: 52, cumulative: 442 },
  { date: "2024-04-26", invested: 89, cumulative: 531 },
  { date: "2024-04-29", invested: 41, cumulative: 572 },
  { date: "2024-05-03", invested: 76, cumulative: 648 },
  { date: "2024-05-07", invested: 33, cumulative: 681 },
  { date: "2024-05-10", invested: 0, cumulative: 681 },
  { date: "2024-05-14", invested: 0, cumulative: 681 },
  { date: "2024-05-18", invested: 0, cumulative: 681 },
  { date: "2024-05-22", invested: 0, cumulative: 681 },
  { date: "2024-05-26", invested: 0, cumulative: 681 },
  { date: "2024-05-30", invested: 0, cumulative: 681 },
  { date: "2024-06-03", invested: 0, cumulative: 681 },
  { date: "2024-06-07", invested: 0, cumulative: 681 },
  { date: "2024-06-11", invested: 0, cumulative: 681 },
  { date: "2024-06-15", invested: 0, cumulative: 681 },
  { date: "2024-06-19", invested: 0, cumulative: 681 },
  { date: "2024-06-23", invested: 0, cumulative: 681 },
  { date: "2024-06-27", invested: 0, cumulative: 681 },
  { date: "2024-06-30", invested: 103, cumulative: 784 },
]

const chartConfig = {
  cumulative: {
    label: "Cumulative Points",
    color: "var(--primary)",
  },
  invested: {
    label: "Daily Points",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Points Tracking</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Points assigned to projects over time
          </span>
          <span className="@[540px]/card:hidden">Points tracking</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-cumulative)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-cumulative)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-invested)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-invested)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value} pts`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  formatter={(value) => [`${value} pts`, undefined]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="cumulative"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-cumulative)"
              name="Total Points"
            />
            <Area
              dataKey="invested"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-invested)"
              name="Daily Points"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
