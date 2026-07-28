import {
  HackathonSchedule,
  type DaySchedule,
  type ScheduleColumn,
} from "./HackathonSchedule";

const columns: ScheduleColumn[] = [
  { key: "main", label: "MAIN EVENT", type: "main" },
  { key: "sponsorWorkshop", label: "SPONSOR\nWORKSHOPS", type: "sponsor" },
  { key: "otherWorkshop", label: "OTHER\nWORKSHOPS", type: "workshop" },
  { key: "activities1", label: "ACTIVITIES", type: "activity" },
  // { key: "activities2", label: "ACTIVITIES", type: "activity" },
  { key: "food", label: "FOOD", type: "food" },
  { key: "sponsorBooth", label: "SPONSOR\nBOOTH", type: "booth" },
  { key: "judging", label: "JUDGING", type: "judging" },
  { key: "other", label: "OTHER", type: "other" },
];

const schedule: DaySchedule[] = [
  {
    day: "Friday",
    date: "December 21st",
    rows: [
      {
        time: "5:00 PM",
        events: {
          main: { title: "Check-in opens", location: "Main Lobby" },
          sponsorBooth: { title: "Sponsor fair", location: "Atrium" },
        },
      },
      {
        time: "5:30 PM",
        events: {
          main: { title: "Check-in opens", location: "Main Lobby" },
          sponsorBooth: { title: "Sponsor fair", location: "Atrium" },
        },
      },
      {
        time: "6:00 PM",
        events: {
          main: { title: "Check-in opens", location: "Main Lobby" },
          other: { title: "Help desk open", location: "Info Booth" },
        },
      },
      {
        time: "7:00 PM",
        events: {
          main: { title: "Opening ceremony", location: "Auditorium" },
        },
      },
      {
        time: "7:30 PM",
        events: {
          main: { title: "Opening ceremony", location: "Auditorium" },
        },
      },
      {
        time: "8:30 PM",
        events: {
          food: { title: "Dinner", location: "Dining Hall" },
          activities1: { title: "Team formation", location: "Room 101" },
          activities2: { title: "Team formation", location: "Room 101" },
        },
      },
      {
        time: "9:00 PM",
        events: {
          activities1: { title: "Team formation", location: "Room 101" },
          activities2: { title: "Team formation", location: "Room 101" },
        },
      },
      {
        time: "10:00 PM",
        events: {
          sponsorWorkshop: { title: "Build with APIs", location: "Room 208" },
          otherWorkshop: {
            title: "Project planning sprint",
            location: "Room 204",
          },
        },
      },
    ],
  },
  {
    day: "Saturday",
    date: "December 22nd",
    rows: [
      {
        time: "9:00 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
          food: { title: "Breakfast", location: "Dining Hall" },
        },
      },
      {
        time: "9:30 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
        },
      },
      {
        time: "10:00 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
          sponsorWorkshop: {
            title: "AI product workshop",
            location: "Room 208",
          },
          otherWorkshop: {
            title: "Design systems crash course",
            location: "Room 206",
          },
        },
      },
      {
        time: "10:30 AM",
        events: {
          main: { title: "Hacking continues", location: "Hacker Space" },
          sponsorWorkshop: {
            title: "AI product workshop",
            location: "Room 208",
          },
          otherWorkshop: {
            title: "Design systems crash course",
            location: "Room 206",
          },
        },
      },
      {
        time: "12:00 PM",
        events: {
          food: { title: "Lunch", location: "Dining Hall" },
          sponsorBooth: {
            title: "Sponsor booth challenge",
            location: "Atrium",
          },
        },
      },
      {
        time: "1:00 PM",
        events: {
          activities1: { title: "Mini games", location: "Atrium" },
          activities2: { title: "Mini games", location: "Atrium" },
          sponsorBooth: {
            title: "Sponsor booth challenge",
            location: "Atrium",
          },
        },
      },
      {
        time: "6:00 PM",
        events: {
          food: { title: "Dinner", location: "Dining Hall" },
          other: { title: "Mentor office hours", location: "Help Desk" },
        },
      },
      {
        time: "11:30 PM",
        events: {
          main: { title: "Project submission deadline", location: "Online" },
        },
      },
    ],
  },
  {
    day: "Sunday",
    date: "December 23rd",
    rows: [
      {
        time: "9:00 AM",
        events: {
          food: { title: "Breakfast", location: "Dining Hall" },
          judging: { title: "Judging begins", location: "Expo Floor" },
        },
      },
      {
        time: "9:30 AM",
        events: {
          judging: { title: "Judging begins", location: "Expo Floor" },
        },
      },
      {
        time: "11:00 AM",
        events: {
          judging: { title: "Final demos", location: "Auditorium" },
          sponsorBooth: { title: "Sponsor expo", location: "Atrium" },
        },
      },
      {
        time: "12:30 PM",
        events: {
          food: { title: "Lunch", location: "Dining Hall" },
          judging: { title: "Final demos", location: "Auditorium" },
        },
      },
      {
        time: "3:00 PM",
        events: {
          main: { title: "Closing ceremony", location: "Auditorium" },
        },
      },
    ],
  },
];

export default function SchedulePage() {
  return <HackathonSchedule columns={columns} days={schedule} />;
}
