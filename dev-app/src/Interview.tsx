import { ApiManager, AttributeValues, AuthConfig, ManagerOptions, Session, Simulate } from "@imminently/interview-sdk";
import { Interview } from "@imminently/interview-ui";

// place token here for testing
const user = {
  id_token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IkNzb3NkN2FmejNIcGtlak82ZXlnLTduaWtab0NKanBjMU9LSnhvd2kwV1kiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3NTUwNTg4NDAsIm5iZiI6MTc1NTA1NTI0MCwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kY3N2bHlkZXYyLmIyY2xvZ2luLmNvbS8wNTNlNDg0Yi02ZTU1LTQ4ODMtOTVmMS0yMTIzMmYwN2JiYmUvIiwic3ViIjoiY2Y0NWY2NWMtMWRhMy00Njk1LWE1N2YtYmIzYWQ1NzY0MzZmIiwiYXVkIjoiNjQ0YzI2NzgtOGNiNy00MDc5LTg5MzItM2MxY2JmZWEwOTkyIiwiYWNyIjoiYjJjXzFhX3NpZ251cF9zaWduaW5faW1taW5lbnRseSIsImlhdCI6MTc1NTA1NTI0MCwiYXV0aF90aW1lIjoxNzU1MDU1MjM4LCJuYW1lIjoiSmFtZXMgV2F0ZXJob3VzZSIsImdpdmVuX25hbWUiOiJKYW1lcyIsImZhbWlseV9uYW1lIjoiV2F0ZXJob3VzZSIsImVtYWlscyI6WyJqYW1lcy53YXRlcmhvdXNlQGltbWluZW50bHkuY28iXSwiZ3JvdXBfbmFtZXMiOlsiRGVjaXNpdmVseS5BQ01FIiwiRGVjaXNpdmVseS5ERVYiLCJEZWNpc2l2ZWx5Lk9jdGFuIiwiRGVjaXNpdmVseS5ESVNSIiwiRGVjaXNpdmVseS5RVVQiXSwiZ3JvdXBfaWRzIjpbIjMyYjFmOTRmLWVmMzktNGI4Yi1hNDlmLThiNmY1ZjcyZmQ4ZCIsIjBiYWMxOTRmLWE0YzAtNDZkYy1iMjljLTk4ZjI4MzMwZGZiYiIsIjkyOGM5MDVhLTVkYTgtNDIzMC1hNzVjLTNkOTk4MWM1ZDNiZSIsIjk4NDc5MjM0LTdhMjYtNDA1Mi04MTY2LTUwYjhkMTEyMGM0NyIsIjY5NTQ2YTRkLWVhODctNDQxYS1hMzUzLWM5NDBiM2JiMjJiMCJdLCJyb2xlcyI6WyIxNTk2ZjkwMS1lZDA0LTQ3ZGMtYjU2Mi01NTEwYzAzMDY2YTgiLCJlNGFiZTIwZC04OTI3LTQ1Y2QtYmJlMS00NDcyMDVlZTFjNTYiLCIxZTcwM2UwZS1mOGI5LTQ3ZjktODVmYy1hZThhZTBkNzA2ZjIiLCJjYmMxMDAxMC03MDAyLTRiNDctYTM2YS00YjZiYmUwZTAyMTMiLCJiMDE1MWExYy0wOGI5LTQyODUtODcxNy03YWZlZmNjZjcyMDAiLCJlOGE2ODkyYy1hODJlLTQ2MmItYjM4ZS1lNTE3NTU5YjZlZDYiLCIwM2NkOTgzOS0yNGE3LTQzZWItYWJkYy1lYmQ3NmZmZGVhNTkiLCJkZDJmODU0Ni0wN2Q2LTQzZDEtYTkxZC05OGEyYzMyZGZjYTciLCJkZWNiMTg1MS04Njg0LTQzZTktYWNmMS1hNzg3Y2U3YmViNmMiLCJjZjZkMjI1ZC1iMTE2LTQ1M2MtYmU1Zi1iZjI3ZWQ0YWJiZjIiLCJmNTk3MWY2My1mMzZlLTRhOWMtYWRlZi03NmRmMTA2MzdmMzMiLCIyNDNiN2I2Yy0xY2RlLTQzMTMtYWMwMC1kMDA2OWYxMmQwMTAiLCIyZDA3YTY2ZC0xMjM1LTQzOTQtODkyMS02MDY5YWNhNDU1MTYiLCJkMGMwZWM3My04N2VmLTQ1NGItYjdjMC0xYjU3ZThiNTg3ODciLCI5NDNmMDk3Ny1hZmM4LTRiNzAtYTg0Zi0yYTFmYTdjMDY4NzciLCI1YWI3YTM4MC0xNGI0LTRhZjQtYTk1NC1hNDEzOGIxNjgwZmIiLCI1NmI5MTdhNi1kZDFhLTQyODYtOWU2ZS0zOWE0MmEyYTAyYjQiLCIwOTFkZWNhYi1iYjBiLTQ5MWItYjY4Yi1kOTc2YjIyYWNjOWIiLCI4ZmY1N2JhZS01ODY4LTQ5OTQtOTZiNS0zMzE2ZTE5MWMyNmMiLCI1YzlhNGZiNC03MDEyLTRmZDQtOTViZC02ZjhjZWRmZmEwNDQiLCI3OWFiZTViOC00NDc5LTRkOWItYTNlYS0yYjJlZmU4MTc5ZDYiLCJkODk4ZTlkZS01NTI2LTRmMTctODE0Yi05YjIyYTc3NGJkZTciLCJkZjM0OTdmZC1mMjk0LTRiMmEtOTMyMC02OWQ5NTZlN2Q3NWUiXSwib3duZWRfZ3JvdXBzIjpbIkRlY2lzaXZlbHkuUVVUIl0sInRpZCI6IjA1M2U0ODRiLTZlNTUtNDg4My05NWYxLTIxMjMyZjA3YmJiZSIsImlzRm9yZ290UGFzc3dvcmQiOmZhbHNlLCJhdF9oYXNoIjoiNE5XZVBUcTJJbjI2WmZncHp0eVUxQSJ9.djVShRwBxqlEqQ76xM7ffwPrzD-A2gwIdwLeK7DbV6VO6pxgu2cI-GOlWiD_5Zy31r21JdO8l312oW4CbUgelLm2L5u9Uce50ruLmhwuQepIRjvHhymsq_0E-_IhImSqIwjuc9MuYpHDsiH4PCGKhDgWdVD4lBmZZSbeN79SxoMJYQFALM1eYybFSckmVtkktwFiNS_G1sk79L38wJo-AFwqq4EOHJH4888jMHYS_4hIJzsRMNoH6hWqsQXLbR4qn82rdLztNyR1NSf6Ut20eo68_rKZDXpKVOPxusIaZ-jXa7PNCso2-mo6bX9how1u2M_KjUC8zD18kFuuiyNwfA"
}

