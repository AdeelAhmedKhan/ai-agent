import { env } from '../config/index.js';
import { getDbClient } from '../db/client.js';
import { AgentRepository } from '../db/repositories/agent.repository.js';
import { CallRepository } from '../db/repositories/call.repository.js';
import { CallSummaryRepository } from '../db/repositories/call-summary.repository.js';
import { EventRepository } from '../db/repositories/event.repository.js';
import { MessageRepository } from '../db/repositories/message.repository.js';
import { PatientRepository } from '../db/repositories/patient.repository.js';
import { ToolInvocationRepository } from '../db/repositories/tool-invocation.repository.js';
import { createLlmClient } from '../llm/llm.factory.js';
import { PromptManager } from '../prompts/prompt.manager.js';
import { AgentsController } from '../controllers/agents.controller.js';
import { HealthController } from '../controllers/health.controller.js';
import { IntentsController } from '../controllers/intents.controller.js';
import { PatientsController } from '../controllers/patients.controller.js';
import { VapiWebhookController } from '../controllers/vapi-webhook.controller.js';
import { AgentService } from '../services/agent.service.js';
import { CallService } from '../services/call.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { IntentService } from '../services/intent.service.js';
import { LlmService } from '../services/llm.service.js';
import { PatientService } from '../services/patient.service.js';
import { PromptService } from '../services/prompt.service.js';
import { ToolOrchestrator } from '../services/tool-orchestrator.service.js';
import { ToolService } from '../services/tool.service.js';
import { VapiWebhookService } from '../services/vapi-webhook.service.js';
import { registerAllTools } from '../tools/register-tools.js';
import { ToolExecutor } from '../tools/tool.executor.js';
import { ToolRegistry } from '../tools/tool.registry.js';

export interface AppContainer {
  llm: ReturnType<typeof createLlmClient>;
  llmService: LlmService;
  intentService: IntentService;
  conversationService: ConversationService;
  patientService: PatientService;
  promptManager: PromptManager;
  toolRegistry: ToolRegistry;
  toolExecutor: ToolExecutor;
  toolOrchestrator: ToolOrchestrator;
  healthController: HealthController;
  vapiWebhookController: VapiWebhookController;
  agentsController: AgentsController;
  intentsController: IntentsController;
  patientsController: PatientsController;
}

export function createContainer(): AppContainer {
  const db = getDbClient();

  const agentRepository = new AgentRepository(db);
  const callRepository = new CallRepository(db);
  const eventRepository = new EventRepository(db);
  const toolInvocationRepository = new ToolInvocationRepository(db);
  const messageRepository = new MessageRepository(db);
  const callSummaryRepository = new CallSummaryRepository(db);
  const patientRepository = new PatientRepository(db);

  const promptManager = new PromptManager(env.PROMPTS_DIR);
  const promptService = new PromptService(promptManager, env.PROMPTS_DIR);
  const patientService = new PatientService(patientRepository);

  const toolRegistry = new ToolRegistry();
  registerAllTools(toolRegistry, { patientService });
  const toolExecutor = new ToolExecutor(toolRegistry);
  const toolOrchestrator = new ToolOrchestrator(toolExecutor);

  const llm = createLlmClient(env);
  const llmService = new LlmService(llm);
  const intentService = new IntentService(llmService, env.INTENTS_CONFIG);

  const agentService = new AgentService(agentRepository, promptService, toolRegistry);
  const callService = new CallService(callRepository, eventRepository);
  const conversationService = new ConversationService(
    callRepository,
    messageRepository,
    toolInvocationRepository,
    callSummaryRepository,
  );
  const toolService = new ToolService(toolOrchestrator, toolInvocationRepository);
  const vapiWebhookService = new VapiWebhookService(agentService, callService, toolService);

  return {
    llm,
    llmService,
    intentService,
    conversationService,
    patientService,
    promptManager,
    toolRegistry,
    toolExecutor,
    toolOrchestrator,
    healthController: new HealthController(),
    vapiWebhookController: new VapiWebhookController(vapiWebhookService),
    agentsController: new AgentsController(agentService),
    intentsController: new IntentsController(intentService),
    patientsController: new PatientsController(patientService),
  };
}
