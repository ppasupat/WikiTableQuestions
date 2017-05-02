#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, shutil, re, argparse, json, shutil
from codecs import open
from itertools import izip
from collections import defaultdict

def make_skeleton():
    if os.path.exists('viewer/csv'):
        if raw_input('Delete ./viewer/csv ? (y/N): ')[0:].lower() != 'y':
            exit(1)
        shutil.rmtree('viewer/csv')
    os.mkdir('viewer/csv')

def parse_context(context):
    match = re.match(r'csv/(\d+)-csv/(\d+).csv$', context)
    batch_id, data_id = match.groups()
    return int(batch_id), int(data_id)

def read_dataset(filename='data/training.tsv'):
    table_to_examples = defaultdict(list)
    count = 0
    with open(filename, 'r', 'utf8') as fin:
        header = fin.readline().strip().split('\t')
        for line in fin:
            line = dict(zip(header, line.strip().split('\t')))
            context = parse_context(line['context'])
            del line['context']
            line['targetValue'] = line['targetValue'].split('|')
            if len(line['targetValue']) == 1:
                line['targetValue'] = line['targetValue'][0]
            table_to_examples[context].append(line)
            count += 1
    print >> sys.stderr, \
            'Read {} examples from {} tables'\
            .format(count, len(table_to_examples))
    return table_to_examples

def read_cleaned_table(fin):
    records = []
    for line in fin:
        line = (line.rstrip('\n')
                .replace(r'\p', '|').replace('&', '&amp;')
                .replace('<', '&lt;').replace('>', '&gt;')
                .replace(r'\n', '<br>')).split('\t')
        records.append(line)
    return records

def write_cleaned_table(table, fout):
    print >> fout, '<table>'
    # Header
    print >> fout, '<thead>'
    print >> fout, '<tr>'
    for cell in table[0]:
        print >> fout, u'<th>{}</th>'.format(cell)
    print >> fout, '</tr>'
    print >> fout, '</thead>'
    # Body
    print >> fout, '<tbody>'
    for row in table[1:]:
        print >> fout, '<tr>'
        for cell in row:
            print >> fout, u'<td>{}</td>'.format(cell)
        print >> fout, '</tr>'
    print >> fout, '</tbody>'
    print >> fout, '</table>'

def group_table_ids(table_ids):
    groups = defaultdict(list)
    for batch_id, data_id in table_ids:
        groups[batch_id].append(data_id)
    for x in groups.values():
        x.sort()
    return sorted(groups.items())

def get_example_to_table(grouped, table_to_examples):
    example_to_table = {}
    i = 1
    for batch_id, data_ids in grouped:
        for data_id in data_ids:
            for data in table_to_examples[batch_id, data_id]:
                id_ = int(data['id'].replace('nt-', ''))
                example_to_table[id_] = i
            i += 1
    return [example_to_table[i] for i in xrange(len(example_to_table))]

def main():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()

    # Preparation
    make_skeleton()
    table_to_examples = read_dataset()
    
    # Dump table list to JSON
    grouped = group_table_ids(table_to_examples)
    example_to_table = get_example_to_table(grouped, table_to_examples)
    with open('viewer/csv/tables.json', 'w') as fout:
        json.dump({'tables': grouped, 'exampleToTable': example_to_table}, fout,
                indent=0, separators=(',', ': '))
        fout.write('\n')

    for batch_id, data_ids in grouped:
        os.mkdir('viewer/csv/{}-csv'.format(batch_id))
        print >> sys.stderr, 'Processing Batch {} ...'.format(batch_id)
        for i, data_id in enumerate(data_ids):
            if i % 100 == 0:
                print '  Table {} / {} ...'.format(i, len(data_ids))
            prefix = 'viewer/csv/{}-csv/{}'.format(batch_id, data_id)
            # Dump examples to xxx-csv/yyy-data.json
            with open('page/{}-page/{}.json'.format(batch_id, data_id),
                    'r', 'utf8') as fin:
                metadata = json.load(fin)
            with open(prefix + '-data.json', 'w', 'utf8') as fout:
                json.dump({
                    'metadata': metadata,
                    'examples': table_to_examples[batch_id, data_id]
                    }, fout,
                    separators=(',', ': '), indent=2, ensure_ascii=False)
                fout.write('\n')
            # Copy HTML to xxx-csv/yyy-raw.html
            shutil.copy('csv/{}-csv/{}.html'.format(batch_id, data_id),
                    prefix + '-raw.html')
            # Create cleaned HTML at xxx-csv/yyy-clean.html
            with open('csv/{}-csv/{}.tsv'.format(batch_id, data_id),
                    'r', 'utf8') as fin:
                table = read_cleaned_table(fin)
            with open(prefix + '-clean.html', 'w', 'utf8') as fout:
                write_cleaned_table(table, fout)

if __name__ == '__main__':
    main()

