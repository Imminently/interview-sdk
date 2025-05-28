import { BooleanControl, TextControl, CurrencyControl, InterviewForm, InterviewSteps, ThemeProvider, InterviewProvider, Typography, DateControl, TimeControl, DateTimeControl } from "@imminently/interview-sdk-ui";
import React, { useState } from "react";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css'; // You can use a different Prism theme if you like
import * as defaultTheme from '@imminently/interview-sdk-theme-default';


const themeOptions = [
  { label: 'No Theme', value: 'none' },
  { label: 'Default', value: 'default', theme: defaultTheme },
];


const components = [
  {
    "category": "Controls",
    "items": [
      {
        "name": "BooleanControl",
        component: BooleanControl,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "label": "Is valid?",
            "required": true,
            "attribute": "6824275a-4401-44dd-be1b-748dc9dab367",
            "type": "boolean"
          }      
        }
      },
      {
        "name": "TextControl",
        component: TextControl,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "label": "Your name?",
            "required": true,
            "attribute": "45b7e033-b12d-4356-b4c9-00687101c1f2",
            "type": "text"
          }
        }
      },
      {
        "name": "CurrencyControl",
        component: CurrencyControl,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "label": "The amount?",
            "required": true,
            "attribute": "7339fddd-7e07-4ae0-b6f4-6bb193bcd41f",
            "type": "currency",
            "symbol": "$"
          }
        }
      },
      {
        "name": "DateControl",
        component: DateControl,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "label": "The date?",
            "required": true,
            "attribute": "52b3f115-05f2-4f1f-adfb-a01d998322f5",
            "type": "date"
          }
        }
      },{
        "name": "TimeControl",
        component: TimeControl,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "label": "The time?",
            "required": true,
            "attribute": "52b3f115-05f2-4f1f-adfb-a01d998322f5",
            "type": "time"
          }
        }
      },
      {
        "name": "DateTimeControl",
        component: DateTimeControl,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "label": "The date and time?",
            "required": true,
            "attribute": "c43d374d-dc5c-4fff-b284-fc502f7dc5bf",
            "type": "datetime"
          }
        }
      }, {
        "name": "Typography",
        component: Typography,
        defaultProps: {
          "control": {  
            "id": "bd36b532-43be-472c-8210-df8156adc6b2",
            "text": "Hello world!",
            "type": "text",
            "style": "h1"
          }
        }
      }
    ]
  },
  {
    category: "Interview",
    items: [
      {
        name: "InterviewSteps",
        component: InterviewSteps,
        defaultProps: {
          steps: [{
            "id": "0e58f58d-3320-4897-8af0-561e1c47d562",
            "title": "Step 1",
            "current": true,
            "complete": false,
            "visited": false,
            "time_estimate": 0,
            "skipped": false
          },{
            "id": "0e58f58d-3320-4897-8af0-561e1c47d562",
            "title": "Step 2",
            "current": false,
            "complete": false,
            "visited": false,
            "time_estimate": 0,
            "skipped": false
          }]
        }
      },{
        name: "InterviewForm",
        component: InterviewForm,
        defaultProps: {
          screen: {
            "title": "Step 1",
            "id": "0e58f58d-3320-4897-8af0-561e1c47d562",
            "controls": [
              {
                "id": "bd36b532-43be-472c-8210-df8156adc6b2",
                "label": "the person's age",
                "required": true,
                "attribute": "45b7e033-b12d-4356-b4c9-00687101c1f2",
                "type": "text"
              },
              {
                "id": "c8ab9301-b999-4e0f-bd19-83749906bc7a",
                "label": "the person's suburb",
                "required": true,
                "attribute": "51465dd2-9965-4169-8804-22a1f0963b64",
                "type": "text"
              }
            ]
          }
        }
      }
    ]
  }
]
const flatComponents = components.flatMap((cat: any) => cat.items);

