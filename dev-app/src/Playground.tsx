import { useState, useEffect, useRef } from 'react';
import simpleInterview from '../interviews/simple.json';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import { convertDefinitionToResponse } from './interview.util';
import { InterviewActions, InterviewForm, InterviewAlert, InterviewProvider, InterviewSidebar, InterviewSteps, InterviewTitle, ThemeProvider } from '@imminently/interview-ui';
import * as defaultTheme from '@imminently/interview-sdk-theme-default';
import { InterviewValuesViewer } from './InterviewValuesViewer';

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

interface Step {
  id: string;
  title: string;
  show: string;
  time_estimate: number;
  layout: Layout[];
}

interface Interview {
  id: string;
  name: string;
  goal: string;
  default: boolean;
  status: string;
  steps: Step[];
  created: string;
  lastModified: string;
}

const themeOptions = [
  { label: 'No Theme', value: 'none' },
  { label: 'Default', value: 'default', theme: defaultTheme },
];

const getSafePayload = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    // Basic validation of required fields
    if (!parsed.steps || !Array.isArray(parsed.steps) || !parsed.screen) {
      throw new Error('Invalid payload structure');
    }
    return parsed;
  } catch (e) {
    return {}
  }
};

const allInterviews = [simpleInterview] as Interview[];
export const Playground = (props: any) => {
  const { setCurrentPage } = props;
  // Theme selection state
  const [themeIdx, setThemeIdx] = useState(() => {
    const stored = sessionStorage.getItem('playground-selected-theme');
    return stored ? Number(stored) : 1; // default to 'Default'
  });

  useEffect(() => {
    sessionStorage.setItem('playground-selected-theme', String(themeIdx));
  }, [themeIdx]);
  const [selectedInterview, setSelectedInterview] = useState<Interview>(() => {
    const stored = sessionStorage.getItem('selectedInterview');
    return stored ? JSON.parse(stored) : allInterviews[0];
  });

  const [selectedStep, setSelectedStep] = useState<Step | null>(() => {
    const stored = sessionStorage.getItem('selectedStep');
    return stored ? JSON.parse(stored) : null;
  });

  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(() => {
    const stored = sessionStorage.getItem('selectedLayout');
    return stored ? JSON.parse(stored) : null;
  });

  const [jsonPayload, setJsonPayload] = useState<string>(() => {
    const stored = sessionStorage.getItem('playground-jsonPayload');
    return stored || '';
  });

  const hasUserPayload = useRef(!!jsonPayload);

  useEffect(() => {
    sessionStorage.setItem('playground-jsonPayload', jsonPayload);
  }, [jsonPayload]);

  // Update session storage when selections change
  useEffect(() => {
    sessionStorage.setItem('selectedInterview', JSON.stringify(selectedInterview));
  }, [selectedInterview]);

  useEffect(() => {
    sessionStorage.setItem('selectedStep', JSON.stringify(selectedStep));
  }, [selectedStep]);

  useEffect(() => {
    sessionStorage.setItem('selectedLayout', JSON.stringify(selectedLayout));
  }, [selectedLayout]);

  // Update JSON payload when selections change
  useEffect(() => {
    if (!jsonPayload && selectedStep && selectedLayout) {
      const layoutIndex = selectedStep.layout.findIndex(l => l === selectedLayout);
      if (layoutIndex !== -1) {
        const response = convertDefinitionToResponse(selectedStep, layoutIndex);
        setJsonPayload(JSON.stringify(response, null, 2));
      }
    }
    // eslint-disable-next-line
  }, [selectedStep, selectedLayout]);

  const handleSetJsonPayload = (val: string) => {
    hasUserPayload.current = true;
    setJsonPayload(val);
  };

  const handleReset = () => {
    if (selectedStep && selectedLayout) {
      const layoutIndex = selectedStep.layout.findIndex(l => l === selectedLayout);
      if (layoutIndex !== -1) {
        const response = convertDefinitionToResponse(selectedStep, layoutIndex);
        setJsonPayload(JSON.stringify(response, null, 2));
      }
    }
  };

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(jsonPayload);
      setJsonPayload(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // If JSON is invalid, don't do anything
      console.error('Invalid JSON:', e);
    }
  };

  // Set default step if only one exists
  useEffect(() => {
    if (selectedInterview?.steps?.length === 1) {
      setSelectedStep(selectedInterview.steps[0]);
    } else if (!selectedInterview?.steps?.length) {
      setSelectedStep(null);
    }
  }, [selectedInterview]);

  // Set default layout if only one exists
  useEffect(() => {
    if (selectedStep?.layout?.length === 1) {
      setSelectedLayout(selectedStep.layout[0]);
    } else if (!selectedStep?.layout?.length) {
      setSelectedLayout(null);
    }
  }, [selectedStep]);
  const selectedThemeOption = themeOptions[themeIdx];

  return (
    <div className="flex h-screen">
      <div className="w-56 border-r bg-gray-100 p-4">
        <div className="font-bold mb-4 text-lg">Playground</div>
        <button className="rounded-md bg-blue-500 text-white px-4 py-2" onClick={() => setCurrentPage('uiBrowser')}>UI Browser</button>

        <div className="mt-8">
          <div className="font-bold mb-2">Theme</div>
          <select
            className="w-full border rounded p-1 text-sm"
            value={themeIdx}
            onChange={e => setThemeIdx(Number(e.target.value))}
          >
            {themeOptions.map((opt, idx) => (
              <option key={opt.value} value={idx}>{opt.label}</option>
            ))}
          </select>
        </div>

      </div>
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex flex-col gap-4">
          <div className="font-semibold text-lg">Config</div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <select
                className="border rounded p-1 text-sm"
                value={selectedInterview.id}
                onChange={(e) => {
                  const interview = allInterviews.find(i => i.id === e.target.value);
                  if (interview) setSelectedInterview(interview);
                }}
              >
                {allInterviews.map((interview) => (
                  <option key={interview.id} value={interview.id}>
                    {interview.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded p-1 text-sm"
                value={selectedStep?.id || ''}
                onChange={(e) => {
                  const step = selectedInterview.steps.find(s => s.id === e.target.value);
                  if (step) setSelectedStep(step);
                }}
                disabled={!selectedInterview?.steps?.length}
              >
                {selectedInterview?.steps?.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.title}
                  </option>
                ))}
              </select>

              <select
                className="border rounded p-1 text-sm"
                value={selectedLayout ? selectedStep?.layout.findIndex((l: Layout) => l === selectedLayout) : ''}
                onChange={(e) => {
                  const layoutIndex = parseInt(e.target.value);
                  if (selectedStep?.layout?.[layoutIndex]) {
                    setSelectedLayout(selectedStep.layout[layoutIndex]);
                  }
                }}
                disabled={!selectedStep?.layout?.length}
              >
                {selectedStep?.layout?.map((_: Layout, index: number) => (
                  <option key={index} value={index}>
                    Layout #{index + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={handleBeautify}
              >
                Beautify
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
            <Editor
              value={jsonPayload}
              onValueChange={handleSetJsonPayload}
              highlight={code => highlight(code, languages.json, 'json')}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                minHeight: '400px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>
        </div>
        <div className="flex flex-row w-full gap-4 p-8 overflow-auto">
          <InterviewProvider interview={getSafePayload(jsonPayload)}>
            <div className="flex-[4_4_0%] min-w-0">
              {selectedThemeOption.value === 'none' ? <Interview jsonPayload={jsonPayload} /> : (
                <ThemeProvider theme={selectedThemeOption.theme}>
                  <Interview jsonPayload={jsonPayload} />
                </ThemeProvider>
              )}
            </div>
            <div className="flex-[1_1_0%] min-w-0 max-w-xs">
              <InterviewValuesViewer />
            </div>
          </InterviewProvider>
        </div>
      </div>
    </div>
  )
};

const Interview = ({ jsonPayload }: { jsonPayload: any }) => {
  return (
    <div className="flex w-full h-full">
      <InterviewSteps steps={getSafePayload(jsonPayload).steps || []} className="w-1/5 min-w-[180px] max-w-[300px] border-r bg-gray-50 p-4 flex-shrink-0 dcsvly-interview-steps-col" />
      <div className="flex flex-col flex-1 min-w-0 max-w-[60%] h-full dcsvly-interview-main-col">
        <div className="flex-1 overflow-auto p-4 dcsvly-interview-main-scroll">
          <InterviewTitle className="text-2xl font-bold" />
          <InterviewAlert className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md shadow-sm" />
          <InterviewForm />
        </div>
        <InterviewActions className="sticky bottom-0 left-0 w-full bg-white border-t flex justify-end gap-2 p-4 z-10 dcsvly-interview-actions-bar" />
      </div>
      <InterviewSidebar className="w-1/5 min-w-[180px] max-w-[300px] border-l bg-gray-50 p-4 flex-shrink-0 dcsvly-interview-sidebar-col" />
    </div>
  )
}
