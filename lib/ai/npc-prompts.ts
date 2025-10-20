// Enhanced NPC generation prompts using few-shot learning approach
// Inspired by lore generation patterns with rich examples

export const makeNPCPersonalityPrompt = (archetype: string, userPrompt: string, context: string) => {
  return `\
You are generating NPC data in a STRICT pipe-delimited format. DO NOT use markdown, headings, or any formatting. ONLY output the pipe-delimited line.

# MMORPG NPC Personalities
High-quality NPCs for fantasy MMORPGs. Each has depth, flaws, and memorable traits.

${context ? `## World Context\n${context}\n` : ''}

## Examples (FOLLOW THIS EXACT FORMAT)

NPC: "Grenda Ironforge" | Archetype: merchant | Traits: shrewd, greedy, paranoid | Goals: amass wealth, control market prices | Fears: bankruptcy, being robbed, losing reputation | Alignment: lawful-neutral | Backstory: Former adventurer who lost her leg to a dragon. Now runs the town's only smithy, using her knowledge of rare metals to price-gouge desperate heroes.

NPC: "Brother Aldric" | Archetype: mystic | Traits: wise, cryptic, patient, haunted | Goals: preserve forbidden knowledge, prevent catastrophe | Fears: the prophecy coming true, losing his sanity | Alignment: neutral-good | Backstory: A monk who read the Tome of Shadows and saw the end of the world. Now speaks in riddles to guide heroes without breaking his vow of silence.

NPC: "Tessa Quickblade" | Archetype: rogue | Traits: witty, secretive, loyal (to a few), ruthless | Goals: uncover her father's killer, build thieves guild | Fears: being forgotten, betrayal, dying alone | Alignment: chaotic-good | Backstory: Orphaned at 12 when assassins killed her merchant father. She learned the streets, the blade, and the value of information. Now she sells secrets to the highest bidder.

NPC: "Sir Dorian the Broken" | Archetype: warrior | Traits: honorable, haunted, alcoholic, protective | Goals: redeem his past failure, train worthy warriors | Fears: losing another squad, dying a coward | Alignment: lawful-good | Backstory: Once a legendary knight, lost his entire battalion in an ambush he should have seen coming. Now drowns his guilt in ale while training recruits at the local garrison.

NPC: "Maven Blackwood" | Archetype: scholar | Traits: obsessive, brilliant, socially awkward, reckless | Goals: prove her radical theories, gain academic recognition | Fears: being wrong, ridicule, burning her research | Alignment: true-neutral | Backstory: Expelled from the Mages College for experimenting with necromancy. Now works in a decrepit library, one breakthrough away from vindication or madness.

NPC: "Lord Cassius Vane" | Archetype: noble | Traits: charming, manipulative, elegant, ruthless | Goals: ascend to kingship, eliminate rivals, seduce power | Fears: exposure, assassination, losing his beauty | Alignment: lawful-evil | Backstory: Third son with no inheritance, poisoned his way up the family tree. Hosts lavish parties while plotting treason behind gilded doors.

NPC: "Old Jeb" | Archetype: commoner | Traits: superstitious, kind, simple, stubborn | Goals: protect his farm, marry off his daughter, survive winter | Fears: bandits, crop failure, the gods' wrath | Alignment: neutral-good | Backstory: A farmer who's worked the same land for 40 years. Lost his wife to plague, raised three kids alone. Knows every folk remedy and weather omen.

NPC: "Whisper" | Archetype: rogue | Traits: paranoid, efficient, cold, mysterious | Goals: complete contracts, stay alive, find her sister | Fears: her past catching up, torture, emotional attachment | Alignment: true-neutral | Backstory: An assassin who never speaks above a whisper. No one knows her real name. She's searching for her sister who was sold to slavers 10 years ago.

NPC: "Captain Mira Stormwind" | Archetype: warrior | Traits: brave, hot-headed, inspiring, reckless | Goals: rid seas of pirates, earn legendary status | Fears: drowning, mutiny, dying on land | Alignment: chaotic-good | Backstory: Daughter of a naval admiral, rejected arranged marriage to sail the seas. Lost her ship to pirates, now commands a vengeful crew hunting her betrayers.

NPC: "Grandmother Hecate" | Archetype: mystic | Traits: cackling, all-knowing, mischievous, creepy | Goals: test heroes' worth, maintain cosmic balance | Fears: being forgotten, the old ways dying | Alignment: true-neutral | Backstory: A witch older than the kingdom itself. Lives in a hut that walks on chicken legs. She knows every secret in the realm and trades them for favors.

NPC: "Finnian the Mad" | Archetype: scholar | Traits: eccentric, brilliant, paranoid, unpredictable | Goals: invent impossible machines, prove reality is simulation | Fears: being institutionalized, his inventions being weaponized | Alignment: chaotic-neutral | Backstory: A genius engineer who claims he can hear the "code of reality." His contraptions somehow work despite defying physics. Town thinks he's insane.

NPC: "Duke Renworth" | Archetype: noble | Traits: pompous, cowardly, wealthy, incompetent | Goals: maintain status, avoid danger, throw parties | Fears: war, poverty, hard work | Alignment: lawful-neutral | Backstory: Born into wealth, never worked a day in his life. Pays others to solve his problems while he enjoys wine and theater.

NPC: "Sarah Millstone" | Archetype: commoner | Traits: gossipy, friendly, nosy, helpful | Goals: know everyone's business, marry well, help neighbors | Fears: scandal, being left out, poverty | Alignment: neutral-good | Backstory: The village baker's daughter who knows every rumor before it spreads. She's genuinely kind but can't keep a secret to save her life.

NPC: "Marcus the Fence" | Archetype: merchant | Traits: sly, opportunistic, charming, untrustworthy | Goals: get rich, avoid jail, expand black market | Fears: city guards, angry customers, rival gangs | Alignment: chaotic-neutral | Backstory: A smooth-talking dealer in "hard to find items." He'll sell you anything for the right price, no questions asked. Probably stolen.

NPC: "Sister Evangeline" | Archetype: mystic | Traits: devoted, sheltered, naive, kind | Goals: spread faith, heal the sick, serve her god | Fears: losing faith, violence, temptation | Alignment: lawful-good | Backstory: Raised in a monastery, she's never seen the outside world. Her healing powers are real, but she's completely unprepared for the darkness beyond temple walls.

---
CRITICAL INSTRUCTION: Output ONLY a single line in the EXACT format shown above. Start with "NPC:" and use pipes "|" to separate fields. NO markdown, NO headings, NO extra text.
---

NPC: Archetype: ${archetype} | User Request: ${userPrompt}
`;
};

export const makeNPCPersonalityStop = () => ["\n\n", "NPC:"];

export const parseNPCPersonalityResponse = (resp: string) => {
  const parts = resp.split("|").map(p => p.trim());

  const name = parts[0]?.replace(/"/g, '').trim() || "Unknown NPC";
  const archetype = parts[1]?.replace("Archetype:", "").trim() || "commoner";
  const traits = parts[2]?.replace("Traits:", "").split(",").map(t => t.trim()) || [];
  const goals = parts[3]?.replace("Goals:", "").split(",").map(g => g.trim()) || [];
  const fears = parts[4]?.replace("Fears:", "").split(",").map(f => f.trim()) || [];
  const alignment = parts[5]?.replace("Alignment:", "").trim() || "true-neutral";
  const backstory = parts[6]?.replace("Backstory:", "").trim() || "";

  return {
    name,
    archetype,
    traits,
    goals,
    fears,
    moralAlignment: alignment,
    backstory
  };
};

export const makeNPCQuestPrompt = (npcName: string, archetype: string, backstory: string) => {
  return `\
You are generating quest data in a STRICT pipe-delimited format. DO NOT use markdown, headings, or any formatting. ONLY output the pipe-delimited line.

# MMORPG Quest Design
Rich, context-driven quests tied to NPC personalities and world lore.

## Quest Examples (FOLLOW THIS EXACT FORMAT)

Quest: "The Blacksmith's Apprentice" | Giver: Grenda Ironforge | Type: fetch | Objectives: [Locate apprentice:discover:apprentice_hideout:1], [Convince apprentice to return:social:apprentice:1] | Rewards: exp:200, gold:150, item:masterwork_hammer, reputation:ironforge_smithy:25 | Prerequisites: level:5, reputation:ironforge_smithy:10 | Tags: family, redemption, smithing

Quest: "Shadows in the Library" | Giver: Maven Blackwood | Type: investigation | Objectives: [Find missing research notes:fetch:ancient_tome:3], [Decipher cryptic symbols:puzzle:cipher_wheel:1], [Confront the thief:combat:shadow_mage:1] | Rewards: exp:500, gold:200, item:necromantic_focus, reputation:mages_college:-15 | Prerequisites: level:10, quest_complete:maven_introduction | Tags: necromancy, forbidden_knowledge, mystery

Quest: "Reclaim the Stormwind" | Giver: Captain Mira Stormwind | Type: combat | Objectives: [Board pirate flagship:stealth:ship_infiltration:1], [Defeat Captain Blackheart:kill:pirate_captain:1], [Reclaim ship's wheel:fetch:enchanted_wheel:1] | Rewards: exp:1500, gold:800, item:stormwind_compass, title:pirate_hunter | Prerequisites: level:25, reputation:naval_fleet:50 | Tags: pirates, revenge, naval_warfare

Quest: "The Prophecy Unfolds" | Giver: Brother Aldric | Type: epic_chain | Objectives: [Gather three sacred relics:fetch:relic:3], [Perform ritual at dawn:social:ritual_completion:1], [Face the darkness:combat:shadow_entity:1] | Rewards: exp:5000, gold:2000, item:blessing_of_the_ancients, unlock:prophecy_questline_2 | Prerequisites: level:40, quest_complete:shadows_rising | Tags: prophecy, world_ending, sacrifice

Quest: "Family Recipe" | Giver: Old Jeb | Type: gather | Objectives: [Collect herbs from forest:fetch:moonflower:5], [Hunt wild boar:kill:forest_boar:2], [Deliver to granddaughter:social:jeb_granddaughter:1] | Rewards: exp:50, gold:25, item:jeb_special_stew, reputation:village:5 | Prerequisites: none | Tags: cooking, family, simple_folk

Quest: "The Broken Knight's Redemption" | Giver: Sir Dorian | Type: escort | Objectives: [Protect merchant caravan:escort:merchants:1], [Defeat ambushing bandits:kill:bandit:8], [Ensure safe arrival:social:merchant_leader:1] | Rewards: exp:350, gold:180, item:dorian_recommendation_letter, reputation:city_guard:30 | Prerequisites: level:15, class:warrior_or_paladin | Tags: honor, redemption, combat

Quest: "Whispers in the Dark" | Giver: Whisper | Type: assassination | Objectives: [Infiltrate noble's manor:stealth:manor_infiltration:1], [Locate target:discover:noble_bedroom:1], [Eliminate target silently:kill:corrupt_noble:1] | Rewards: exp:800, gold:500, item:shadow_dagger, reputation:thieves_guild:40 | Prerequisites: level:20, class:rogue_or_assassin | Tags: assassination, stealth, morally_grey

Quest: "The Duke's Dilemma" | Giver: Duke Renworth | Type: diplomacy | Objectives: [Investigate threatening letters:discover:evidence:3], [Interrogate suspects:social:suspect:4], [Identify culprit:puzzle:deduction:1] | Rewards: exp:400, gold:300, item:ducal_favor_token, reputation:nobility:20 | Prerequisites: level:12, skill:persuasion:5 | Tags: politics, mystery, investigation

---
CRITICAL INSTRUCTION: Output ONLY a single line in the EXACT format shown above. Start with "Quest:" and use pipes "|" to separate fields. NO markdown, NO headings, NO extra text.
---

NPC: ${npcName} | Archetype: ${archetype} | Backstory: ${backstory}
Quest:`;
};

export const makeNPCQuestStop = () => ["\n\n", "Quest:", "NPC:"];

export const parseNPCQuestResponse = (resp: string) => {
  const parts = resp.split("|").map(p => p.trim());

  const title = parts[0]?.replace(/"/g, '').trim() || "Untitled Quest";
  const giver = parts[1]?.replace("Giver:", "").trim() || "Unknown";
  const type = parts[2]?.replace("Type:", "").trim() || "fetch";

  // Parse objectives: [description:type:target:quantity]
  const objectivesMatch = parts[3]?.match(/\[(.*?)\]/g) || [];
  const objectives = objectivesMatch.map(obj => {
    const cleaned = obj.replace(/[\[\]]/g, '');
    const [description, objType, target, quantity] = cleaned.split(":");
    return {
      type: (objType || "fetch") as "fetch" | "kill" | "escort" | "discover" | "craft" | "social",
      description: description?.trim() || "",
      target: target?.trim(),
      quantity: quantity ? parseInt(quantity) : 1
    };
  });

  // Parse rewards: exp:200, gold:150, item:sword, reputation:guild:25
  const rewardsStr = parts[4]?.replace("Rewards:", "").trim() || "";
  const rewardParts = rewardsStr.split(",").map(r => r.trim());

  let experience = 100;
  let gold = 50;
  const items: string[] = [];
  const reputation: {faction: string; amount: number}[] = [];

  rewardParts.forEach(part => {
    if (part.startsWith("exp:")) experience = parseInt(part.replace("exp:", ""));
    else if (part.startsWith("gold:")) gold = parseInt(part.replace("gold:", ""));
    else if (part.startsWith("item:")) items.push(part.replace("item:", ""));
    else if (part.startsWith("reputation:")) {
      const [_, faction, amount] = part.split(":");
      if (faction && amount) reputation.push({faction, amount: parseInt(amount)});
    }
  });

  const prerequisites = parts[5]?.replace("Prerequisites:", "").split(",").map(p => p.trim()).filter(p => p && p !== "none") || [];
  const loreTags = parts[6]?.replace("Tags:", "").split(",").map(t => t.trim()) || [];

  return {
    title,
    giver,
    type,
    objectives,
    rewards: {
      experience,
      gold,
      items: items.length > 0 ? items : undefined,
      reputation: reputation.length > 0 ? reputation : undefined
    },
    prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
    loreTags
  };
};

export const makeNPCDialoguePrompt = (npcName: string, personality: string, backstory: string) => {
  return `\
You are generating dialogue data in a STRICT pipe-delimited format. DO NOT use markdown, headings, or any formatting. ONLY output the pipe-delimited line.

# MMORPG NPC Dialogue Trees
Branching conversations with conditions, effects, and personality-driven responses.

## Dialogue Examples (FOLLOW THIS EXACT FORMAT)

Dialogue: greeting | NPC: Grenda Ironforge | Text: "Back again, are ye? My forge doesn't run on compliments. What do ye need?" | Conditions: none | Responses: [Show me your wares:shop_open:none] [I need a custom weapon:quest_offer:reputation:ironforge_smithy:>=10] [Just passing through:farewell:none]

Dialogue: shop_open | NPC: Grenda Ironforge | Text: "Aye, these are my finest works. Prices are non-negotiable." | Conditions: none | Effects: open_shop | Responses: [I'll take a look:end:none] [Too expensive:leave_shop:reputation:ironforge_smithy:-5]

Dialogue: quest_offer | NPC: Grenda Ironforge | Text: "Hmph. My lazy apprentice ran off to the tavern again. Fetch him back and I'll make it worth your while." | Conditions: reputation:ironforge_smithy:>=10 | Effects: start_quest:blacksmith_apprentice, flag:grenda_quest_active | Responses: [I'll find him:accept_quest:reputation:ironforge_smithy:+5] [Not my problem:reject_quest:none]

Dialogue: greeting | NPC: Brother Aldric | Text: "The threads of fate have brought you here... or perhaps you walk of your own accord?" | Conditions: none | Responses: [I seek wisdom:wisdom_request:none] [What do you know of the prophecy?:prophecy_talk:quest_complete:shadows_rising] [Goodbye:farewell:none]

Dialogue: prophecy_talk | NPC: Brother Aldric | Text: "The darkness stirs... Three relics must be united before the moon turns crimson, lest all fall to shadow." | Conditions: quest_complete:shadows_rising | Effects: start_quest:prophecy_unfolds, flag:prophecy_revealed | Responses: [Tell me more:prophecy_details:none] [How do I stop it?:quest_accept:none] [This is madness:deny_prophecy:reputation:monastery:-10]

Dialogue: greeting | NPC: Tessa Quickblade | Text: "Well, well. You look like someone who appreciates... discretion." | Conditions: none | Responses: [I need information:info_trade:gold:>=50] [I'm looking for work:quest_check:class:rogue] [I don't deal with criminals:hostile:reputation:thieves_guild:-25]

Dialogue: info_trade | NPC: Tessa Quickblade | Text: "Information isn't cheap, friend. 50 gold, and I'll tell you what I know about..." | Conditions: gold:>=50 | Effects: remove_gold:50, reveal_info:merchant_routes | Responses: [Deal:accept_trade:reputation:thieves_guild:+10] [Too rich for my blood:cancel_trade:none]

Dialogue: greeting | NPC: Sir Dorian | Text: "*takes a swig from flask* What do you want? Can't you see I'm busy drowning my sorrows?" | Conditions: time:night | Responses: [I heard you were a great warrior:story_request:none] [The garrison needs you:duty_call:reputation:city_guard:>=20] [Never mind:farewell:none]

Dialogue: duty_call | NPC: Sir Dorian | Text: "*slams fist on table* The garrison needs me? I FAILED them! Every last one of my men died because of me!" | Conditions: reputation:city_guard:>=20 | Effects: emotion:anger, flag:dorian_breakdown | Responses: [The past is past. They need you now:convince:skill:persuasion:>=7] [You're right. You're useless:provoke:reputation:city_guard:-15] [I'm sorry for your loss:empathy:none]

Dialogue: greeting | NPC: Old Jeb | Text: "Top o' the mornin'! Come to see the finest crops in three counties?" | Conditions: time:day | Responses: [Your farm looks wonderful:compliment:reputation:village:+2] [I need to buy supplies:shop_open:none] [Do you need any help?:quest_check:none]

---
CRITICAL INSTRUCTION: Output ONLY a single line in the EXACT format shown above. Start with "Dialogue:" and use pipes "|" to separate fields. NO markdown, NO headings, NO extra text.
---

NPC: ${npcName} | Personality: ${personality} | Backstory: ${backstory}
Dialogue:`;
};

export const makeNPCDialogueStop = () => ["\n\n", "Dialogue:", "NPC:"];

export const parseNPCDialogueResponse = (resp: string) => {
  const parts = resp.split("|").map(p => p.trim());

  const id = parts[0]?.trim() || "dialogue_" + Date.now();
  const text = parts[2]?.replace("Text:", "").replace(/"/g, '').trim() || "";
  const conditionsStr = parts[3]?.replace("Conditions:", "").trim();
  const conditions = conditionsStr && conditionsStr !== "none"
    ? conditionsStr.split(",").map(c => c.trim())
    : undefined;

  // Parse effects if present
  const effectsMatch = parts.find(p => p.includes("Effects:"));
  const effects = effectsMatch
    ? effectsMatch.replace("Effects:", "").split(",").map(e => e.trim())
    : undefined;

  // Parse responses: [text:nextNodeId:condition]
  const responsesMatch = parts.find(p => p.includes("Responses:"));
  const responses = responsesMatch
    ? (responsesMatch.match(/\[(.*?)\]/g) || []).map(r => {
        const cleaned = r.replace(/[\[\]]/g, '');
        const [text, nextNodeId, ...condParts] = cleaned.split(":");
        return {
          text: text?.trim() || "",
          nextNodeId: nextNodeId?.trim() || "end",
          effects: condParts.length > 0 ? condParts : undefined
        };
      })
    : [];

  return {
    id,
    text,
    conditions,
    responses
  };
};

export const makeNPCRelationshipPrompt = (npcName: string, archetype: string, backstory: string, contextNPCs: string[]) => {
  return `\
You are generating relationship data in a STRICT pipe-delimited format. DO NOT use markdown, headings, or any formatting. ONLY output the pipe-delimited line.

# MMORPG NPC Relationships
NPCs have complex relationships with other characters, creating a living world.

## Context NPCs
${contextNPCs.length > 0 ? contextNPCs.join("\n") : "No existing NPCs in this zone."}

## Relationship Examples (FOLLOW THIS EXACT FORMAT)

Relationships: NPC: Grenda Ironforge | Relations: [Marcus the Fence:rival:-60:He undercuts my prices with stolen goods:competitor], [Sir Dorian:ally:40:He protects my shipments from bandits:business_partner], [Town Guard Captain:neutral:15:Pays taxes on time:lawful_citizen]

Relationships: NPC: Brother Aldric | Relations: [Sister Evangeline:mentor:70:I taught her the healing arts:former_student], [Finnian the Mad:ally:50:We share forbidden knowledge:fellow_seeker], [Duke Renworth:enemy:-80:He burned our sacred texts:oppressor]

Relationships: NPC: Tessa Quickblade | Relations: [Whisper:ally:85:We trained together as children:childhood_friend], [Captain Mira:neutral:20:Hired me once for intel:past_client], [Lord Cassius:enemy:-95:He murdered my father:sworn_vengeance]

Relationships: NPC: Sir Dorian | Relations: [Old Jeb:friend:60:He supplies the garrison with food:trusted_supplier], [Captain Mira:rival:-30:She questions my tactical decisions:military_rivalry], [Brother Aldric:neutral:10:Seeks his counsel sometimes:spiritual_advisor]

Relationships: NPC: Captain Mira Stormwind | Relations: [Tessa Quickblade:ally:45:Best informant in the business:information_broker], [Blackheart the Pirate:enemy:-100:Stole my ship and killed my crew:mortal_enemy], [Duke Renworth:neutral:-20:Pompous fool who funds my fleet:necessary_patron]

Relationships: NPC: Maven Blackwood | Relations: [Finnian the Mad:romantic:75:Only one who understands my work:kindred_spirit], [Brother Aldric:ally:55:Exchanges forbidden texts:knowledge_trader], [Mages College Dean:enemy:-90:Expelled me for my research:academic_rival]

Relationships: NPC: Old Jeb | Relations: [Sarah Millstone:family:90:My daughter, though she talks too much:father], [Sir Dorian:friend:60:Supplies his garrison faithfully:loyal_customer], [Grenda Ironforge:neutral:25:Buys tools from her sometimes:occasional_customer]

Relationships: NPC: Whisper | Relations: [Tessa Quickblade:family:95:My sister, thought she was dead:long_lost_sibling], [Lord Cassius:enemy:-85:He's my next target:assassination_contract], [Marcus the Fence:ally:40:Sells my... acquisitions:fence]

Relationships: NPC: Grandmother Hecate | Relations: [Brother Aldric:neutral:80:Older than him, knows his secrets:ancient_peer], [Maven Blackwood:mentor:60:Taught her dark magic as a girl:former_apprentice], [Finnian the Mad:ally:70:Amused by his theories about reality:entertained_observer]

Relationships: NPC: Lord Cassius Vane | Relations: [Duke Renworth:rival:-40:Competing for the throne:political_rival], [Tessa Quickblade:enemy:-95:She hunts me for killing her father:vengeful_enemy], [Whisper:neutral:-60:Hired her for wetwork, doesn't know I'm her target:unaware_client]

---
CRITICAL INSTRUCTION: Output ONLY a single line in the EXACT format shown above. Start with "Relationships: NPC:" and use pipes "|" to separate fields. List relationships in brackets [name:type:strength:history:role]. NO markdown, NO headings, NO extra text. If no relationships, output: Relationships: NPC: ${npcName} | Relations: none
---

NPC: ${npcName} | Archetype: ${archetype} | Backstory: ${backstory}
Relationships:`;
};

export const makeNPCRelationshipStop = () => ["\n\n", "Relationships:", "NPC:"];

export const parseNPCRelationshipResponse = (resp: string) => {
  const relationshipsMatch = resp.match(/\[(.*?)\]/g) || [];

  const relationships = relationshipsMatch.map(rel => {
    const cleaned = rel.replace(/[\[\]]/g, '');
    const [npcName, type, strengthStr, history, role] = cleaned.split(":");

    return {
      npcId: npcName?.trim().toLowerCase().replace(/\s+/g, '_') || "unknown",
      name: npcName?.trim() || "Unknown NPC",
      type: (type?.trim() || "neutral") as "ally" | "rival" | "neutral" | "enemy" | "family" | "romantic" | "mentor",
      strength: strengthStr ? parseInt(strengthStr) : 0,
      history: history?.trim() || "",
      questRole: (role?.trim() || "observer") as "giver" | "helper" | "obstacle" | "beneficiary" | "observer"
    };
  });

  return relationships;
};

export const makeNPCBehaviorPrompt = (npcName: string, archetype: string, personality: string) => {
  return `\
You are generating behavior data in a STRICT pipe-delimited format. DO NOT use markdown, headings, or any formatting. ONLY output the pipe-delimited line.

# MMORPG NPC Behavior Patterns
NPCs follow daily schedules and react to events with priorities.

## Behavior Examples (FOLLOW THIS EXACT FORMAT)

Behavior: NPC: Grenda Ironforge | Schedule: [06:00:forge:heating_furnace], [08:00:shop_front:opening_shop], [12:00:shop_front:trading], [18:00:forge:crafting_orders], [22:00:home:resting] | Reactions: [player_greeting:gruff_welcome:1], [theft_attempt:call_guards:10], [haggling:firm_refusal:3], [quality_complaint:defensive_anger:5], [compliment:suspicious_thanks:2]

Behavior: NPC: Brother Aldric | Schedule: [00:00:temple:meditation], [06:00:library:studying_prophecies], [12:00:temple:prayer], [18:00:courtyard:tending_garden], [22:00:cell:resting] | Reactions: [player_greeting:cryptic_welcome:1], [prophecy_question:ominous_warning:8], [disrespect:silent_stare:4], [help_request:test_worthiness:6], [violence:flee_to_temple:10]

Behavior: NPC: Tessa Quickblade | Schedule: [02:00:hideout:planning_jobs], [10:00:market:gathering_intel], [14:00:tavern_backroom:meeting_contacts], [20:00:shadows:reconnaissance], [23:00:rooftops:patrolling] | Reactions: [player_greeting:assess_threat:2], [offer_job:negotiate_price:5], [guards_approach:vanish:10], [betrayal:swift_vengeance:9], [trust_shown:cautious_alliance:7]

Behavior: NPC: Sir Dorian | Schedule: [06:00:training_grounds:drilling_recruits], [10:00:garrison:administrative_work], [14:00:tavern:drinking], [18:00:training_grounds:evening_drills], [22:00:barracks:drunk_sleeping] | Reactions: [player_greeting:gruff_acknowledgment:1], [combat_threat:sober_up_and_fight:10], [respect_shown:share_war_stories:4], [pity_expressed:angry_rejection:6], [duty_call:reluctant_acceptance:8]

Behavior: NPC: Captain Mira Stormwind | Schedule: [05:00:docks:inspecting_ships], [08:00:harbor_master:planning_routes], [14:00:sea:sailing_patrol], [20:00:tavern:recruiting_crew], [23:00:ship_cabin:resting] | Reactions: [player_greeting:hearty_welcome:1], [pirate_sighting:immediate_pursuit:10], [crew_insult:challenge_to_duel:8], [sea_story:enthusiastic_sharing:3], [distress_signal:heroic_rescue:9]

Behavior: NPC: Maven Blackwood | Schedule: [08:00:library:researching], [12:00:laboratory:experimenting], [16:00:library:writing_notes], [20:00:study:forbidden_reading], [02:00:bed:restless_sleep] | Reactions: [player_greeting:distracted_hello:1], [research_question:passionate_explanation:7], [interruption:irritated_dismissal:5], [rare_book_offered:obsessive_interest:9], [college_mentioned:bitter_rant:6]

Behavior: NPC: Old Jeb | Schedule: [05:00:fields:tending_crops], [09:00:barn:feeding_animals], [12:00:home:lunch_with_family], [15:00:fields:harvesting], [18:00:village_square:socializing], [21:00:home:resting] | Reactions: [player_greeting:friendly_wave:1], [crop_threat:seek_help:8], [traveler_arrival:offer_hospitality:3], [superstition_confirmed:fearful_prayer:6], [family_threatened:protective_rage:10]

Behavior: NPC: Whisper | Schedule: [22:00:rooftops:surveillance], [01:00:target_location:reconnaissance], [03:00:hideout:reporting], [08:00:safe_house:resting], [16:00:market:blending_in] | Reactions: [player_greeting:silent_nod:1], [contract_offer:evaluate_target:7], [identity_questioned:vanish:10], [sister_mentioned:emotional_break:9], [trap_detected:counterattack:8]

Behavior: NPC: Grandmother Hecate | Schedule: [00:00:hut:brewing_potions], [06:00:forest:gathering_herbs], [12:00:hut:visitors_and_fortunes], [18:00:ritual_circle:dark_magic], [21:00:hut:cackling_to_self] | Reactions: [player_greeting:cryptic_cackle:1], [fortune_request:demand_payment:5], [disrespect:hex_curse:8], [worthy_hero:grant_boon:9], [old_ways_respected:share_wisdom:7]

Behavior: NPC: Lord Cassius Vane | Schedule: [10:00:court:political_maneuvering], [13:00:garden:secret_meetings], [16:00:study:plotting_schemes], [19:00:banquet_hall:hosting_parties], [23:00:chambers:seduction_or_assassination] | Reactions: [player_greeting:charming_smile:1], [political_opportunity:strategic_alliance:7], [threat_to_power:eliminate_discreetly:9], [compliment:vain_preening:3], [exposure_risk:ruthless_coverup:10]

---
CRITICAL INSTRUCTION: Output ONLY a single line in the EXACT format shown above. Start with "Behavior: NPC:" and use pipes "|" to separate Schedule and Reactions. List items in brackets [time:location:activity] and [trigger:response:priority]. NO markdown, NO headings, NO extra text.
---

NPC: ${npcName} | Archetype: ${archetype} | Personality: ${personality}
Behavior:`;
};

export const makeNPCBehaviorStop = () => ["\n\n", "Behavior:", "NPC:"];

export const parseNPCBehaviorResponse = (resp: string) => {
  // Format: Behavior: NPC: Name | Schedule: [item], [item], [item] | Reactions: [item], [item]
  // We need to extract everything between "Schedule:" and the next "|", same for Reactions

  const scheduleSection = resp.match(/Schedule:\s*(.+?)(?:\s*\|\s*Reactions:|$)/s);
  const reactionsSection = resp.match(/Reactions:\s*(.+?)(?:\s*$)/s);

  // Extract all schedule entries [time:location:activity]
  // Format: [08:00:tavern:serving_drinks] - note the time has TWO colons (HH:MM:location:activity)
  const scheduleMatches = scheduleSection ? scheduleSection[1].match(/\[([^\]]+)\]/g) : [];
  const schedule = scheduleMatches
    .map(s => {
      const cleaned = s.replace(/[\[\]]/g, '');
      const parts = cleaned.split(":");
      // Time is HH:MM (first two parts), then location, then activity
      if (parts.length >= 3) {
        return {
          time: `${parts[0]}:${parts[1]}`.trim(),
          location: parts[2]?.trim() || "unknown",
          activity: parts[3]?.trim() || "idle"
        };
      }
      return null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && !!s.time && !!s.location);

  // Extract all reaction entries [trigger:response:priority]
  const reactionMatches = reactionsSection ? reactionsSection[1].match(/\[([^\]]+)\]/g) : [];
  const reactions = reactionMatches
    .map(r => {
      const cleaned = r.replace(/[\[\]]/g, '');
      const [trigger, response, priorityStr] = cleaned.split(":");
      return {
        trigger: trigger?.trim() || "unknown",
        response: response?.trim() || "none",
        priority: priorityStr ? parseInt(priorityStr) : 1
      };
    })
    .filter(r => r.trigger && r.response);

  return {
    schedule,
    reactions
  };
};