export const UIBrowser = (props: any) => {
  const { setCurrentPage } = props;
  const [selected, setSelected] = useState(() => {
    const stored = sessionStorage.getItem('uiBrowser-selected-component');
    return stored ? Number(stored) : 0;
  });

  // Theme selection state
  const [themeIdx, setThemeIdx] = useState(() => {
    const stored = sessionStorage.getItem('uiBrowser-selected-theme');
    return stored ? Number(stored) : 1; // default to 'Default'
  });

  React.useEffect(() => {
    sessionStorage.setItem('uiBrowser-selected-theme', String(themeIdx));
  }, [themeIdx]);

  // Helper to get the session storage key for a component
  const getStorageKey = (index: number) => `uiBrowser-props-${flatComponents[index].name}`;

  // On mount or when selected changes, load from session storage or use default
  const [json, setJson] = useState(() => {
    const key = getStorageKey(
      (() => {
        const stored = sessionStorage.getItem('uiBrowser-selected-component');
        return stored ? Number(stored) : 0;
      })()
    );
    return sessionStorage.getItem(key) || JSON.stringify(flatComponents[selected].defaultProps, null, 2);
  });
  const [error, setError] = useState<string | null>(null);

   // When selected changes, load the saved props for that component (or default)
   React.useEffect(() => {
    const key = getStorageKey(selected);
    setJson(sessionStorage.getItem(key) || JSON.stringify(flatComponents[selected].defaultProps, null, 2));
    setError(null);
    sessionStorage.setItem('uiBrowser-selected-component', String(selected));
  }, [selected]);

  // Save to session storage on every change
  React.useEffect(() => {
    const key = getStorageKey(selected);
    sessionStorage.setItem(key, json);
  }, [json, selected]);

  let parsedProps: any = {};
  let isValid = true;
  try {
    parsedProps = JSON.parse(json);
    if (error) setError(null);
  } catch (e: any) {
    isValid = false;
    if (!error) setError(e.message);
  }

  const SelectedComponent = flatComponents[selected].component;
  const selectedThemeOption = themeOptions[themeIdx];

  return (
    <div className="flex h-screen">
      <div className="w-56 border-r bg-gray-100 p-4">
        <div className="font-bold mb-4 text-lg">UI Browser</div>
        <button className="rounded-md bg-blue-500 text-white px-4 py-2" onClick={() => setCurrentPage('playground')}>Playground</button>
        {components.map((cat, catIdx) => (
          <div key={cat.category} className="mb-4">
            <div className="font-bold px-2 py-1 text-xs text-gray-500 uppercase">{cat.category}</div>
            <ul>
              {cat.items.map((c, i) => {
                // Calculate the global index for selection
                const globalIdx = components
                  .slice(0, catIdx)
                  .reduce((acc, curr) => acc + curr.items.length, 0) + i;
                return (
                  <li key={c.name}>
                    <button
                      className={`w-full text-left px-2 py-1 rounded mb-1 ${
                        selected === globalIdx ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'
                      }`}
                      onClick={() => setSelected(globalIdx)}
                    >
                      {c.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
        <div className="flex items-center gap-2">
          <div className="font-semibold mb-2">Props (JSON)</div>
          <div className="flex gap-2">

            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => {
                try {
                  setJson(JSON.stringify(JSON.parse(json), null, 2));
                  setError(null);
                } catch (e: any) {
                  setError(e.message);
                }
              }}
              title="Beautify JSON"
            >
              Beautify
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                setJson(JSON.stringify(flatComponents[selected].defaultProps, null, 2));
                setError(null);
              }}
              title="Reset to default props"
            >
              Reset
            </button>
          </div>
        </div>
        <div
          className="border rounded bg-white font-mono text-sm"
          style={{ maxHeight: 400, overflow: 'auto' }}
        >
          <Editor
            value={json}
            onValueChange={code => setJson(code)}
            highlight={code =>
              Prism.highlight(code, Prism.languages.json, 'json')
            }
            padding={12}
            style={{
              fontFamily: 'monospace',
              fontSize: 14,
              outline: 'none',
              background: 'transparent',
            }}
            textareaId="json-editor"
            textareaClassName="w-full"
            preClassName="!bg-white"
          />
        </div>
        {/* Validate JSON */}
        {(() => {
          try {
            JSON.parse(json);
            if (error) setError(null);
            return null;
          } catch (e: any) {
            if (!error) setError(e.message);
            return (
              <div className="text-red-600 text-xs mt-1">
                {e.message}
              </div>
            );
          }
        })()}
        {/* Component preview */}
        <div className="border rounded p-4 mt-4">
          <div className="font-bold mb-2">
            {flatComponents[selected].name} (Live Preview)
          </div>
          {isValid ? (
            selectedThemeOption.theme ? (
              <ThemeProvider theme={selectedThemeOption.theme}>
                <InterviewProvider interview={{}}>
                  <SelectedComponent {...parsedProps} />
                </InterviewProvider>
              </ThemeProvider>
            ) : (
              <InterviewProvider interview={{}}>
                <SelectedComponent {...parsedProps} />
              </InterviewProvider>
            )
          ) : (
            <div className="text-red-600 text-sm">
              Invalid JSON. Fix above to see the component.
            </div>
          )}
        </div>
      </div>
    </div>
  )
};