export const API = {
  baseUrl: "https://api.dev.decisively.imminently.co",
  tenancy: "32b1f94f-ef39-4b8b-a49f-8b6f5f72fd8d",
  /** main brii project */
  // model: "af7715f3-9242-4646-a614-0932b598c5c8",
  // interview: "Award selection interview (embeds rate determination)",
  // dev control test
  model: "42d3e876-af7d-4579-b17f-514ee08487b8",
  interview: "Control test",
}

class CustomApi extends ApiManager {
  simulate = async (session: Session, data: Partial<Simulate>) => {
    // Dynamic interactions are now on a post (due to new interaction behaviour in backend)
    const res = await this.api.post<AttributeValues>(
      buildUrl(session.sessionId, "interview"),
      {
        mode: "api",
        save: false,
        ...data,
      }
    );
    return res.data;
  }

  getRulesEngineUrl = (checksum?: string) => {
    return `${this.options.host}/rules-engine?=${checksum}`;
  }
}

export const getInterviewConfig = (interview?: string) => {
  return {
    debug: true,
    sessionConfig: {
      project: API.model,
      // release: "interview",
      interview: interview ?? API.interview,
    },
    apiManager: new CustomApi({
      host: API.baseUrl,
      // path: "timesheet",
      auth: () => ({
        token: `Bearer ${user.id_token as string}`,
        tenancy: API.tenancy,
      }),
    }),
    fileManager: {
      host: API.baseUrl,
    },
  } as ManagerOptions;
}

export const InterviewPage = () => {
  const options = getInterviewConfig()
  return (
    <Interview options={options} />
  )
}

function buildUrl(model: string, release: string): string {
  throw new Error("Function not implemented.");
}
