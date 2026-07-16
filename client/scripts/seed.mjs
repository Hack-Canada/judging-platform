import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Add it to client/.env.local first.");
}
const sql = neon(url);

const volunteers = [
  { name: "Priya Nair", email: "priya.nair@hackcanada.dev" },
  { name: "Marcus Chen", email: "marcus.chen@hackcanada.dev" },
  { name: "Dana Alvarez", email: "dana.alvarez@hackcanada.dev" },
  { name: "Jordan Whitfield", email: "jordan.whitfield@hackcanada.dev" },
  { name: "Sam Okafor", email: "sam.okafor@hackcanada.dev" },
];

const sponsors = [
  {
    companyName: "Northwind Labs",
    contactName: "Alexa Reyes",
    contactEmail: "alexa.reyes@northwindlabs.com",
  },
  {
    companyName: "Bluepeak Systems",
    contactName: "Owen Tran",
    contactEmail: "owen.tran@bluepeaksystems.com",
  },
];

// Public hackathon program — no assignments, visible to every portal.
const events = [
  {
    title: "Opening Ceremony",
    location: "Main Auditorium",
    startTime: "2026-07-05T09:30:00Z",
    endTime: "2026-07-05T10:30:00Z",
    description: "Kickoff, sponsor shoutouts, and rules briefing for the weekend.",
  },
  {
    title: "Hacking Begins",
    location: "Main Hall",
    startTime: "2026-07-05T11:00:00Z",
    endTime: "2026-07-06T09:00:00Z",
    description: "Hackers start building — venue open around the clock.",
  },
  {
    title: "Submission Deadline",
    location: "Main Hall",
    startTime: "2026-07-06T09:00:00Z",
    endTime: "2026-07-06T09:00:00Z",
    description: "All projects must be submitted on Devpost by this time.",
  },
  {
    title: "Closing Ceremony",
    location: "Main Auditorium",
    startTime: "2026-07-06T16:30:00Z",
    endTime: "2026-07-06T18:00:00Z",
    description: "Judging results, awards, and closing remarks.",
  },
];

// Work items assigned to specific volunteers/sponsors: teamLead supervises
// the shift itself; `assignments`/`sponsorAssignments` list who's working it.
const scheduleItems = [
  {
    title: "Registration Desk",
    location: "Main Entrance",
    teamLead: "Priya Nair",
    startTime: "2026-07-05T09:00:00Z",
    endTime: "2026-07-05T12:00:00Z",
    description:
      "Greet hackers as they arrive, verify registration on the check-in app, and hand out badges and swag bags.",
    assignments: [
      { volunteer: "Priya Nair", role: "Check-in Support", status: "current" },
      { volunteer: "Marcus Chen", role: "Badge Printing", status: "current" },
    ],
  },
  {
    title: "Workshop Room Support",
    location: "Room 204",
    teamLead: "Marcus Chen",
    startTime: "2026-07-05T13:00:00Z",
    endTime: "2026-07-05T15:00:00Z",
    description:
      "Help the workshop speaker with AV setup, manage room capacity, and direct attendees to open seats.",
    assignments: [
      { volunteer: "Priya Nair", role: "Room Monitor", status: "upcoming" },
    ],
  },
  {
    title: "Meal Distribution",
    location: "Cafeteria",
    teamLead: "Dana Alvarez",
    startTime: "2026-07-05T18:00:00Z",
    endTime: "2026-07-05T19:30:00Z",
    description:
      "Set up dinner stations, manage the line, and flag any allergy or dietary accommodation requests to the lead.",
    assignments: [
      { volunteer: "Dana Alvarez", role: "Food Service", status: "upcoming" },
    ],
  },
  {
    title: "Overnight Security Walk",
    location: "Floors 1-3",
    teamLead: "Jordan Whitfield",
    startTime: "2026-07-06T00:00:00Z",
    endTime: "2026-07-06T02:00:00Z",
    description:
      "Walk assigned floors every 30 minutes, ensure hackers are safe, and report any facility issues to organizers.",
    assignments: [
      { volunteer: "Jordan Whitfield", role: "Floor Monitor", status: "upcoming" },
    ],
  },
  {
    title: "Breakfast Setup",
    location: "Cafeteria",
    teamLead: "Dana Alvarez",
    startTime: "2026-07-06T07:00:00Z",
    endTime: "2026-07-06T09:00:00Z",
    description:
      "Arrange breakfast stations, restock coffee and pastries, and keep the serving area tidy.",
    assignments: [
      { volunteer: "Dana Alvarez", role: "Food Service", status: "upcoming" },
    ],
  },
  {
    title: "Judging Room Support",
    location: "Main Hall",
    teamLead: "Priya Nair",
    startTime: "2026-07-06T11:00:00Z",
    endTime: "2026-07-06T14:00:00Z",
    description:
      "Guide teams to their judging table, keep the schedule on track, and relay timing signals to judges.",
    assignments: [
      { volunteer: "Priya Nair", role: "Room Monitor", status: "upcoming" },
    ],
  },
  {
    title: "Closing Ceremony Setup",
    location: "Main Auditorium",
    teamLead: "Sam Okafor",
    startTime: "2026-07-06T15:00:00Z",
    endTime: "2026-07-06T16:30:00Z",
    description:
      "Arrange seating, test the microphone and slides, and help direct attendees to the auditorium.",
    assignments: [
      { volunteer: "Sam Okafor", role: "Event Support", status: "upcoming" },
    ],
  },
  {
    title: "Venue Teardown",
    location: "All Floors",
    teamLead: "Jordan Whitfield",
    startTime: "2026-07-06T17:00:00Z",
    endTime: "2026-07-06T19:00:00Z",
    description:
      "Break down signage and furniture, collect leftover swag, and do a final sweep of each room.",
    assignments: [
      { volunteer: "Jordan Whitfield", role: "Cleanup Crew", status: "upcoming" },
    ],
  },
  {
    title: "Sponsor Welcome Breakfast",
    location: "Sponsor Lounge",
    teamLead: null,
    startTime: "2026-07-05T08:00:00Z",
    endTime: "2026-07-05T09:00:00Z",
    description: "Meet the organizing team and get a walkthrough of the venue.",
    sponsorAssignments: [
      { sponsor: "Northwind Labs", role: "Attendee" },
      { sponsor: "Bluepeak Systems", role: "Attendee" },
    ],
  },
  {
    title: "Booth Setup Window",
    location: "Expo Hall",
    teamLead: null,
    startTime: "2026-07-05T10:00:00Z",
    endTime: "2026-07-05T12:00:00Z",
    description: "Set up your sponsor booth ahead of the expo opening.",
    sponsorAssignments: [{ sponsor: "Northwind Labs", role: "Exhibitor" }],
  },
];

