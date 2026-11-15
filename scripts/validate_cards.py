#!/usr/bin/env python3
"""Validates the editable content before GitHub Pages deploys."""
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
LEVELS = {'easy', 'medium', 'hard', 'difficult'}
TRACKS = {'simple','continuous','perfect','perfect-continuous'}
ERAS = {'present','past','future'}

def load(name):
    try:
        return json.loads((ROOT/'data'/name).read_text(encoding='utf8'))
    except (ValueError, FileNotFoundError) as e:
        raise SystemExit(f'ERROR: data/{name} kann nicht geladen werden: {e}')


def validate():
    tenses=load('tenses.json'); cards=load('cards.json')
    errors=[]
    if not isinstance(tenses,list) or not isinstance(cards,list):
        raise SystemExit('ERROR: tenses.json und cards.json müssen JSON-Arrays sein.')
    ids={}
    for i,t in enumerate(tenses,1):
        if not isinstance(t,dict):errors.append(f'Tense #{i}: Objekt erwartet');continue
        for key in ('id','name','de','era','track','formula','when','short','signal','parts','examples','conjugation','tip','recognition'):
            if key not in t:errors.append(f'Tense #{i}: Feld {key!r} fehlt')
        if not all(k in t for k in ('id','era','track')):continue
        if t['id'] in ids:errors.append(f'Doppelte Tense-ID: {t["id"]}')
        ids[t['id']]=t
        if t['era'] not in ERAS or t['track'] not in TRACKS:errors.append(f'Ungültige Matrix-Position für {t["id"]}')
        if not isinstance(t.get('school'),bool):errors.append(f'{t["id"]}: school muss true oder false sein')
        if not all(k in t.get('examples',{}) for k in ('positive','negative','question')):errors.append(f'{t["id"]}: positive/negative/question fehlt')
    seen=set();count=Counter()
    for i,c in enumerate(cards,1):
        if not isinstance(c,dict):errors.append(f'Karte #{i}: Objekt erwartet');continue
        if not all(k in c for k in ('sentence','tense','difficulty')):
            errors.append(f'Karte #{i}: Pflichtfelder sentence/tense/difficulty fehlen');continue
        if not isinstance(c['sentence'],str) or not c['sentence'].strip():errors.append(f'Karte #{i}: Leerer Satz')
        if c['tense'] not in ids:errors.append(f'Karte #{i}: Unbekannte tense-ID {c["tense"]!r}')
        if c['difficulty'] not in LEVELS:errors.append(f'Karte #{i}: Unbekannte Schwierigkeit {c["difficulty"]!r}')
        if not isinstance(c.get('focus',''),str) or c.get('focus','') not in c['sentence']:
            errors.append(f'Karte #{i}: focus muss wörtlich im Satz vorkommen')
        key=(c['sentence'].lower(),c['tense'],c['difficulty'])
        if key in seen:errors.append(f'Karte #{i}: Doppelter Satz in derselben Kategorie')
        seen.add(key)
        count[(c['tense'],c['difficulty'])]+=1
    for id in ids:
        for level in LEVELS:
            if count[(id,level)]==0:errors.append(f'{id}: Keine Sätze für {level}')
    if errors:
        print('Datenprüfung fehlgeschlagen:')
        for msg in errors:print('  -',msg)
        raise SystemExit(1)
    print(f'OK: {len(tenses)} Zeitformen und {len(cards)} Beispielsätze geprüft.')
    print(f'Jede Zeitform besitzt Sätze in allen vier Schwierigkeiten. ✓')

if __name__=='__main__':validate()
