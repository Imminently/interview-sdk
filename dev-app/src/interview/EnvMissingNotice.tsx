import { missingDeciEnvKeys } from "../config/env";

/** Shown when `dev-app/.env` is missing one of the required `VITE_DECI_*` values. */
export const EnvMissingNotice = () => (
  <div style={{ padding: 24, maxWidth: 640, fontFamily: "system-ui, sans-serif" }}>
    <h2>Missing dev-app configuration</h2>
    <p>
      The dev-app needs a <code>dev-app/.env</code> file pointing it at a Decisively
      environment. The following {missingDeciEnvKeys.length === 1 ? "value is" : "values are"}{" "}
      not set:
    </p>
    <ul>
      {missingDeciEnvKeys.map((key) => (
        <li key={key}>
          <code>{key}</code>
        </li>
      ))}
    </ul>
    <p>To fix:</p>
    <ol>
      <li>
        Create <code>dev-app/.env</code> with the keys above. See{" "}
        <code>dev-app/README.md</code> for the template and details.
      </li>
      <li>
        A working dev host / token / tenancy already live in the repo-root{" "}
        <code>.env.test</code> (<code>TEST_API_HOST</code>,{" "}
        <code>TEST_API_TOKEN</code>, <code>TEST_API_TENANCY</code>).
      </li>
      <li>Restart the dev server.</li>
    </ol>
  </div>
);
