"""Packs the social material into publishing order: one folder per day,
images or video plus a .txt with the caption to paste.
  python3 scripts/content-season2/pack.py <output-dir>            Instagram
  python3 scripts/content-season2/pack.py <output-dir> tiktok     TikTok
"""
import re, shutil, sys, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
R=os.path.abspath(sys.argv[1]); G='content-grid'; N='content-season2/out'
grid=open(f'{G}/README.md').read()
gpart, tpart = grid.split('# TikTok')
cap={m[0]:m[1].strip() for m in re.findall(r'\*\*(\d\d) · [^*]+\*\*\n```\n(.*?)```', gpart, re.S)}
tcap={m[0]:m[1].strip() for m in re.findall(r'\*\*(\d\d) · [^*]+\*\*[^\n]*\n```\n(.*?)```', tpart, re.S)}
assert len(cap)==12 and len(tcap)==3, (len(cap), len(tcap))
s2=re.findall(r'```[a-z]*\n(.*?)```', open('content-season2/README.md').read(), re.S)
bio, didascalia, adA, adB, adC = [x.strip() for x in s2[1:6]]
def w(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path,'w').write(text.strip()+'\n')
def cp(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(src, dst)
car=sorted(os.listdir(f'{N}/carosello'))

def tiktok():
    """Same days as the Instagram plan, so both accounts move together:
    photo carousels (TikTok "Foto") between the three videos."""
    tags = "#beachvolley #rivieraromagnola #rimini #riccione #sander"
    howto_photo = ("\n\n---\nTikTok → ＋ → Foto → seleziona le immagini in ordine (01, 02, …).\n"
                   "Aggiungi un suono di tendenza a volume basso. Orario consigliato: 18–21.")
    howto_video = ("\n\n---\nTikTok → ＋ → carica il video. È senza audio: aggiungi un suono di tendenza a volume basso.\n"
                   "Orario consigliato: 18–21.")
    plan = [
        (1, "carosello-stagione-2", [f'{N}/carosello/{f}' for f in car],
         f"stagione 2 di SANDER ☀️ il beach volley della Riviera in un'app: trova con chi giocare, tornei, classifica del tuo comune. gratis\n{tags} #stagione2"),
        (3, "video-sander", [f'{G}/tiktok/01-sander.mp4'], tcap['01']),
        (5, "carosello-scopri", [f'{N}/storie/scopri-{i}.jpg' for i in (1, 2, 3)],
         f"manca sempre il quarto? 👀 su Scopri trovi chi gioca vicino a te: like, match e si va in spiaggia\n{tags} #2vs2"),
        (7, "video-libero-oggi", [f'{G}/tiktok/02-libero-oggi.mp4'], tcap['02']),
        (9, "carosello-come-funziona", [f'{N}/storie/come-{i}.jpg' for i in (1, 2, 3)],
         f"come funziona SANDER in 3 foto 🏐 entri in un minuto, trovi una partita (o la crei), giochi e sali di livello\n{tags}"),
        (11, "video-piedi-nudi", [f'{G}/tiktok/03-piedi-nudi.mp4'], tcap['03']),
    ]
    lines = []
    for day, slug, files, caption in plan:
        D = f'{R}/GIORNO-{day:02d}-{slug}'
        video = files[0].endswith('.mp4')
        for i, f in enumerate(files, 1):
            cp(f, f'{D}/{slug}.mp4' if video else f'{D}/{i:02d}.jpg')
        w(f'{D}/didascalia.txt', caption + (howto_video if video else howto_photo))
        lines.append(f"GIORNO {day:02d} · {'video' if video else f'foto ({len(files)})'} · {slug.split('-', 1)[1]}")
    w(f'{R}/00-LEGGIMI-PRIMA.txt', """SANDER · TikTok · sequenza di pubblicazione

Segui le cartelle in ordine. I giorni sono gli stessi del piano Instagram:
pubblica su TikTok lo stesso giorno, a un altro orario se vuoi.
In ogni cartella: le immagini o il video + didascalia.txt da copiare.
Se salti un giorno, riprendi dalla cartella dopo: conta l'ordine, non la data.

"""+"\n".join(lines)+"""

Link nel profilo TikTok: https://www.sanderbv.it/?ref=tiktok
(il link in bio richiede un account aziendale o 1000 follower; fino ad allora scrivi sanderbv.it nella bio)""")

if sys.argv[2:] == ["tiktok"]:
    tiktok()
    sys.exit()

# Giorno 1 · lancio
D=f'{R}/GIORNO-01-lancio'
w(f'{D}/1-archivia-i-4-post-vecchi.txt', """PRIMA DI TUTTO
Sul profilo apri ognuno dei 4 post vecchi (le figure generate) → ⋯ → Archivia.
Non eliminarli: restano nascosti e li puoi ripristinare.""")
w(f'{D}/2-profilo.txt', f"""Modifica profilo

BIO (copia e incolla):
{bio}

LINK: https://www.sanderbv.it/?ref=ig_bio
CATEGORIA: App
PULSANTE: Iscriviti""")
stories=[("scopri-1","Scopri",""),("scopri-2","Scopri",""),("scopri-3","Scopri","Sticker LINK → https://www.sanderbv.it/?ref=ig_story"),
         ("tornei-1","Tornei",""),("tornei-2","Tornei",'Sticker SONDAGGIO: "Ci sei al prossimo?" Sì / Forse'),
         ("come-1","Come funziona","Sticker LINK → https://www.sanderbv.it/?ref=ig_story"),("come-2","Come funziona",""),("come-3","Come funziona",""),
         ("stagione1-1","Stagione 1","Dopo questa, pubblica anche le foto vere del torneo (se le hai)")]
lines=[]
for i,(n,h,st) in enumerate(stories,1):
    cp(f'{N}/storie/{n}.jpg', f'{D}/3-storie/{i:02d}-{n}.jpg')
    lines.append(f'{i:02d}-{n}.jpg  → evidenza "{h}"' + (f'\n     {st}' if st else ''))
w(f'{D}/3-storie/LEGGIMI.txt', "Pubblica le storie in quest'ordine, una dopo l'altra.\nSticker e testi stanno tra 250 px dall'alto e 340 px dal basso: lì lo spazio è già libero.\n\n"+"\n".join(lines))
covers=[("scopri","Scopri","01, 02, 03"),("tornei","Tornei","04, 05"),("come-funziona","Come funziona","06, 07, 08"),("stagione-1","Stagione 1","09 + foto del torneo")]
cl=[]
for i,(n,h,which) in enumerate(covers,1):
    cp(f'{N}/copertine/{n}.jpg', f'{D}/4-evidenze/{i}-{n}.jpg')
    cl.append(f'{i}. Evidenza "{h}" · copertina {i}-{n}.jpg · storie {which}')
w(f'{D}/4-evidenze/LEGGIMI.txt', "Profilo → ＋ Nuova (sotto la bio) → scegli le storie → Avanti → Modifica copertina → carica la copertina dalla galleria → scrivi il nome.\nL'ultima evidenza creata va a sinistra: creale dalla 4 alla 1, così Scopri resta prima.\n\n"+"\n".join(cl))
for i,f in enumerate(car,1):
    cp(f'{N}/carosello/{f}', f'{D}/5-carosello/slide-{i}.jpg')
w(f'{D}/5-carosello/didascalia.txt', didascalia+"""

---
Pubblica come UN post con le 6 slide in ordine (slide-1 … slide-6).
Dopo: ⋯ sul post → Fissa sul profilo.
Poi condividi il post nelle storie con lo sticker LINK → https://www.sanderbv.it/?ref=ig_story
Orario consigliato: 18–21.""")

# Giorni 2–13 · griglia, dal 12 all'01 (così la griglia appare in ordine)
order=sorted(os.listdir(f'{G}/out'), reverse=True)
tiktok={3:'01-sander',7:'02-libero-oggi',11:'03-piedi-nudi'}
for d,f in enumerate(order,2):
    num=f[:2]; slug=f[3:-4]
    D=f'{R}/GIORNO-{d:02d}-post-{slug}'
    cp(f'{G}/out/{f}', f'{D}/post-{slug}.jpg')
    w(f'{D}/didascalia.txt', cap[num]+"\n\n---\nPost nel feed. Orario consigliato: 18–21.")
    if d in tiktok:
        t=tiktok[d]
        cp(f'{G}/tiktok/{t}.mp4', f'{D}/extra-reel-tiktok-{t[3:]}.mp4')
        w(f'{D}/extra-reel-tiktok.txt', tcap[t[:2]]+"\n\n---\nStesso giorno, a un altro orario (es. 13:00): pubblicalo su TikTok e anche come Reel Instagram.\nIl video è senza audio: aggiungi un suono di tendenza a volume basso.\nSul Reel Instagram disattiva \"Mostra nella griglia del profilo\": così la griglia resta in ordine.")
    if d==5:
        A=f'{D}/SPONSORIZZATA'
        for i in (1,3,4,6): cp(f'{N}/carosello/{car[i-1]}', f'{A}/immagini/slide-{i}.jpg')
        cp(f'{G}/tiktok/01-sander.mp4', f'{A}/video-01-sander.mp4')
        w(f'{A}/testi-e-impostazioni.txt', f"""PARTI OGGI CON LA SPONSORIZZATA (ci sono già 4 post nuovi in griglia)

OBIETTIVO: Traffico (verso il sito)
CONTENUTO: carosello con immagini/slide-1,3,4,6  OPPURE  video-01-sander.mp4
LINK: https://www.sanderbv.it/scopri?ref=ig_ads
PUBBLICO: 18–35 anni · Rimini, Riccione, Cervia + 25–30 km · interessi: beach volley, pallavolo
BUDGET: 5–10 € al giorno per 7 giorni. Dopo 3 giorni spegni il testo che rende meno.
POSIZIONAMENTI: Feed + Storie + Reels Instagram
PULSANTE: Iscriviti

TESTO A
{adA[4:]}

TESTO B
{adB[4:]}

TESTO C
{adC[4:]}

TITOLI: Trova con chi giocare · Il beach volley della Riviera · Entra in campo, è gratis
DESCRIZIONE: Partite, tornei e classifica del tuo comune.

REGOLE META
- Parla di sport: niente promesse di incontri (la slide 5 del carosello resta fuori).
- Niente alcol: non usare i post 03-sticker e 04-giornata nell'inserzione.
- Niente marchi di terzi nelle immagini.""")

days=["GIORNO 01 · LANCIO\n  1. Archivia i 4 post vecchi\n  2. Aggiorna bio e link\n  3. Pubblica le 9 storie (in ordine)\n  4. Crea le 4 evidenze con le copertine\n  5. Pubblica il carosello, fissalo in alto, ricondividilo in storia\n"]
for d,f in enumerate(order,2):
    extra=[]
    if d in tiktok: extra.append("+ Reel/TikTok")
    if d==5: extra.append("+ PARTE LA SPONSORIZZATA")
    days.append(f"GIORNO {d:02d} · post {f[3:-4]} " + " ".join(extra))
w(f'{R}/00-LEGGIMI-PRIMA.txt', """SANDER · Stagione 2 · sequenza di pubblicazione

Segui le cartelle in ordine: GIORNO-01, GIORNO-02, …
In ogni cartella trovi le immagini e un .txt con la didascalia da copiare.
Un post al giorno, la sera (18–21). Se salti un giorno, riprendi dalla cartella dopo: conta l'ordine, non la data.

I post della griglia escono dal 12 all'01 apposta: su Instagram l'ultimo
pubblicato va in alto a sinistra, così alla fine la griglia si legge in ordine.

"""+"\n".join(days)+"""

Account: @sanderbeachvolley · Sito: sanderbv.it""")
