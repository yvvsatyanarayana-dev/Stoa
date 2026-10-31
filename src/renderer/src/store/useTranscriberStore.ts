import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  MeetingTranscription,
  ActionItem,
  AgendaItem,
  TranscriptionStatus,
  TranscriptSegment
} from '../types/transcriber'

interface TranscriberStore {
  meetings: MeetingTranscription[]
  activeMeetingId: string | null
  recordingStatus: TranscriptionStatus
  liveTranscriptBuffer: TranscriptSegment[]

  selectMeeting: (id: string) => void
  addActionItem: (meetingId: string, item: ActionItem) => void
  updateActionItem: (id: string, partial: Partial<ActionItem>) => void
  updateAgendaItem: (meetingId: string, itemId: string, partial: Partial<AgendaItem>) => void
  startRecording: () => void
  stopRecording: () => void
  deleteMeeting: (id: string) => void
}

const MEETINGS: MeetingTranscription[] = [
  // ──────────────────────────────────────────────────────
  // Meeting 1 — Q4 Product Roadmap Review
  // ──────────────────────────────────────────────────────
  {
    id: 'mtg-001',
    title: 'Q4 Product Roadmap Review',
    date: '2026-10-28',
    startTime: '10:00',
    endTime: '10:45',
    duration: 2700,
    status: 'complete',
    sentiment: 'positive',
    wordCount: 4820,
    aiModel: 'Gemini 1.5 Pro',
    summary:
      'The Q4 roadmap review covered three major initiatives: the real-time collaboration layer, the new onboarding flow redesign, and the mobile parity sprint. Leadership aligned on shipping the collaboration beta by November 14th, with a hard freeze on non-critical features after November 7th. Design signed off on the revised onboarding wireframes pending one round of user testing. The mobile team confirmed feature parity with the web client by end of Q4 is achievable with current resourcing. Overall tone was optimistic with clear ownership established for each workstream.',
    keyDecisions: [
      'Collaboration beta ships November 14th — Aisha Khan is DRI',
      'Feature freeze for non-critical work: November 7th',
      'Onboarding redesign proceeds to user testing with Rachel Cole as lead',
      'Mobile parity target confirmed for December 20th',
    ],
    speakers: [
      { id: 'spk-101', name: 'Marcus Webb', role: 'host', color: '#666', wordCount: 1540, talkTimeSeconds: 810 },
      { id: 'spk-102', name: 'Aisha Khan', role: 'participant', color: '#888', wordCount: 1280, talkTimeSeconds: 670 },
      { id: 'spk-103', name: 'Devon Priestly', role: 'participant', color: '#aaa', wordCount: 1020, talkTimeSeconds: 540 },
      { id: 'spk-104', name: 'Rachel Cole', role: 'guest', color: '#ccc', wordCount: 980, talkTimeSeconds: 490 },
    ],
    segments: [
      {
        id: 'seg-101', speakerId: 'spk-101', startSeconds: 0, endSeconds: 72,
        text: "Good morning everyone. Let's get straight into it — I want to cover the three major Q4 initiatives today and leave time for questions. First up is the real-time collaboration layer.",
        confidence: 0.97, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-102', speakerId: 'spk-102', startSeconds: 75, endSeconds: 198,
        text: "Thanks Marcus. So the collaboration layer is tracking well. We've completed the presence indicators and the conflict-resolution engine. The remaining work is the UI polish and load testing at scale. I'm confident we can hit November 14th if we freeze non-essential PRs by the 7th.",
        confidence: 0.95, isKeyMoment: true, tags: ['decision', 'action'],
      },
      {
        id: 'seg-103', speakerId: 'spk-101', startSeconds: 200, endSeconds: 260,
        text: "That's great to hear. Let's make the November 7th feature freeze official then. Everyone in agreement?",
        confidence: 0.98, isKeyMoment: true, tags: ['decision'],
      },
      {
        id: 'seg-104', speakerId: 'spk-103', startSeconds: 265, endSeconds: 370,
        text: "Agreed from the infrastructure side. We'll need to scale the WebSocket cluster before the beta. I'll coordinate with DevOps this week. One concern — our current Redis setup might become a bottleneck above 2,000 concurrent sessions.",
        confidence: 0.93, isKeyMoment: false, tags: ['blocker', 'action'],
      },
      {
        id: 'seg-105', speakerId: 'spk-102', startSeconds: 373, endSeconds: 440,
        text: "Good flag Devon. Let's add a Redis cluster upgrade to the pre-beta checklist. I'll own that coordination with you.",
        confidence: 0.96, isKeyMoment: false, tags: ['action'],
      },
      {
        id: 'seg-106', speakerId: 'spk-101', startSeconds: 445, endSeconds: 560,
        text: "Perfect. Moving on to the onboarding redesign. Rachel, you want to walk us through where design is?",
        confidence: 0.97, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-107', speakerId: 'spk-104', startSeconds: 563, endSeconds: 720,
        text: "Sure. We've finalized the wireframes for the new five-step onboarding flow. The biggest change is moving the workspace setup to step two instead of step four — we saw a 34% drop-off at the old position. I need one more round of user testing before we hand off to engineering, probably next Tuesday.",
        confidence: 0.94, isKeyMoment: true, tags: ['decision', 'action'],
      },
      {
        id: 'seg-108', speakerId: 'spk-103', startSeconds: 722, endSeconds: 800,
        text: "Rachel, once you hand off wireframes, how long do you estimate for engineering implementation? We need to plan sprint allocation.",
        confidence: 0.96, isKeyMoment: false, tags: ['question'],
      },
      {
        id: 'seg-109', speakerId: 'spk-104', startSeconds: 803, endSeconds: 900,
        text: "Based on the scope, I'd estimate two sprints — about four weeks. We can parallelize the backend changes with the frontend work to save time.",
        confidence: 0.92, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-110', speakerId: 'spk-101', startSeconds: 903, endSeconds: 1050,
        text: "Good. Let's pencil in the engineering kickoff for November 12th assuming user testing wraps on schedule. Now — mobile parity. Devon, the team is saying December 20th is achievable. What's the biggest risk to that timeline?",
        confidence: 0.95, isKeyMoment: false, tags: ['question'],
      },
      {
        id: 'seg-111', speakerId: 'spk-103', startSeconds: 1053, endSeconds: 1200,
        text: "The biggest risk is the offline sync feature — it's technically complex and hasn't been scoped for mobile yet. If we de-scope offline sync from the parity milestone, December 20th is solid. If we keep it in, we're probably looking at January 10th.",
        confidence: 0.91, isKeyMoment: true, tags: ['blocker', 'decision'],
      },
      {
        id: 'seg-112', speakerId: 'spk-101', startSeconds: 1203, endSeconds: 1380,
        text: "Let's de-scope offline sync for the parity milestone and track it separately in Q1. That protects the December 20th date. Alright — I think we have clear alignment. Aisha on collaboration, Rachel on onboarding, Devon on mobile. Let's reconvene in two weeks for a progress check. Thanks everyone.",
        confidence: 0.97, isKeyMoment: true, tags: ['decision'],
      },
    ],
    actionItems: [
      {
        id: 'ai-101', meetingId: 'mtg-001', text: 'Scale WebSocket cluster and upgrade Redis setup before collaboration beta', assignee: 'Devon Priestly',
        dueDate: '2026-11-05', priority: 'high', status: 'in-progress', extractedAt: '2026-10-28T10:20:00Z', confidence: 0.94,
      },
      {
        id: 'ai-102', meetingId: 'mtg-001', text: 'Conduct final round of user testing on onboarding wireframes', assignee: 'Rachel Cole',
        dueDate: '2026-11-04', priority: 'high', status: 'pending', extractedAt: '2026-10-28T10:25:00Z', confidence: 0.92,
      },
      {
        id: 'ai-103', meetingId: 'mtg-001', text: 'Enforce feature freeze for non-critical PRs starting November 7th', assignee: 'Aisha Khan',
        dueDate: '2026-11-07', priority: 'high', status: 'pending', extractedAt: '2026-10-28T10:10:00Z', confidence: 0.98,
      },
      {
        id: 'ai-104', meetingId: 'mtg-001', text: 'Schedule engineering kickoff for onboarding redesign on November 12th', assignee: 'Marcus Webb',
        dueDate: '2026-11-12', priority: 'medium', status: 'pending', extractedAt: '2026-10-28T10:30:00Z', confidence: 0.88,
      },
      {
        id: 'ai-105', meetingId: 'mtg-001', text: 'Create Q1 backlog ticket for mobile offline sync feature', assignee: 'Devon Priestly',
        dueDate: '2026-11-01', priority: 'low', status: 'done', extractedAt: '2026-10-28T10:40:00Z', confidence: 0.85,
      },
    ],
    agenda: [
      { id: 'ag-101', title: 'Real-time Collaboration Layer Status', durationMinutes: 12, order: 1, status: 'complete', notes: 'Beta on track for Nov 14. Feature freeze Nov 7 confirmed.' },
      { id: 'ag-102', title: 'Onboarding Redesign Review', durationMinutes: 10, order: 2, status: 'complete', notes: 'Wireframes approved. User testing next Tuesday. Engineering kickoff Nov 12.' },
      { id: 'ag-103', title: 'Mobile Parity Sprint Planning', durationMinutes: 15, order: 3, status: 'complete', notes: 'Offline sync de-scoped to Q1. Dec 20 target confirmed.' },
      { id: 'ag-104', title: 'Q&A and Open Discussion', durationMinutes: 8, order: 4, status: 'complete', notes: 'No blocking issues raised. Follow-up in 2 weeks.' },
    ],
  },

  // ──────────────────────────────────────────────────────
  // Meeting 2 — Infrastructure Cost Optimization
  // ──────────────────────────────────────────────────────
  {
    id: 'mtg-002',
    title: 'Infrastructure Cost Optimization',
    date: '2026-10-29',
    startTime: '14:00',
    endTime: '14:30',
    duration: 1800,
    status: 'complete',
    sentiment: 'neutral',
    wordCount: 2940,
    aiModel: 'Gemini 1.5 Flash',
    summary:
      'The infrastructure team reviewed the October cloud spend which came in at $48,200 — 18% over the Q4 budget target. Three primary cost drivers were identified: over-provisioned compute in staging environments, underutilized reserved instances that were not being applied correctly, and egress charges from the CDN misconfiguration. Action items were assigned to address each driver with a target of reducing monthly spend by $12,000 by end of November. The team also discussed a potential migration path to spot instances for non-critical batch workloads.',
    keyDecisions: [
      'Reduce staging compute by 40% via instance right-sizing by November 1st',
      'Fix CDN cache-control headers to eliminate redundant egress — estimated \$4,200/month saving',
      'Migrate batch processing jobs to spot instances starting November 15th',
    ],
    speakers: [
      { id: 'spk-201', name: 'Devon Priestly', role: 'host', color: '#666', wordCount: 1100, talkTimeSeconds: 580 },
      { id: 'spk-202', name: 'Yuki Tanaka', role: 'participant', color: '#888', wordCount: 980, talkTimeSeconds: 510 },
      { id: 'spk-203', name: 'Lena Hoffmann', role: 'participant', color: '#aaa', wordCount: 860, talkTimeSeconds: 440 },
    ],
    segments: [
      {
        id: 'seg-201', speakerId: 'spk-201', startSeconds: 0, endSeconds: 85,
        text: "Alright, let's dig into the October numbers. We came in at $48,200 — that's $7,300 over target. I've broken it into three buckets: compute, reserved instance misalignment, and egress.",
        confidence: 0.96, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-202', speakerId: 'spk-202', startSeconds: 88, endSeconds: 210,
        text: "On the compute side, our staging clusters are running at 60% of production specs. We haven't needed that since the load testing campaign in August. I can right-size those instances by Friday — that alone saves us about $3,800 a month.",
        confidence: 0.94, isKeyMoment: true, tags: ['action', 'decision'],
      },
      {
        id: 'seg-203', speakerId: 'spk-203', startSeconds: 213, endSeconds: 350,
        text: "The reserved instance issue is a billing alignment problem. We purchased reservations for us-east-1 but two of our main workloads shifted to us-west-2 last quarter. Those reservations aren't being applied, so we're paying on-demand rates. I'll open a case with AWS to reassign them.",
        confidence: 0.91, isKeyMoment: true, tags: ['blocker', 'action'],
      },
      {
        id: 'seg-204', speakerId: 'spk-201', startSeconds: 353, endSeconds: 480,
        text: "Good catch Lena. What's the estimated monthly delta from that fix?",
        confidence: 0.97, isKeyMoment: false, tags: ['question'],
      },
      {
        id: 'seg-205', speakerId: 'spk-203', startSeconds: 483, endSeconds: 580,
        text: "Roughly $4,000 per month once the reservations are applied correctly. Could take up to two weeks for AWS to process the reassignment.",
        confidence: 0.93, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-206', speakerId: 'spk-202', startSeconds: 583, endSeconds: 720,
        text: "On egress — we found that the CDN is not caching API responses correctly. Cache-control headers are misconfigured and causing a lot of origin hits. Fixing that should cut egress by around $4,200 a month. That's a one-line config change.",
        confidence: 0.95, isKeyMoment: true, tags: ['decision', 'action'],
      },
      {
        id: 'seg-207', speakerId: 'spk-201', startSeconds: 723, endSeconds: 900,
        text: "I want to also flag the batch processing workloads. Those jobs run overnight and don't need guaranteed uptime. If we move them to spot instances, we're looking at 70% cost reduction on that compute. The risk is interruption — but our jobs are already designed to be resumable.",
        confidence: 0.92, isKeyMoment: true, tags: ['decision'],
      },
      {
        id: 'seg-208', speakerId: 'spk-202', startSeconds: 903, endSeconds: 1050,
        text: "Spot migration makes sense. I'd suggest we start with the data pipeline jobs — those are the most compute-heavy and already have checkpoint logic. We can expand from there once we've validated the interruption handling. Let's target November 15th for the pilot.",
        confidence: 0.94, isKeyMoment: true, tags: ['action', 'decision'],
      },
    ],
    actionItems: [
      {
        id: 'ai-201', meetingId: 'mtg-002', text: 'Right-size staging cluster instances to reduce over-provisioned compute', assignee: 'Yuki Tanaka',
        dueDate: '2026-11-01', priority: 'high', status: 'in-progress', extractedAt: '2026-10-29T14:08:00Z', confidence: 0.95,
      },
      {
        id: 'ai-202', meetingId: 'mtg-002', text: 'Open AWS support case to reassign reserved instances from us-east-1 to us-west-2', assignee: 'Lena Hoffmann',
        dueDate: '2026-10-31', priority: 'high', status: 'done', extractedAt: '2026-10-29T14:15:00Z', confidence: 0.93,
      },
      {
        id: 'ai-203', meetingId: 'mtg-002', text: 'Fix CDN cache-control headers to prevent unnecessary origin egress', assignee: 'Yuki Tanaka',
        dueDate: '2026-11-01', priority: 'high', status: 'pending', extractedAt: '2026-10-29T14:20:00Z', confidence: 0.96,
      },
      {
        id: 'ai-204', meetingId: 'mtg-002', text: 'Pilot batch data pipeline jobs on spot instances and validate interruption handling', assignee: 'Devon Priestly',
        dueDate: '2026-11-15', priority: 'medium', status: 'pending', extractedAt: '2026-10-29T14:25:00Z', confidence: 0.90,
      },
    ],
    agenda: [
      { id: 'ag-201', title: 'October Cloud Spend Review', durationMinutes: 8, order: 1, status: 'complete', notes: '$48,200 spend — $7,300 over budget. Three root causes identified.' },
      { id: 'ag-202', title: 'Compute Right-Sizing Plan', durationMinutes: 8, order: 2, status: 'complete', notes: 'Staging instances reduced 40%. Yuki to complete by Nov 1.' },
      { id: 'ag-203', title: 'Spot Instance Migration', durationMinutes: 10, order: 3, status: 'complete', notes: 'Pilot with data pipeline jobs. Target: Nov 15. 70% cost reduction expected.' },
    ],
  },

  // ──────────────────────────────────────────────────────
  // Meeting 3 — Team Retrospective Sprint 22
  // ──────────────────────────────────────────────────────
  {
    id: 'mtg-003',
    title: 'Team Retrospective — Sprint 22',
    date: '2026-10-30',
    startTime: '16:00',
    endTime: '17:00',
    duration: 3600,
    status: 'complete',
    sentiment: 'mixed',
    wordCount: 6350,
    aiModel: 'Gemini 1.5 Pro',
    summary:
      'Sprint 22 retrospective covered what went well, what needs improvement, and team health. The team celebrated the successful delivery of the notification system overhaul ahead of schedule. Key frustrations centered on unclear acceptance criteria causing rework in two feature tickets, and communication gaps between the backend and frontend teams during the WebSocket integration. The team also surfaced concerns about sprint load — several members felt the story-point ceiling was too high. Action items focused on improving ticket quality at sprint planning and establishing a daily async standup channel for cross-team updates. Overall team morale was described as moderate with pockets of burnout flagged.',
    keyDecisions: [
      'All feature tickets must include acceptance criteria before sprint planning sign-off',
      'Create #sprint-sync Slack channel for daily async cross-team updates',
      'Reduce sprint story-point ceiling from 42 to 36 for Sprint 23',
      'Hold a dedicated backlog refinement session every second Thursday',
    ],
    speakers: [
      { id: 'spk-301', name: 'Priya Nair', role: 'host', color: '#666', wordCount: 1600, talkTimeSeconds: 840 },
      { id: 'spk-302', name: 'Marcus Webb', role: 'participant', color: '#888', wordCount: 1250, talkTimeSeconds: 650 },
      { id: 'spk-303', name: 'Tomás Reyes', role: 'participant', color: '#aaa', wordCount: 1100, talkTimeSeconds: 570 },
      { id: 'spk-304', name: 'Aisha Khan', role: 'participant', color: '#ccc', wordCount: 1200, talkTimeSeconds: 620 },
      { id: 'spk-305', name: 'Sam Okafor', role: 'participant', color: '#888', wordCount: 1200, talkTimeSeconds: 630 },
    ],
    segments: [
      {
        id: 'seg-301', speakerId: 'spk-301', startSeconds: 0, endSeconds: 90,
        text: "Welcome everyone to the Sprint 22 retro. We'll follow the usual format — what went well, what didn't, and what we're changing. Let's start positive. What's a win from this sprint?",
        confidence: 0.97, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-302', speakerId: 'spk-303', startSeconds: 93, endSeconds: 200,
        text: "The notification overhaul shipped two days early. That was a team effort — Marcus unblocked the API contract issue early in the sprint, which gave us the time we needed. Really appreciated that.",
        confidence: 0.95, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-303', speakerId: 'spk-302', startSeconds: 203, endSeconds: 320,
        text: "Happy to help. I want to raise the flip side though. The WebSocket integration in ticket CHRON-847 was a pain point. The acceptance criteria were vague — I thought we were building a unidirectional push, the frontend team expected bidirectional. We lost three days to rework.",
        confidence: 0.93, isKeyMoment: true, tags: ['blocker'],
      },
      {
        id: 'seg-304', speakerId: 'spk-304', startSeconds: 323, endSeconds: 460,
        text: "Yeah, I want to second that. The criteria issue wasn't isolated to CHRON-847. Two other tickets had the same problem this sprint. I think we need a hard rule: no ticket enters the sprint without explicit, testable acceptance criteria. Period.",
        confidence: 0.94, isKeyMoment: true, tags: ['decision', 'action'],
      },
      {
        id: 'seg-305', speakerId: 'spk-301', startSeconds: 463, endSeconds: 550,
        text: "Agreed. Let's make that a team norm starting Sprint 23. I'll update the sprint planning checklist today. If a ticket doesn't have AC, it doesn't get pulled into sprint.",
        confidence: 0.96, isKeyMoment: true, tags: ['decision', 'action'],
      },
      {
        id: 'seg-306', speakerId: 'spk-305', startSeconds: 553, endSeconds: 680,
        text: "On the communication front — the backend-frontend gap isn't just about tickets. We don't have a good async channel for daily cross-team updates. I end up pinging people in DMs to unblock myself. That doesn't scale.",
        confidence: 0.92, isKeyMoment: false, tags: ['question', 'blocker'],
      },
      {
        id: 'seg-307', speakerId: 'spk-304', startSeconds: 683, endSeconds: 780,
        text: "What if we create a dedicated Slack channel — something like #sprint-sync — where everyone posts a two-line update by 10am? No threads, no replies, just signal. Low overhead.",
        confidence: 0.95, isKeyMoment: true, tags: ['action', 'decision'],
      },
      {
        id: 'seg-308', speakerId: 'spk-302', startSeconds: 783, endSeconds: 860,
        text: "I like that. Simple, low-friction. I'd add that Priya should pin a weekly summary so it's easy to catch up after time off.",
        confidence: 0.93, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-309', speakerId: 'spk-301', startSeconds: 863, endSeconds: 980,
        text: "Done. I'll set up #sprint-sync today. Now I want to address something more sensitive. A few people flagged in the pre-retro survey that they're feeling overloaded. Sprint 22 had 42 story points with a team of five. That's high.",
        confidence: 0.94, isKeyMoment: true, tags: [],
      },
      {
        id: 'seg-310', speakerId: 'spk-303', startSeconds: 983, endSeconds: 1100,
        text: "Honestly yes. I was working late three days this sprint to hit targets. It's not sustainable. I'd feel more comfortable with a ceiling of 36 points for the current team size.",
        confidence: 0.91, isKeyMoment: true, tags: ['blocker'],
      },
      {
        id: 'seg-311', speakerId: 'spk-305', startSeconds: 1103, endSeconds: 1220,
        text: "36 sounds right. And if we have capacity left at mid-sprint, we can pull from the icebox. That way we're not over-committing upfront but still have flexibility.",
        confidence: 0.93, isKeyMoment: false, tags: ['decision'],
      },
      {
        id: 'seg-312', speakerId: 'spk-304', startSeconds: 1223, endSeconds: 1380,
        text: "I also want us to have a proper backlog refinement session every two weeks. Right now, tickets show up at sprint planning half-baked. If we refine on the second Thursday of every fortnight, we come to planning with a ready queue.",
        confidence: 0.94, isKeyMoment: true, tags: ['action', 'decision'],
      },
      {
        id: 'seg-313', speakerId: 'spk-301', startSeconds: 1383, endSeconds: 1520,
        text: "Backlog refinement every second Thursday — added to the calendar now. Alright, let's wrap up. We've got four solid commitments: AC required in tickets, #sprint-sync channel, 36-point ceiling, and bi-weekly refinement. Any final concerns?",
        confidence: 0.97, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-314', speakerId: 'spk-302', startSeconds: 1523, endSeconds: 1620,
        text: "Just want to say — I appreciate that we talk about this stuff openly. A lot of teams don't, and it festers. This is why Sprint 23 will be better.",
        confidence: 0.96, isKeyMoment: false, tags: [],
      },
      {
        id: 'seg-315', speakerId: 'spk-301', startSeconds: 1623, endSeconds: 1720,
        text: "Well said Marcus. Thanks everyone — see you at Sprint 23 planning on Monday.",
        confidence: 0.98, isKeyMoment: false, tags: [],
      },
    ],
    actionItems: [
      {
        id: 'ai-301', meetingId: 'mtg-003', text: 'Update sprint planning checklist: require testable acceptance criteria on all tickets', assignee: 'Priya Nair',
        dueDate: '2026-10-31', priority: 'high', status: 'done', extractedAt: '2026-10-30T16:28:00Z', confidence: 0.97,
      },
      {
        id: 'ai-302', meetingId: 'mtg-003', text: 'Create #sprint-sync Slack channel and pin the daily update format', assignee: 'Priya Nair',
        dueDate: '2026-10-30', priority: 'high', status: 'done', extractedAt: '2026-10-30T16:35:00Z', confidence: 0.95,
      },
      {
        id: 'ai-303', meetingId: 'mtg-003', text: 'Cap Sprint 23 story points at 36 and document revised ceiling in team handbook', assignee: 'Marcus Webb',
        dueDate: '2026-11-03', priority: 'medium', status: 'pending', extractedAt: '2026-10-30T16:45:00Z', confidence: 0.92,
      },
      {
        id: 'ai-304', meetingId: 'mtg-003', text: 'Schedule recurring bi-weekly backlog refinement session every second Thursday', assignee: 'Priya Nair',
        dueDate: '2026-10-31', priority: 'medium', status: 'in-progress', extractedAt: '2026-10-30T16:50:00Z', confidence: 0.93,
      },
      {
        id: 'ai-305', meetingId: 'mtg-003', text: 'Write post-mortem for CHRON-847 WebSocket integration rework and share with team', assignee: 'Tomás Reyes',
        dueDate: '2026-11-04', priority: 'medium', status: 'pending', extractedAt: '2026-10-30T16:55:00Z', confidence: 0.89,
      },
      {
        id: 'ai-306', meetingId: 'mtg-003', text: 'Send optional team pulse survey to assess burnout levels before Sprint 23', assignee: 'Priya Nair',
        dueDate: '2026-11-01', priority: 'low', status: 'pending', extractedAt: '2026-10-30T17:00:00Z', confidence: 0.86,
      },
    ],
    agenda: [
      { id: 'ag-301', title: 'Sprint 22 Wins & Celebrations', durationMinutes: 10, order: 1, status: 'complete', notes: 'Notification system shipped 2 days early. Team morale positive on delivery.' },
      { id: 'ag-302', title: 'What Went Wrong — Blockers & Friction', durationMinutes: 15, order: 2, status: 'complete', notes: 'Vague AC on 3 tickets caused rework. Backend-frontend comms gap identified.' },
      { id: 'ag-303', title: 'Team Health & Capacity Discussion', durationMinutes: 15, order: 3, status: 'complete', notes: 'Sprint load too high at 42pts. Ceiling reduced to 36 for Sprint 23.' },
      { id: 'ag-304', title: 'Process Improvements for Sprint 23', durationMinutes: 15, order: 4, status: 'complete', notes: 'AC requirement, #sprint-sync channel, bi-weekly refinement sessions agreed.' },
      { id: 'ag-305', title: 'Action Item Review & Close', durationMinutes: 5, order: 5, status: 'complete', notes: '6 action items assigned. Follow-up at Sprint 23 planning Monday.' },
    ],
  },
]

