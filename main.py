from __future__ import annotations

from utils.document_pipeline import PipelineConfig, build_arg_parser, result_to_console, run_pipeline


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    result = run_pipeline(
        PipelineConfig(
            input_path=args.input_path,
            output_dir=args.output_dir,
            language=args.language,
            document_type=args.document_type,
            encryption_key=args.encryption_key,
        )
    )
    print(result_to_console(result))


if __name__ == "__main__":
    main()