async function main() {
  await sql`delete from volunteer_assignments`;
  await sql`delete from sponsor_assignments`;
  await sql`delete from schedule`;
  await sql`delete from events`;
  await sql`delete from volunteers`;
  await sql`delete from sponsors`;

  const volunteerIds = {};
  for (const volunteer of volunteers) {
    const [row] = await sql`
      insert into volunteers (name, email)
      values (${volunteer.name}, ${volunteer.email})
      returning id
    `;
    volunteerIds[volunteer.name] = row.id;
  }

  const sponsorIds = {};
  for (const sponsor of sponsors) {
    const [row] = await sql`
      insert into sponsors (company_name, contact_name, contact_email)
      values (${sponsor.companyName}, ${sponsor.contactName}, ${sponsor.contactEmail})
      returning id
    `;
    sponsorIds[sponsor.companyName] = row.id;
  }

  for (const event of events) {
    await sql`
      insert into events (title, location, start_time, end_time, description)
      values (${event.title}, ${event.location}, ${event.startTime}, ${event.endTime}, ${event.description})
    `;
  }

  let volunteerAssignmentCount = 0;
  let sponsorAssignmentCount = 0;

  for (const item of scheduleItems) {
    const [row] = await sql`
      insert into schedule (title, location, start_time, end_time, description, team_lead)
      values (${item.title}, ${item.location}, ${item.startTime}, ${item.endTime}, ${item.description}, ${item.teamLead})
      returning id
    `;

    for (const assignment of item.assignments ?? []) {
      await sql`
        insert into volunteer_assignments (schedule_id, volunteer_id, role, status)
        values (${row.id}, ${volunteerIds[assignment.volunteer]}, ${assignment.role}, ${assignment.status})
      `;
      volunteerAssignmentCount += 1;
    }

    for (const assignment of item.sponsorAssignments ?? []) {
      await sql`
        insert into sponsor_assignments (schedule_id, sponsor_id, role)
        values (${row.id}, ${sponsorIds[assignment.sponsor]}, ${assignment.role})
      `;
      sponsorAssignmentCount += 1;
    }
  }

  console.log(
    `Seeded ${volunteers.length} volunteers, ${sponsors.length} sponsors, ${events.length} public events, ${scheduleItems.length} schedule items, ${volunteerAssignmentCount} volunteer assignments, ${sponsorAssignmentCount} sponsor assignments.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