export const useTranscriberStore = create<TranscriberStore>()(
  persist(
    (set) => ({
      meetings: MEETINGS,
      activeMeetingId: null,
      recordingStatus: 'idle' as TranscriptionStatus,
      liveTranscriptBuffer: [],

      selectMeeting: (id) => set({ activeMeetingId: id }),

      addActionItem: (meetingId, item) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId ? { ...m, actionItems: [...m.actionItems, item] } : m
          ),
        })),

      updateActionItem: (id, partial) =>
        set((state) => ({
          meetings: state.meetings.map((m) => ({
            ...m,
            actionItems: m.actionItems.map((ai) =>
              ai.id === id ? { ...ai, ...partial } : ai
            ),
          })),
        })),

      updateAgendaItem: (meetingId, itemId, partial) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  agenda: m.agenda.map((ag) =>
                    ag.id === itemId ? { ...ag, ...partial } : ag
                  ),
                }
              : m
          ),
        })),

      startRecording: () =>
        set({ recordingStatus: 'recording', liveTranscriptBuffer: [] }),

      stopRecording: () =>
        set({ recordingStatus: 'idle', liveTranscriptBuffer: [] }),

      deleteMeeting: (id) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
          activeMeetingId: state.activeMeetingId === id ? null : state.activeMeetingId,
        })),
    }),
    {
      name: 'transcriber-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
