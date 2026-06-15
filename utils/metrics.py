from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer
from sklearn.metrics import precision_recall_fscore_support
from difflib import SequenceMatcher


class NLPMetrics:

    @staticmethod
    def bleu_score(reference_text, generated_text):
        reference = [reference_text.split()]
        candidate = generated_text.split()

        score = sentence_bleu(
            reference,
            candidate,
            smoothing_function=SmoothingFunction().method1
        )

        return round(score * 100, 2)

    @staticmethod
    def rouge_scores(reference_text, generated_text):

        scorer = rouge_scorer.RougeScorer(
            ['rouge1', 'rouge2', 'rougeL'],
            use_stemmer=True
        )

        scores = scorer.score(reference_text, generated_text)

        return {
            "ROUGE-1": round(scores['rouge1'].fmeasure * 100, 2),
            "ROUGE-2": round(scores['rouge2'].fmeasure * 100, 2),
            "ROUGE-L": round(scores['rougeL'].fmeasure * 100, 2)
        }

    @staticmethod
    def text_similarity(reference_text, generated_text):

        similarity = SequenceMatcher(
            None,
            reference_text,
            generated_text
        ).ratio()

        return round(similarity * 100, 2)

    @staticmethod
    def ner_metrics(true_entities, predicted_entities):

        all_entities = sorted(
            list(set(true_entities + predicted_entities))
        )

        y_true = [
            1 if e in true_entities else 0
            for e in all_entities
        ]

        y_pred = [
            1 if e in predicted_entities else 0
            for e in all_entities
        ]

        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true,
            y_pred,
            average="binary",
            zero_division=0
        )

        return {
            "Precision": round(precision * 100, 2),
            "Recall": round(recall * 100, 2),
            "F1 Score": round(f1 * 100, 2)
        }


if __name__ == "__main__":

    original_text = """
    John lives in Kolkata and works at Google.
    """

    translated_text = """
    John lives in Kolkata and works for Google.
    """

    reference_summary = """
    John works at Google in Kolkata.
    """

    generated_summary = """
    John is employed by Google in Kolkata.
    """

    true_entities = [
        "John",
        "Kolkata",
        "Google"
    ]

    predicted_entities = [
        "John",
        "Google",
        "Kolkata"
    ]

    print("\n========== NLP EVALUATION ==========\n")

    bleu = NLPMetrics.bleu_score(
        original_text,
        translated_text
    )

    print(f"BLEU Score      : {bleu}")

    rouge = NLPMetrics.rouge_scores(
        reference_summary,
        generated_summary
    )

    print(f"ROUGE-1         : {rouge['ROUGE-1']}")
    print(f"ROUGE-2         : {rouge['ROUGE-2']}")
    print(f"ROUGE-L         : {rouge['ROUGE-L']}")

    similarity = NLPMetrics.text_similarity(
        original_text,
        translated_text
    )

    print(f"Similarity      : {similarity}%")

    ner = NLPMetrics.ner_metrics(
        true_entities,
        predicted_entities
    )

    print(f"NER Precision   : {ner['Precision']}%")
    print(f"NER Recall      : {ner['Recall']}%")
    print(f"NER F1 Score    : {ner['F1 Score']}%")