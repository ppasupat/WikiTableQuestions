WikiTableQuestions Dataset
==========================
Version 0.2

Introduction
------------

The WikiTableQuestions dataset is for the task of question answering on
semi-structured HTML tables as presented in the paper:

> Panupong Pasupat, Percy Liang.  
>   Compositional Semantic Parsing on Semi-Structured Tables  
>   Association for Computational Linguistics (ACL), 2015.

Questions and Answers
---------------------

The `data/` directory contains the questions, answers, and the ID of the tables
that each question is asking about.

**Dataset Formats.** Each split of the dataset is stored in 2 formats:

- TSV file. Each row is an example with the following columns:
  - Column 1: Example ID
  - Column 2: Question
  - Column 3: Table ID
  - Column 4, 5, ...: Answer
    (If the answer has multiple entities, multiple columns are used)

- EXAMPLES file. This LispTree format is used internally in our
  [SEMPRE](http://nlp.stanford.edu/software/sempre/) code base.

**Dataset Splits.** We splitted 22033 examples into multiple sets:

- `training`:
  Training data (14152 examples)

- `pristine-unseen-tables`:
  Test data -- the tables are *not seen* in training data (4344 examples)

- `pristine-seen-tables`:
  Additional data where the tables are *seen* in training data. (3537 examples)
  (Initially intended to be used as development data, this portion of the dataset
  was not actually used in any experiments in the paper.)

- `random-split-*`:
  For development, we split training.tsv into 5 random 80-20 splits.
  Within each split, tables in the training data (`random-split-seed-*-train`)
  and the test data (`random-split-seed-*-test`) are disjoint.

For our ACL 2015 paper:

- In development set experiments, we trained on `random-split-seed-{1,2,3}-train`
  and tested on `random-split-seed-{1,2,3}-test`, respectively.

- In test set experiments, we trained on `training` and tested on
  `pristine-unseen-tables`.

Tables
------

The `csv/` directory contains the extracted tables, while the `html/` directory
contains the raw HTML data.

**Table Formats.**

- `csv/xxx-csv/yyy.csv`:
  Comma-separated table (The first row is treated as the column header)

- `csv/xxx-csv/yyy.tsv`:
  Tab-separated table

- `csv/xxx-csv/yyy.table`:
  Column-aligned table (More human-readable but harder to parse by machines)

- `html/xxx-html/yyy.html`:
  Raw HTML file of the whole web page

- `html/xxx-html/yyy.json`:
  Metadata including the URL, the page title, and the index of the chosen table

