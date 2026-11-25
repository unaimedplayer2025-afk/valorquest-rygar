# Valor Quest public research (no login)

Researched 2026-11-24 from public pages and directory listings only. No accounts were created and no authenticated endpoints were used. `scripts/help.pl`, `/valorquest/help/`, and `/valorquest/chardata/` require a session (login or redirect). Official in-game help, character data, and combat math are behind auth.

## Game

Valor Quest is a free persistent text-based incremental RPG with a retro graphical interface, by Matthew A. Butcher / Valor Quest LLC (https://valorquest.net). The world is **Deldya**, a rogue planet whose eras change when it reaches a new sun. The Champion, from the Lineage of Valor, can enable or disable slavery, fishing, or piracy for everyone in the new era.

**Factions (worldviews, not classes):** Freefishers, Pirates, and Slavers. Signup still posts a hidden default class of `Pugilist`. Rankings also show titles such as Tank, Ninja, Enigma, and Missionary.

**Loop:** Explore a 6-direction map (N/S/E/W/Up/Down). Recall (10 stamina) returns you to the Tree of Life in Siddun. Train 10 stats with a daily stamina pool. Auto-calculated combat against monsters (and later players). Earn Gold and Valor. Level up for skill points. Become Champion.

**Combat (public help):** Near towns, weaker monsters usually will not attack first; you choose to BATTLE. In dangerous areas they can attack on the move. Grey / green / red names show challenge. Outcomes: win, lose, stalemate, flee, or critical failure. Starter advice: "Try fighting some rats." A public screenshot lists "a few mosquitos" and a journal line about a "berserker beetle." No public HP/damage tables were found.

**Stats:** Strength, Agility, Intelligence, Endurance, Dexterity, Vitality, Perception, Wisdom, Charisma, Luck. Health regen 1/sec, stamina 1 per 5 sec.

**Economy:** Gold (unlimited carry, bank deposit cap). Valor rises with "good" acts and falls with "bad" ones, and gates later travel / Champion rank. Krill fishing from Fishouse Hall in Darjeal; sell at the Darjeal Market. Hourly vendor restock.

## Places in Deldya (public)

- **Siddun** (start): Tree of Life, Tavern, Smithy, Hotel, Armorer, Bank, Hospital, Library, Army Barracks, Temple of Darkness, Prison, Colossal Arena, Siddun Beach, West Fork
- **Ondi Desert / Kaza Oasis**
- **Great Nelvo Desert**, Impasse Point, Thunderstorm, Foothold (north toward Darjeal). Exits in the desert are confusing.
- **The Great Rift**, Rift Village, The Mines, The Sigal, East Fork
- **Darjeal**: Fishouse Hall, Market, Hospital, Gardens, Bathhouse
- **Podunk** (named on splash art; slave market is described in the public help and is not used in the action game)
- **Radiolands / Plumea** (area 010508): NPC Sparko, tin shack
- **Fungus Town**, Mt. Mushroom
- **Great Chakken Ocean** (the red ocean)
- **Sneak Valley** / "snake valley" (Morzek's boulder quest)

Only two public `.area` data files exist (`010508.area`, `10333.area`). They name exits, an NPC, and a tutorial, but not monster stats.

## Art collected

Public directory listings were open for `/valorquest/images/mobs/` (74 portraits), `/valorquest/images/npc/` (named portraits), `/valorquest/images/items/`, `/valorquest/areas/` (hundreds of 280×148 map viewports plus Siddun/Podunk maps), splash `images/index/`, UI, and faction cards. Source URLs are in `ref/MANIFEST.tsv`.

Skipped as unusable or third-party: large `.mic` Microsoft Image Composer sources; Apache `/icons/` file-type icons; Street Fighter and Darkstalkers-style placeholders in the mobs folder (`000000.png`, `000028.png`).

`player.png` is a HUD panel, not a body sprite. No official walk-cycle hero sheet was public, so the playable knight is the full-body silver knight already hosted in the mobs folder (`000024.png`), used only as the player and not as an enemy.
