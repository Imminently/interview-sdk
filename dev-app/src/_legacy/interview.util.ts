import { v4 as uuidv4 } from 'uuid';

interface Control {
  id: string;
  label: string;
  required: boolean;
  attribute: string;
  type: string;
}

interface Layout {
  controls: Control[];
  attributes: never[];
}

interface StepDefinition {
  title: string;
  id: string;
  show: string;
  time_estimate: number;
  layout: Layout[];
}

interface InterviewResponse {
  context: {
    entity: string;
  };
  data: Record<string, { type: string }>;
  reportId: string;
  validations: any[];
  steps: {
    id: string;
    title: string;
    context: {
      entity: string;
    };
    current: boolean;
    complete: boolean;
    visited: boolean;
    time_estimate: number;
    skipped: boolean;
  }[];
  screen: {
    title: string;
    id: string;
    controls: Control[];
    attributes: string[];
    allAttributes: string[];
    type: string;
    buttons: {
      next: boolean;
      back: boolean;
    };
  };
  state: any[];
  progress: {
    percentage: number;
    time: number;
  };
  sessionId: string;
  interactionId: string;
  status: string;
  interviewId: string;
  explanations: Record<string, any>;
  model: string;
  release: string;
  locale: string;
  goal: string;
  timing: {
    total: number;
    preData: number;
    data: number;
    logic: number;
  };
}

export const convertDefinitionToResponse = (def: StepDefinition, layoutIndex: number): InterviewResponse => {
  // Generate new UUIDs for attributes
  const attributeMap = new Map<string, string>();
  def.layout[layoutIndex].controls.forEach(control => {
    attributeMap.set(control.attribute, uuidv4());
  });

  // Create data object with auto type for each attribute
  const data: Record<string, { type: string }> = {};
  attributeMap.forEach((newId) => {
    data[newId] = { type: 'auto' };
  });

  // Transform controls to use new attribute IDs
  const transformedControls = def.layout[layoutIndex].controls.map(control => ({
    ...control,
    attribute: attributeMap.get(control.attribute) || control.attribute
  }));

  // Get all attribute IDs
  const attributeIds = Array.from(attributeMap.values());

  return {
    context: {
      entity: 'global'
    },
    data,
    reportId: uuidv4(),
    validations: [],
    steps: [{
      id: def.id,
      title: def.title,
      context: {
        entity: 'global'
      },
      current: true,
      complete: false,
      visited: false,
      time_estimate: def.time_estimate,
      skipped: false
    }],
    screen: {
      title: def.title,
      id: def.id,
      controls: transformedControls,
      attributes: attributeIds,
      allAttributes: attributeIds,
      type: 'interview',
      buttons: {
        next: true,
        back: false
      }
    },
    state: [],
    progress: {
      percentage: 0,
      time: 15
    },
    sessionId: uuidv4(),
    interactionId: uuidv4(),
    status: 'in-progress',
    interviewId: uuidv4(),
    explanations: {},
    model: uuidv4(),
    release: uuidv4(),
    locale: 'en-au',
    goal: uuidv4(),
    timing: {
      total: 0,
      preData: 0,
      data: 0,
      logic: 0
    }
  };
};