"""Cruce data pipeline: pooled ENOE quarter pairs -> observed crossings out of call-center codes.
Usage: python3 build_data.py <enoe_dir> <sinco_txt> <out.json>
Strict filter (from the W9 fight): a 'crossing' = occupation code (p3) AND employer industry (p4a) both changed
between consecutive interviews of the same person. Cells < MIN are never emitted individually."""
import pandas as pd, numpy as np, sys, json, re, datetime
D, SINCO, OUT = sys.argv[1:4]
Q = ['2024_trim1','2024_trim2','2024_trim3','2024_trim4','2025_trim1','2025_trim2','2025_trim3','2025_trim4','2026_trim1','2026_trim2']
K = ['cd_a','ent','con','v_sel','n_hog','h_mud','n_ren']
ORIG = ['3212','4213','3122']
MIN = 10
names = {}
for l in open(SINCO, encoding='utf-8'):
    m = re.match(r'^\s*(\d{4})\s+(.+?)\s*$', l)
    if m and m.group(1) not in names and not m.group(2).endswith('-'):
        names[m.group(1)] = re.sub(r'\s+\d{4}\s.*$', '', m.group(2)).strip()
def suffix(q):
    y, t = q.split('_trim'); return f'{t}{y[2:]}'
def load(q):
    s = suffix(q)
    c = pd.read_csv(f'{D}/{q}/ENOE_COE1T{s}.csv', dtype=str, encoding='latin-1', usecols=lambda x: x in K+['cve_ent','n_ent','p3','p4a'])
    d = pd.read_csv(f'{D}/{q}/ENOE_SDEMT{s}.csv', dtype=str, encoding='latin-1', usecols=lambda x: x in K+['cve_ent','n_ent','emp_ppal','ingocup','fac_tri','r_def','c_res'])
    for f in (c, d): f.rename(columns={'cve_ent': 'ent'}, inplace=True)
    d = d[(d.r_def.str.strip() == '0') & (d.c_res.str.strip().isin(['1', '3']))].drop(columns=['r_def', 'c_res'])
    m = c.merge(d, on=K+['n_ent'], how='inner')
    for col in K+['n_ent','p3','p4a','emp_ppal']: m[col] = m[col].astype(str).str.strip()
    m['p3'] = m.p3.str.zfill(4).where(m.p3.str.isdigit(), '')
    m['ing'] = pd.to_numeric(m.ingocup, errors='coerce'); m['w'] = pd.to_numeric(m.fac_tri, errors='coerce')
    m['q'] = q
    return m[K+['n_ent','p3','p4a','emp_ppal','ing','w','q']]
data = {q: load(q) for q in Q}
print({q: len(v) for q, v in data.items()})
def wmed(df):
    d = df[(df.ing > 0) & df.w.notna()].sort_values('ing')
    if len(d) == 0: return None
    cw = d.w.cumsum(); return float(d.ing[cw >= d.w.sum()/2].iloc[0])
# wages: latest 4 quarters pooled
last4 = pd.concat([data[q] for q in Q[-4:]])
res = {'meta': {'generado': datetime.date.today().isoformat(), 'trimestres': [q.replace('_trim', ' T') for q in Q],
       'pares': len(Q)-1, 'minimo_celda': MIN, 'fuente': 'INEGI, ENOE microdatos (CSV), 2024 T1 a 2026 T2',
       'salarios': 'mediana ponderada (fac_tri) de ingocup>0, todos los ocupados en la clave, 2025 T3 a 2026 T2, pesos corrientes al mes'},
       'origenes': {}, 'salarios': {}}
