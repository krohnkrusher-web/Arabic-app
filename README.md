# ג׳ד׳ר (Jidhr) · שורש היום

A daily Arabic root puzzle for Hebrew speakers. Guess today's three-letter root in six tries, then see the family of words it grows, in Modern Standard Arabic and Palestinian Arabic, with Hebrew meanings and transliteration in Hebrew letters.

"Jidhr" (جذر, root) is a working name.

## Run it

```sh
npm install
npm run dev     # local server
npm test        # puzzle logic and content checks
npm run build   # static site in dist/
```

Pushing to `main` builds and deploys to GitHub Pages (turn it on once under Settings → Pages → Source: GitHub Actions).

## Adding a day

Content lives in `content/he-ar/` (Hebrew speakers learning Arabic; a later Arabic-to-Hebrew edition gets its own folder).

- `days/NN.json` is one day: the root, a Hebrew clue, the Hebrew cousin root shown in the reveal (or null), an optional fun fact, and 8 to 12 family words. Each word has the Arabic with vowel marks, its Hebrew meaning, a Hebrew-letter transliteration, and a register: `msa`, `pal` or `both`. `audio` can point to a recorded file once recordings exist; until then the phone's Arabic voice reads the word.
- `roots.json` is the list of real roots the puzzle recognises. A wrong guess that is a real root shows one word from it.

Days are played in file order, one per calendar day from 28 October 2026, and loop when they run out. `npm test` checks every day file.

Transliteration follows the Israeli school convention: ج = ג׳, خ = ח׳, ذ = ד׳, ث = ת׳, ض = צ׳, ظ = ט׳, غ = ע׳. Hamza is a single key (ء) whatever its seat.
