#!/usr/bin/env python3
"""Render portfolio evidence from the public C runner's actual output.

Run the source repository's validation/run_suite.py first, then:
  python3 tools/build_aerakia_evidence.py --validation-dir PATH --source-commit SHA
No simulation, smoothing, fitted values or performance claims are added here.
"""

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path


def quaternion_error(row, algorithm):
    reference = [float(row[f"truth_q_{axis}"]) for axis in "wxyz"]
    estimate = [float(row[f"{algorithm}_q_{axis}"]) for axis in "wxyz"]
    denominator = math.sqrt(sum(x * x for x in reference) * sum(x * x for x in estimate))
    dot = abs(sum(a * b for a, b in zip(reference, estimate)) / denominator)
    return math.degrees(2 * math.acos(min(1.0, dot)))


def render_chart(series, language, compact=False):
    zh = language == "zh"
    width, height = (360, 310) if compact else (760, 430)
    left, top = (42, 70) if compact else (62, 70)
    plot_width, plot_height = width - left - 18, height - top - 70
    maximum = math.ceil(max(row[1] for row in series) / 10) * 10
    x = lambda value: left + value / 20 * plot_width
    y = lambda value: top + plot_height - value / maximum * plot_height
    title = "持续磁场干扰下的姿态偏差" if zh else "Attitude error under persistent magnetic bias"
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
           f'<title id="title">{title}</title>',
           '<desc id="desc">Geodesic attitude error from 2000 synthetic samples replayed through the native C algorithms. The magnetic bias starts at 6.66 seconds.</desc>',
           f'<rect width="{width}" height="{height}" fill="#132119"/>',
           '<g font-family="Arial, Noto Sans CJK SC, sans-serif" fill="#b6c5ac" font-size="16">',
           f'<text x="{left}" y="29">{("姿态偏差（度）" if zh else "Attitude error (degrees)") if compact else ("姿态偏差（度）· 越低越接近参考值" if zh else "Attitude error (degrees) · lower is closer to reference")}</text>',
           f'<rect x="{x(6.66):.2f}" y="{top}" width="{x(20)-x(6.66):.2f}" height="{plot_height}" fill="#293023"/>']
    for tick in range(0, maximum + 1, 10):
        svg.extend([f'<path d="M{left} {y(tick):.2f}h{plot_width}" stroke="#3b4e39"/>',
                    f'<text x="{left-14}" y="{y(tick)+5:.2f}" text-anchor="end">{tick}</text>'])
    for tick in range(0, 21, 5):
        svg.append(f'<text x="{x(tick):.2f}" y="{height-41}" text-anchor="middle">{tick}</text>')
    svg.extend([f'<path d="M{x(6.66):.2f} {top}v{plot_height}" stroke="#a9b099" stroke-dasharray="4 4"/>',
                f'<text x="{x(6.66)+10:.2f}" y="56">{("加入干扰" if zh else "Bias begins") if compact else ("此处加入磁场偏置" if zh else "Magnetic bias begins")}</text>',
                f'<text x="{left+plot_width}" y="{height-11}" text-anchor="end">{"回放时间（秒）" if zh else "Replay time (seconds)"}</text>', '</g>'])
    # Render every point: the near-zero robust curve is not replaced by a flat line.
    for index, color, dash in ((1, "#e0ac80", ""), (2, "#c5dcb2", ' stroke-dasharray="7 4"')):
        points = " ".join(f"{x(row[0]):.2f},{y(row[index]):.2f}" for row in series)
        svg.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="2.7" stroke-linejoin="round"{dash}/>')
    svg.append('</svg>\n')
    return "\n".join(svg)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validation-dir", type=Path, required=True)
    parser.add_argument("--source-commit", required=True)
    args = parser.parse_args()
    if len(args.source_commit) != 40 or any(c not in "0123456789abcdef" for c in args.source_commit):
        parser.error("--source-commit must be the full verified source revision")
    output = Path(__file__).resolve().parents[1] / "assets" / "evidence"
    output.mkdir(parents=True, exist_ok=True)
    scenario = args.validation_dir / "mag_bias"
    with (scenario / "results.csv").open(newline="") as source:
        rows = list(csv.DictReader(source))
    metrics = json.loads((scenario / "metrics.json").read_text())
    series = [(float(row["ts_us"]) / 1e6,
               quaternion_error(row, "mahony_standard"),
               quaternion_error(row, "mahony_robust")) for row in rows]
    for column, name in ((1, "mahony_standard"), (2, "mahony_robust")):
        actual = math.sqrt(sum(row[column] ** 2 for row in series) / len(series))
        expected = metrics["algorithms"][name]["overall_attitude_rmse_deg"]
        if not math.isclose(actual, expected, abs_tol=1e-5):
            raise ValueError(f"Chart and reported metric disagree for {name}")
    for language in ("zh", "en"):
        (output / f"aerakia-mag-bias-{language}.svg").write_text(render_chart(series, language))
        (output / f"aerakia-mag-bias-mobile-{language}.svg").write_text(render_chart(series, language, compact=True))
    with (output / "aerakia-mag-bias-series.csv").open("w", newline="") as target:
        writer = csv.writer(target)
        writer.writerow(["time_s", "mahony_standard_attitude_error_deg", "mahony_robust_attitude_error_deg"])
        writer.writerows(series)
    (output / "aerakia-suite-summary.json").write_text((args.validation_dir / "summary.json").read_text())
    provenance = {
        "repository": "https://github.com/Sailiono/aerakia-flight-algorithms",
        "source_commit": args.source_commit,
        "reference_kind": "deterministic synthetic inputs, not flight or hardware results",
        "scenario": "mag_bias", "duration_s": 20, "rate_hz": 100, "seed": 7,
        "bias_start_s": 6.66, "magnetic_bias_ut": {"x": 50, "y": 25},
        "samples": len(rows),
        "chart_metric": "Quaternion geodesic attitude error, degrees, computed from every output sample",
        "metric_check": "Chart-series RMSE matches the analyzer within 0.00001 degrees",
        "input_sha256": hashlib.sha256((scenario / "input.csv").read_bytes()).hexdigest(),
        "native_result_sha256": hashlib.sha256((scenario / "results.csv").read_bytes()).hexdigest(),
        "commands": [
            f"git checkout {args.source_commit}",
            "cmake -S . -B build -DCMAKE_BUILD_TYPE=Release",
            "cmake --build build",
            "ctest --test-dir build --output-on-failure",
            "python validation/run_suite.py --runner build/aerakia_validation_runner --out-dir build/validation"
        ],
        "limitations": "One deterministic run per scenario. No field reliability, flight safety or certification claim. Cold-start summary metrics exclude the initial alignment interval, as documented upstream."
    }
    (output / "aerakia-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    print(f"Rendered {len(rows)} real C-runner output samples into {output}")


if __name__ == "__main__":
    main()