codes_needed = set(ORIG)
pairs = []
for qa, qb in zip(Q[:-1], Q[1:]):
    a = data[qa]; b = data[qb]
    x = a[a.p3.isin(ORIG)].copy(); x = x[x.n_ent.astype(int) < 5]; x['nn'] = (x.n_ent.astype(int)+1).astype(str)
    bb = b.rename(columns={'n_ent': 'nn', 'p3': 'p3b', 'p4a': 'p4ab', 'ing': 'ingb', 'emp_ppal': 'empb'})[K+['nn','p3b','p4ab','ingb','empb']]
    m = x.merge(bb, on=K+['nn'], how='left', indicator=True)
    m['par'] = f'{qa}>{qb}'; pairs.append(m)
P = pd.concat(pairs)
for o in ORIG:
    po = P[P.p3 == o]; f = po[po._merge == 'both']
    notw = f.p3b.isna() | (f.p3b == '')
    same = f[f.p3b == o]
    mv = f[(~notw) & (f.p3b != o)]
    strict = mv[mv.p4a != mv.p4ab]
    vc = strict.p3b.value_counts()
    def pc(df):
        if len(df) == 0: return None
        ch = df.ingb/df.ing - 1
        return {'n': int(len(df)), 'sube': int((ch > .05).sum()), 'igual': int(((ch >= -.05) & (ch <= .05)).sum()), 'baja': int((ch < -.05).sum()),
                'mediana_cambio': round(float(ch.median()), 3)}
    dest = []
    for code, n in vc.items():
        if n < MIN: continue
        s = strict[strict.p3b == code]; p = s[(s.ing > 0) & (s.ingb > 0)]
        dest.append({'clave': code, 'nombre': names.get(code, '?'), 'n': int(n),
                     'informal_antes': int((s.emp_ppal == '1').sum()), 'informal_despues': int((s.empb == '1').sum()),
                     'ingreso_pareado': pc(p) if len(p) >= MIN else {'n': int(len(p))}})
        codes_needed.add(code)
    small = vc[vc < MIN]
    p = strict[(strict.ing > 0) & (strict.ingb > 0)]
    ps = same[(same.ing > 0) & (same.ingb > 0)]
    def pc(df):
        if len(df) == 0: return None
        ch = df.ingb/df.ing - 1
        return {'n': int(len(df)), 'sube': int((ch > .05).sum()), 'igual': int(((ch >= -.05) & (ch <= .05)).sum()), 'baja': int((ch < -.05).sum()),
                'mediana_cambio': round(float(ch.median()), 3)}
    first = [data[q] for q in Q]
    nq = np.mean([len(d[d.p3 == o]) for d in first]); wq = np.mean([d[d.p3 == o].w.sum() for d in first])
    res['origenes'][o] = {
        'nombre': names.get(o, '?'), 'muestra_promedio_trimestre': round(float(nq), 1), 'personas_estimadas': int(round(wq, -2)),
        'elegibles': int(len(po)), 'encontrados': int(len(f)), 'misma_ocupacion': int(len(same)), 'sin_trabajo': int(notw.sum()),
        'cambio_crudo': int(len(mv)), 'cambio_estricto': int(len(strict)),
        'destinos': dest, 'otros': {'n': int(small.sum()), 'ocupaciones': int(len(small))},
        'informal_antes': int((strict.emp_ppal == '1').sum()), 'informal_despues': int((strict.empb == '1').sum()),
        'ingreso_pareado': pc(p), 'control_se_quedaron': pc(ps),
        'ruido_industria_en_los_que_se_quedaron': round(float((same.p4a != same.p4ab).mean()), 3) if len(same) else None,
        'personas_distintas_que_cruzaron': int(strict[K].drop_duplicates().shape[0])}
for code in sorted(codes_needed | {'4222','2511','3115','4221','3213','3211','4211','4111'}):
    s = last4[last4.p3 == code]; med = wmed(s)
    res['salarios'][code] = {'nombre': names.get(code, '?'), 'mediana': round(med) if med else None,
                             'n_con_ingreso': int(((s.ing > 0)).sum()), 'n': int(len(s))}
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(json.dumps(res, ensure_ascii=False, indent=1)[:6000])
