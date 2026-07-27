import type { IToolHandler } from '../tool.interface.js';
import { CancelAppointmentTool } from './cancel-appointment.tool.js';
import { CreateTicketTool } from './create-ticket.tool.js';
import { GetBusinessHoursTool } from './get-business-hours.tool.js';
import { LookupKnowledgeTool } from './lookup-knowledge.tool.js';
import { SaveLeadTool } from './save-lead.tool.js';
import { ScheduleAppointmentTool } from './schedule-appointment.tool.js';
import { TransferToHumanTool } from './transfer-to-human.tool.js';

/** Placeholder business tools — mocked responses only, no external APIs. */
export const businessTools: IToolHandler[] = [
  new GetBusinessHoursTool(),
  new LookupKnowledgeTool(),
  new CreateTicketTool(),
  new ScheduleAppointmentTool(),
  new CancelAppointmentTool(),
  new TransferToHumanTool(),
  new SaveLeadTool(),
];
