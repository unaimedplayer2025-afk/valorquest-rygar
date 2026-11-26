# VALOR QUEST: Chain of Deldya

A Rygar-style action platformer through the world of **Deldya**, built in the browser with Three.js and **Valor Quest** artwork used as-is (no restyling). The knight rides a black dragon, throws a chained spiked disc, fights the creatures of Deldya, and faces the Fire Drake at the Colossal Arena.

Art and setting are from [Valor Quest](https://valorquest.net) by Matthew A. Butcher / Valor Quest LLC. This is a fan action slice, not a substitute for the live text RPG.

**Play:** [https://unaimedplayer2025-afk.github.io/valorquest-rygar/](https://unaimedplayer2025-afk.github.io/valorquest-rygar/)

## Controls

- **WASD** or **arrow keys** — move (also aim the disc in eight directions)
- **Space** — tap to jump (variable height). Hold **Space** or **Up** to fly on the dragon; flight drains the Stamina bar and refills on the ground
- **Shift** — ground dash (a dragon swoop)
- **F** or **left click** — throw the chained disc from the knight. Hold to charge a bigger piercing throw. Press F as the disc comes back to catch it
- **M** — mute (music and SFX)
- Phone: left stick to move, FLY, DASH, and DISC
- At the start, the dragon eats a rat (about 2–3 seconds). Any key skips the intro.

## Stages

1. **Siddun — The Tree of Life** — rats, mosquito swarms, snakes, and slimes around the starting city
2. **Great Nelvo Desert — Impasse Point** — snakes, fire lizards, tentacle crabs, and berserker beetles
3. **The Mines — Fungus Town & the Rift** — spiders, plant beasts, red demons, and a green drake
4. **Colossal Arena — The Fire Drake** — a boss fight against the painted fire drake

## The black dragon

There is no black dragon in the public Valor Quest mob art. The mount is a recolor of the side-view **pink drake** (`images/mobs/000008.png`), kept in the original pixel style, with dark scales and a glowing gold eye. Matching bat-wing pieces were added so the mount can flap. Pink-drake enemies stay the original pink art, and the Fire Drake boss is unchanged so it does not look like the player's mount.

The game opens with a short intro: a Valor Quest rat (`images/mobs/000001.png`, the same rat sprite used as an enemy) scurries up, and the dragon lunges, chomps, and gulps. Any key skips it.

## Music

There is no music bed in this build (sound effects still play). Audio unlocks on the first key or tap, and **M** mutes. To add a track later, drop `audio/title-theme.{ogg,mp3}` and/or `audio/gameplay.{ogg,mp3}` in the `audio/` folder and set the matching path in `MUSIC` inside `src/audio.js`.

## Combat numbers

Official monster stats live behind the Valor Quest login (the public Game Help page does not list HP or damage). The numbers in this slice are estimates for the platformer, with **rats** as the weak starter enemies named in the public help, **mosquitoes** and a **berserker beetle** named in a public screenshot / journal line, and a large fire-drake portrait as the end boss.

## Credit and limits

- Artwork, names, and the world of Deldya belong to Valor Quest LLC.
- Two public mob images were skipped because they are clearly someone else's characters (a Street Fighter fighter and a Darkstalkers-style demon), not original Valor Quest art.
- The live RPG's slavery / slave-market systems are not part of this action game.
- A login is required to play the original Valor Quest and to see its in-game help, character data, and official combat math.

Local run: `python3 -m http.server 8788` then open `http://127.0.0.1:8788/`.
