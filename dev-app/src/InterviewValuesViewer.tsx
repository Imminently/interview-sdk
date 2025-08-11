import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import { useInterview } from "@imminently/interview-ui";

export const InterviewValuesViewer = () => {
  const { values, fields, errors } = useInterview();
  return (
    <div>
      <h3>Values</h3>
      <Editor
        value={JSON.stringify(values, null, 2)}
        onValueChange={() => {}}
        highlight={code => highlight(code, languages.json, "json")}
        padding={10}
        readOnly
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 14,
        minHeight: "300px",
        backgroundColor: "#f8f9fa",
        pointerEvents: "none",
      }}
    />
    <h3>Errors</h3>
      <Editor
        value={JSON.stringify(errors, null, 2)}
        onValueChange={() => {}}
        highlight={code => highlight(code, languages.json, "json")}
        padding={10}
        readOnly
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 14,
        minHeight: "300px",
        backgroundColor: "#f8f9fa",
        pointerEvents: "none",
      }}
    />
    <h3>Fields</h3>
      <Editor
        value={JSON.stringify(fields, null, 2)}
        onValueChange={() => {}}
        highlight={code => highlight(code, languages.json, "json")}
        padding={10}
        readOnly
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 14,
        minHeight: "300px",
        backgroundColor: "#f8f9fa",
        pointerEvents: "none",
      }}
    />
    </div>
    
  );
};