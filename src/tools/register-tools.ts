import type { PatientService } from '../services/patient.service.js';
import { EchoTool } from './builtins/echo.tool.js';
import { HealthTool } from './builtins/health.tool.js';
import { businessTools } from './business/index.js';
import { createPatientTools } from './patients/index.js';
import type { ToolRegistry } from './tool.registry.js';

export interface RegisterToolsDeps {
  patientService?: PatientService;
}

export function registerBuiltinTools(registry: ToolRegistry): void {
  registry.registerMany([new EchoTool(), new HealthTool()]);
}

export function registerBusinessTools(registry: ToolRegistry): void {
  registry.registerMany(businessTools);
}

export function registerPatientTools(
  registry: ToolRegistry,
  patientService: PatientService,
): void {
  registry.registerMany(createPatientTools(patientService));
}

export function registerAllTools(
  registry: ToolRegistry,
  deps: RegisterToolsDeps = {},
): void {
  registerBuiltinTools(registry);
  registerBusinessTools(registry);
  if (deps.patientService) {
    registerPatientTools(registry, deps.patientService);
  }
}
