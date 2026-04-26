import {
  getPatient,
  prsForPatient,
  prById,
  meetingsForPatient,
  meetingById,
  followupForPatient,
  guidelinesFor,
} from "@/lib/data";

export const toolDefinitions = [
  {
    type: "function" as const,
    name: "get_patient_facts",
    description:
      "Get structured clinical facts for the current patient. Each fact includes a label, value, confidence score, source reference, and last-updated timestamp. Optionally filter by group.",
    parameters: {
      type: "object",
      properties: {
        group: {
          type: "string",
          enum: ["demographics", "diagnosis", "staging", "medication", "imaging", "lab", "history", "genomics"],
          description: "Filter facts to a specific category. Omit to get all facts.",
        },
      },
    },
  },
  {
    type: "function" as const,
    name: "get_pull_requests",
    description:
      "Get pull requests (proposed data changes) for the current patient. Each PR has a title, status, proposed field changes, conflicts, and an agent verdict.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "merged", "conflict", "needs-review"],
          description: "Filter by PR status. Omit to get all PRs.",
        },
      },
    },
  },
  {
    type: "function" as const,
    name: "get_pr_details",
    description:
      "Get full details of a specific pull request including proposed changes, conflicts with severity/rationale, and the agent verdict.",
    parameters: {
      type: "object",
      properties: {
        pr_id: { type: "string", description: "The PR identifier, e.g. 'pr-tb-1'" },
      },
      required: ["pr_id"],
    },
  },
  {
    type: "function" as const,
    name: "get_treatment_plan",
    description:
      "Get the patient's full treatment plan: all phases with type, regimen, status, cycle progress, and clinical rationale.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_meetings",
    description:
      "Get clinical meetings and tumor board sessions for the current patient, including attendees and status.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_meeting_transcript",
    description:
      "Get the full transcript and agent notes for a specific meeting.",
    parameters: {
      type: "object",
      properties: {
        meeting_id: { type: "string", description: "The meeting identifier, e.g. 'mtg-tb-1'" },
      },
      required: ["meeting_id"],
    },
  },
  {
    type: "function" as const,
    name: "get_followup_schedule",
    description:
      "Get upcoming follow-up items: scheduled labs, imaging, visits, and discussions with dates and prep instructions.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_guidelines",
    description:
      "Get the clinical guideline decision pathway for this patient's cancer type, showing which nodes are on the patient's path.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_board_case",
    description:
      "Get the active tumor board case for this patient, including the clinical question, attendees, status, and any decision made.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_treatment_options",
    description:
      "Get treatment options under review for this patient. Each option includes intent, regimen phases, rationale, expected outcomes, toxicities, evidence citations, and clinician rankings.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "traverse_graph",
    description:
      "Traverse the patient knowledge graph to find related entities. Start from a fact, review item, meeting, clinician, or treatment option and explore connections — what supersedes it, what contradicts it, what depends on it, who authored it, what meeting discussed it. Use this when asked about relationships between clinical data points.",
    parameters: {
      type: "object",
      properties: {
        start_node: {
          type: "string",
          description:
            "The key or identifier of the starting node. For facts use the fact key (e.g., 'staging.clinical'). For clinicians use their name. For meetings or options use their title.",
        },
        node_type: {
          type: "string",
          enum: ["fact", "review_item", "meeting", "clinician", "treatment_option", "drug"],
          description: "The type of the starting node.",
        },
        direction: {
          type: "string",
          enum: ["outgoing", "incoming", "both"],
          description: "Which direction to traverse relationships. Default: both.",
        },
        max_depth: {
          type: "integer",
          description: "How many relationship hops to traverse. Default: 2, max: 4.",
        },
      },
      required: ["start_node", "node_type"],
    },
  },
  {
    type: "function" as const,
    name: "extract_entities",
    description:
      "Extract clinical entities from unstructured text using the fine-tuned NER model. Identifies patients, hospitals, diagnoses, medications, biomarkers, procedures, lab results, and medical record numbers. Use when you need to parse clinical narrative text into structured entities.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The clinical text to extract entities from.",
        },
        schema: {
          type: "array",
          items: { type: "string" },
          description:
            "Entity types to extract. Options: patient, hospital, medical_record, diagnosis, medication, biomarker, procedure, lab_result. Omit to use all types.",
        },
      },
      required: ["text"],
    },
  },
  {
    type: "function" as const,
    name: "search_literature",
    description:
      "Search recent medical literature, clinical trials, and meta-analyses. Returns ranked results with titles, URLs, and content excerpts. Use when the clinician asks about recent evidence, treatment guidelines, drug efficacy, or clinical trial results for a specific cancer type or therapy.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The search query. Be specific — include cancer type, stage, biomarkers, treatment names.",
        },
        max_results: {
          type: "integer",
          description: "Maximum results to return. Default: 5.",
        },
      },
      required: ["query"],
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  patientId: string
): Promise<unknown> {
  switch (name) {
    case "get_patient_facts": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      const group = args.group as string | undefined;
      const facts = group
        ? patient.facts.filter((f) => f.group === group)
        : patient.facts;
      return facts.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value,
        group: f.group,
        confidence: f.confidence,
        source: f.source.label,
        updatedAt: f.updatedAt,
        ...(f.specialty && { specialty: f.specialty }),
      }));
    }

    case "get_pull_requests": {
      const prs = await prsForPatient(patientId);
      const status = args.status as string | undefined;
      const filtered = status ? prs.filter((p) => p.status === status) : prs;
      return filtered.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        summary: p.summary,
        author: p.author,
        agentVerdict: p.agentVerdict,
        conflictCount: p.conflicts.length,
        openedAt: p.openedAt,
      }));
    }

    case "get_pr_details": {
      const pr = await prById(args.pr_id as string);
      if (!pr) return { error: "PR not found" };
      return {
        id: pr.id,
        title: pr.title,
        status: pr.status,
        summary: pr.summary,
        source: pr.source,
        author: pr.author,
        proposed: pr.proposed,
        conflicts: pr.conflicts,
        agentVerdict: pr.agentVerdict,
        openedAt: pr.openedAt,
      };
    }

    case "get_treatment_plan": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      return patient.plan.map((p) => ({
        name: p.name,
        type: p.type,
        regimen: p.regimen,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        cycles: p.cycles,
        rationale: p.rationale,
      }));
    }

    case "get_meetings": {
      return (await meetingsForPatient(patientId)).map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        status: m.status,
        attendees: m.attendees.map((a) => `${a.name} (${a.role})`),
        hasTranscript: !!m.transcript,
      }));
    }

    case "get_meeting_transcript": {
      const meeting = await meetingById(args.meeting_id as string);
      if (!meeting) return { error: "Meeting not found" };
      return {
        title: meeting.title,
        date: meeting.date,
        transcript: meeting.transcript ?? [],
        agentNotes: meeting.agentNotes ?? [],
        summary: meeting.summary ?? null,
      };
    }

    case "get_followup_schedule": {
      return (await followupForPatient(patientId)).map((f) => ({
        date: f.date,
        type: f.type,
        label: f.label,
        status: f.status,
        prep: f.prep ?? null,
      }));
    }

    case "get_guidelines": {
      const g = await guidelinesFor(patientId);
      if (!g) return { error: "No guidelines available for this cancer type" };
      return {
        cancerType: g.cancerType,
        title: g.title,
        source: g.source,
        patientPath: g.nodes
          .filter((n) => n.patientPath)
          .map((n) => ({ label: n.label.replace(/\n/g, " "), kind: n.kind })),
      };
    }

    case "get_board_case": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      if (!patient.boardCase) return { info: "No active board case for this patient" };
      const bc = patient.boardCase;
      return {
        id: bc.id,
        question: bc.question,
        status: bc.status,
        openedAt: bc.openedAt,
        attendees: bc.attendees.map((a) => `${a.name} (${a.role})`),
        decidedOptionId: bc.decidedOptionId ?? null,
        decidedAt: bc.decidedAt ?? null,
        decidedBy: bc.decidedBy ?? null,
      };
    }

    case "get_treatment_options": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      if (!patient.options || patient.options.length === 0)
        return { info: "No treatment options under review for this patient" };
      return {
        chosenOptionId: patient.chosenOptionId ?? null,
        options: patient.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          shortLabel: opt.shortLabel,
          intent: opt.intent,
          rationale: opt.rationale,
          outcomes: opt.outcomes,
          toxicities: opt.toxicities,
          evidence: opt.evidence,
          burden: opt.burden ?? null,
          rankings: opt.rankings.map((r) => ({
            specialist: r.specialist,
            specialty: r.specialty,
            rank: r.rank,
            confidence: r.confidence,
            note: r.note ?? null,
          })),
          phases: opt.phases.map((p) => ({
            name: p.name,
            type: p.type,
            regimen: p.regimen,
            status: p.status,
          })),
        })),
      };
    }

    case "traverse_graph": {
      const { traverseGraph } = await import("@/lib/neo4j/traverse");
      try {
        const result = await traverseGraph({
          patientSlug: patientId,
          startNode: args.start_node as string,
          nodeType: args.node_type as "fact" | "review_item" | "meeting" | "clinician" | "treatment_option" | "drug",
          direction: (args.direction as "outgoing" | "incoming" | "both") ?? "both",
          maxDepth: Math.min((args.max_depth as number) ?? 2, 4),
        });
        return result;
      } catch (err) {
        return { error: `Graph traversal failed: ${err instanceof Error ? err.message : "unknown error"}` };
      }
    }

    case "extract_entities": {
      const nerModel = process.env.PIONEER_NER_MODEL;
      const nerKey = process.env.PIONEER_API_KEY;
      const baseUrl = process.env.PIONEER_BASE_URL ?? "https://api.pioneer.ai/v1";
      if (!nerModel || !nerKey) {
        return { error: "Pioneer NER model not configured (PIONEER_API_KEY / PIONEER_NER_MODEL)" };
      }
      const schema = (args.schema as string[] | undefined) ?? [
        "patient", "hospital", "medical_record", "diagnosis",
        "medication", "biomarker", "procedure", "lab_result",
      ];
      const threshold = parseFloat(process.env.PIONEER_NER_THRESHOLD ?? "0.3");
      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${nerKey}`,
          },
          body: JSON.stringify({
            model: nerModel,
            task: "extract_entities",
            text: args.text as string,
            schema,
            threshold,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return { error: `NER API error ${res.status}: ${errText}` };
        }
        return await res.json();
      } catch (err) {
        return { error: `NER extraction failed: ${err instanceof Error ? err.message : "unknown error"}` };
      }
    }

    case "search_literature": {
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!tavilyKey) {
        return { error: "Tavily not configured (TAVILY_API_KEY)" };
      }
      const maxResults = Math.min((args.max_results as number) ?? 5, 10);
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: args.query as string,
            search_depth: "advanced",
            include_answer: true,
            max_results: maxResults,
            include_domains: [
              "pubmed.ncbi.nlm.nih.gov",
              "clinicaltrials.gov",
              "nccn.org",
              "asco.org",
              "nejm.org",
              "thelancet.com",
              "nature.com",
              "bmj.com",
            ],
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return { error: `Tavily API error ${res.status}: ${errText}` };
        }
        const data = await res.json();
        return {
          answer: data.answer ?? "",
          results: (data.results ?? []).map(
            (r: { title: string; url: string; content: string; score: number }) => ({
              title: r.title,
              url: r.url,
              excerpt: r.content?.slice(0, 500),
              relevance: r.score,
            })
          ),
        };
      } catch (err) {
        return { error: `Literature search failed: ${err instanceof Error ? err.message : "unknown error"}` };
      }
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
