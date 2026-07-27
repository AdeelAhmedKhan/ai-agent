import type { Request, Response } from 'express';
import type { AgentService } from '../services/agent.service.js';
import type { CreateAgentInput, UpdateAgentInput } from '../types/agent.js';

export class AgentsController {
  constructor(private readonly agents: AgentService) {}

  async list(req: Request, res: Response): Promise<void> {
    const includeInactive = req.query.includeInactive === 'true';
    const agents = await this.agents.list(includeInactive);
    res.status(200).json({ data: agents });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const agent = await this.agents.getById(req.params.id as string);
    res.status(200).json({ data: agent });
  }

  async create(req: Request, res: Response): Promise<void> {
    const agent = await this.agents.create(req.body as CreateAgentInput);
    res.status(201).json({ data: agent });
  }

  async update(req: Request, res: Response): Promise<void> {
    const agent = await this.agents.update(req.params.id as string, req.body as UpdateAgentInput);
    res.status(200).json({ data: agent });
  }
}
