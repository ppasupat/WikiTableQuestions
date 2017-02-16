#/usr/bin/env bash
# Release the compact version of the dataset
cd ..
zip -r WikiTableQuestions.zip WikiTableQuestions/csv WikiTableQuestions/data WikiTableQuestions/tagged WikiTableQuestions/evaluator.py WikiTableQuestions/README.md
