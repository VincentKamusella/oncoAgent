import argparse
import importlib
import json
import os
import sys
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any, Dict, List, Optional


from tavily import TavilyClient



@dataclass
class PatientProfile:
    id: str
    cancer_type: str
    stage: str
    subtype: Optional[str] = None
    biomarkers: List[str] = field(default_factory=list)
    line_of_therapy: Optional[str] = None
    age: Optional[int] = None
    comorbidities: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, raw: Dict[str, Any]) -> "PatientProfile":
        required_fields = ["id", "cancer_type", "stage"]
        missing = [name for name in required_fields if not raw.get(name)]
        if missing:
            missing_text = ", ".join(missing)
            raise ValueError(
                f"Missing required patient fields: {missing_text}"
            )

        return cls(
            id=str(raw["id"]),
            cancer_type=str(raw["cancer_type"]),
            stage=str(raw["stage"]),
            subtype=raw.get("subtype"),
            biomarkers=[str(b) for b in raw.get("biomarkers", [])],
            line_of_therapy=raw.get("line_of_therapy"),
            age=raw.get("age"),
            comorbidities=[str(c) for c in raw.get("comorbidities", [])],
        )


def build_query(patient: PatientProfile, year_from: int) -> str:
    terms: List[str] = [
        f'"{patient.cancer_type}"',
        f'"stage {patient.stage}"',
        "latest studies OR clinical trials OR meta-analysis",
        f"{year_from}..2026",
    ]
    if patient.subtype:
        terms.append(f'"{patient.subtype}"')
    if patient.biomarkers:
        biomarker_terms = [f'"{marker}"' for marker in patient.biomarkers]
        terms.append(" OR ".join(biomarker_terms))
    if patient.line_of_therapy:
        terms.append(f'"{patient.line_of_therapy}"')
    if patient.age is not None:
        terms.append(f'"age {patient.age}"')

    # Keep queries de-identified by design: no names, MRNs, dates of birth.
    return " AND ".join(terms)


def score_result(patient: PatientProfile, result: Dict[str, Any]) -> int:
    text = f"{result.get('title', '')} {result.get('content', '')}".lower()
    score = 0
    clinical_terms = [
        patient.cancer_type.lower(),
        f"stage {patient.stage}".lower(),
        (patient.subtype or "").lower(),
    ] + [m.lower() for m in patient.biomarkers]

    for term in clinical_terms:
        if term and term in text:
            score += 2

    trial_keywords = [
        "randomized",
        "phase ii",
        "phase iii",
        "meta-analysis",
        "systematic review",
    ]
    for keyword in trial_keywords:
        if keyword in text:
            score += 1

    return score


def search_for_patient(
    client: TavilyClient,
    patient: PatientProfile,
    max_results: int,
    year_from: int,
) -> Dict[str, Any]:
    query = build_query(patient, year_from=year_from)
    response = client.search(
        query=query,
        search_depth="advanced",
        include_answer=True,
        max_results=max_results,
    )

    raw_results = response.get("results", [])
    ranked_results = sorted(
        raw_results,
        key=lambda item: score_result(patient, item),
        reverse=True,
    )

    return {
        "patient": asdict(patient),
        "query": query,
        "answer": response.get("answer", ""),
        "results": ranked_results,
    }


def load_patients(path: Path) -> List[PatientProfile]:
    if not path.exists():
        raise FileNotFoundError(
            f"Patient file not found: {path}. "
            "Create it first or run with --init-sample-patients."
        )

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in patient file: {path}") from exc

    if not isinstance(payload, list):
        raise ValueError("Patient input must be a JSON array.")
    return [PatientProfile.from_dict(item) for item in payload]


def run_research(
    patients: List[PatientProfile],
    max_results: int,
    year_from: int,
    api_key_override: Optional[str] = None,
) -> Dict[str, Dict[str, Any]]:
    dotenv_module = importlib.util.find_spec("dotenv")
    if dotenv_module is not None:
        dotenv = importlib.import_module("dotenv")
        dotenv.load_dotenv()

    if TavilyClient is None:
        raise RuntimeError(
            "Missing dependency 'tavily-python'. Install with: pip install tavily-python"
        )

    api_key = api_key_override or os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Set TAVILY_API_KEY, use a .env file, or pass --api-key. "
            "Example: export TAVILY_API_KEY='your_key_here'"
        )

    client = TavilyClient(api_key)
    output: Dict[str, Dict[str, Any]] = {}
    for patient in patients:
        output[patient.id] = search_for_patient(
            client=client,
            patient=patient,
            max_results=max_results,
            year_from=year_from,
        )
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run patient-specific oncology literature research."
    )
    parser.add_argument(
        "--patients-json",
        default="patients.json",
        help="Path to JSON file containing an array of patient profiles.",
    )
    parser.add_argument(
        "--max-results", type=int, default=8, help="Results per patient."
    )
    parser.add_argument(
        "--year-from", type=int, default=2023, help="Earliest year to prioritize."
    )
    parser.add_argument(
        "--output",
        default="research_output.json",
        help="Path to write structured research output.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Tavily API key. Overrides TAVILY_API_KEY if provided.",
    )
    parser.add_argument(
        "--init-sample-patients",
        action="store_true",
        help="Write a sample patients JSON file and exit.",
    )
    return parser.parse_args()


def _safe_write_target(path: Path) -> Path:
    """Reject paths outside the current working directory and any path that
    points at an existing symlink — defense-in-depth against ``--patients-json``
    being pointed at sensitive locations on a developer's machine."""
    resolved = path.expanduser().resolve()
    cwd = Path.cwd().resolve()
    try:
        resolved.relative_to(cwd)
    except ValueError as e:
        raise ValueError(
            f"Refusing to write outside cwd: {resolved} (cwd={cwd})"
        ) from e
    if resolved.is_symlink():
        raise ValueError(f"Refusing to follow symlink: {resolved}")
    return resolved


def write_sample_patients(path: Path) -> None:
    sample = [
        {
            "id": "patient_A",
            "cancer_type": "breast cancer",
            "stage": "I",
            "subtype": "HR+/HER2-",
            "biomarkers": ["ER+", "PR+", "HER2-"],
            "line_of_therapy": "newly diagnosed",
            "age": 46,
            "comorbidities": [],
        }
    ]
    target = _safe_write_target(path)
    target.write_text(json.dumps(sample, indent=2), encoding="utf-8")


def main() -> None:
    args = parse_args()
    patients_path = Path(args.patients_json)

    if args.init_sample_patients:
        write_sample_patients(patients_path)
        print(f"Wrote sample patients file: {patients_path}")
        return

    try:
        patients = load_patients(patients_path)
        report = run_research(
            patients=patients,
            max_results=args.max_results,
            year_from=args.year_from,
            api_key_override=args.api_key,
        )

        output_path = Path(args.output)
        output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"Wrote patient-specific research report to: {output_path}")
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
