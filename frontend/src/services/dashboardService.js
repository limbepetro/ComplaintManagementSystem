import api from "../api";

export const getDashboardData = async () => {
  const responses = await Promise.allSettled([
    api.get("complaints/"),
    api.get("mediation-sessions/"),
    api.get("hearings/"),
    api.get("decision-awards/"),
    api.get("enforcement-cases/"),
    api.get("case-closures/"),
  ]);

  return {
    complaints:
      responses[0].status === "fulfilled"
        ? responses[0].value.data
        : [],

    mediationSessions:
      responses[1].status === "fulfilled"
        ? responses[1].value.data
        : [],

    hearings:
      responses[2].status === "fulfilled"
        ? responses[2].value.data
        : [],

    decisionAwards:
      responses[3].status === "fulfilled"
        ? responses[3].value.data
        : [],

    enforcementCases:
      responses[4].status === "fulfilled"
        ? responses[4].value.data
        : [],

    caseClosures:
      responses[5].status === "fulfilled"
        ? responses[5].value.data
        : [],
  };
};