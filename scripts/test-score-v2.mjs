// PostgreSQL regression probes P1–P8. Same temporary PGlite install as test-score.mjs.
import { PGlite } from "../.next/score-verification/node_modules/@electric-sql/pglite/dist/index.js";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
let checks = 0;
const uuid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const founder = uuid(1),
  member = uuid(2),
  admin = uuid(3),
  mentor = uuid(4),
  team = "10000000-0000-0000-0000-000000000001",
  template = uuid(201),
  category = uuid(202),
  point = uuid(203),
  subpoint = uuid(204),
  stage = uuid(205),
  condition = uuid(206);
const proof =
  "Przeprowadziliśmy rozmowy z sześcioma klientami i zapisaliśmy konkretne problemy oraz wyniki testu prototypu w raporcie.";
const note =
  "Sprawdziłem przedstawiony raport oraz opisane rezultaty pracy i potwierdzam ich zgodność z wymaganiami tego celu oraz zakresem programu.";
async function sql(t, p = []) {
  return db.query(t, p);
}
async function value(t) {
  return (await sql(t)).rows[0].value;
}
function eq(actual, expected, label) {
  assert.equal(actual, expected, label);
  checks++;
}
async function rejected(t, label) {
  const reviewCall = t.match(
    /^select score_review_(goal|program)\('([^']+)','([\s\S]*)'\)$/,
  );
  if (reviewCall) {
    const actor = await value("select auth.uid()::text as value");
    const expected = await reviewKey(reviewCall[1], reviewCall[2]);
    await user(actor);
    await assert.rejects(
      sql(`select score_review_${reviewCall[1]}($1,$2,$3)`, [
        reviewCall[2],
        reviewCall[3],
        expected,
      ]),
      undefined,
      label,
    );
    checks++;
    return;
  }
  await assert.rejects(db.exec(t), undefined, label);
  checks++;
}
async function user(id, role = true) {
  await db.exec(
    `reset role; set request.jwt.claim.sub='${id}';${role ? "set role authenticated;" : ""}`,
  );
}
async function root() {
  await db.exec("reset role;");
}
async function migrate(name) {
  await db.exec(
    await readFile(
      new URL(`../supabase/migrations/${name}`, import.meta.url),
      "utf8",
    ),
  );
}
let goalSeq = 1000;
async function goal({
  owner = member,
  text = proof,
  linked = true,
  status = "completed",
  whichTeam = team,
  whichCondition = condition,
} = {}) {
  const id = uuid(goalSeq++);
  await root();
  await sql(
    "insert into goals(id,startup_id,owner_id,status,proof_requirement,proof_snapshot) values($1,$2,$3,$4,'{\"kind\":\"sentence\"}',jsonb_build_object('kind','sentence','text',$5::text))",
    [id, whichTeam, owner, status, text],
  );
  if (linked)
    await sql("insert into goal_condition_links values($1,$2)", [
      whichCondition,
      id,
    ]);
  return id;
}
async function review(id, by = founder) {
  const expected = await reviewKey("goal", id);
  await user(by);
  await sql("select score_review_goal($1,$2,$3)", [id, note, expected]);
}
async function reviewKey(kind, id) {
  await root();
  const query =
    kind === "goal"
      ? "select score_goal_review_key($1) as value"
      : "select score_program_evidence(b.startup_stage_id,b.point_id) as value from score_program_claims c join score_program_batches b on b.id=c.batch_id where c.id=$1";
  return (await sql(query, [id])).rows[0]?.value;
}
async function reviewProgram(id, by) {
  const expected = await reviewKey("program", id);
  await user(by);
  await sql("select score_review_program($1,$2,$3)", [id, note, expected]);
}
try {
  // Reuse the v1 domain fixture, then load real proof/condition validators below.
  const oldTest = await readFile(
    new URL("test-score.mjs", import.meta.url),
    "utf8",
  );
  const fixture = oldTest.match(/await db\.exec\(`([\s\S]*?)`\);/)[1];
  await db.exec(fixture);
  await db.exec(`
    create role service_role;
    alter table goals add column created_at timestamptz default now(), add column goal_type_id text default 'build_result',add column due_date date default current_date;
    alter table stage_points add column key text default 'first-point',add column shared_key text;
    create table startup_goal_conditions(id uuid primary key,startup_id uuid,startup_stage_id uuid,subpoint_id uuid,goal_type_id text default 'build_result',match_any_type boolean default false,counts_when text default 'completed',min_count integer default 1,proof_kind text);
    create table goal_condition_links(condition_id uuid,goal_id uuid);
    create table stage_goal_conditions(id uuid primary key,subpoint_id uuid,goal_type_id text default 'build_result',match_any_type boolean default false,proof_kind text);
    alter table startup_goal_conditions add column template_condition_id uuid default '${uuid(207)}';
    insert into profiles(id) values('${mentor}');
    update startup_members set role='admin' where profile_id='${admin}';
    grant select on startup_members to authenticated;
  `);
  const domain = await readFile(
    new URL("../supabase/migrations/018_execution_goals.sql", import.meta.url),
    "utf8",
  );
  // Preserve function parameter names from the production definitions.
  await db.exec(
    "drop function proof_matches(jsonb,jsonb);drop function subpoint_goals_met(uuid,uuid);",
  );
  await db.exec(
    domain.slice(
      domain.indexOf("create or replace function public.proof_matches"),
      domain.indexOf("create or replace function public.goal_file_belongs"),
    ),
  );
  const conditions = await readFile(
    new URL(
      "../supabase/migrations/019_execution_content_rules.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(
    conditions.slice(
      conditions.indexOf(
        "create or replace function public.subpoint_goals_met",
      ),
      conditions.indexOf(
        "create or replace function public.refresh_one_subpoint",
      ),
    ),
  );
  await migrate("022_score.sql");
  // A genuine old award is retained for audit, not silently presented as verified.
  await db.exec(
    `insert into score_events(profile_id,kind,source_key,points,track,label) values('${member}','goal','legacy',40,'work','Old award');`,
  );
  await migrate("023_score_verification.sql");
  await migrate("023_score_verification.sql");
  checks++;
  await db.exec(`
    insert into stage_templates values('${template}','mvp','MVP Stage',now());
    insert into stage_categories values('${category}','${template}','general',true);
    insert into stage_points(id,category_id,title) values('${point}','${category}','Real work');
    insert into stage_subpoints(id,point_id) values('${subpoint}','${point}');
    insert into startup_stages(id,startup_id,template_id) values('${stage}','${team}','${template}');
    insert into startup_goal_conditions(id,startup_id,startup_stage_id,subpoint_id) values('${condition}','${team}','${stage}','${subpoint}');
    insert into stage_goal_conditions(id,subpoint_id) values('${uuid(207)}','${subpoint}');
  `);
  // P1: direct owner completion and arbitrary short evidence earn nothing.
  const short = await goal({ text: "x1" });
  await user(member);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    0,
    "Old unchecked awards excluded from verified rank",
  );
  eq(
    await value("select (score_overview()->>'legacy')::int as value"),
    40,
    "Legacy history preserved",
  );
  await rejected(
    `select score_review_goal('${short}','${note}')`,
    "Member cannot review",
  );
  await user(founder);
  await rejected(
    `select score_review_goal('${short}','${note}')`,
    "x1 cannot pass quality floor",
  );
  const custom = await goal({ linked: false });
  await user(founder);
  await rejected(
    `select score_review_goal('${custom}','${note}')`,
    "Unlinked own goal cannot earn SCORE",
  );
  await root();
  const fakeCondition = uuid(220);
  await sql(
    "insert into startup_goal_conditions(id,startup_id,startup_stage_id,subpoint_id,template_condition_id) values($1,$2,$3,$4,null)",
    [fakeCondition, team, stage, subpoint],
  );
  const fakeGoal = await goal({
    whichCondition: fakeCondition,
    text: "Przedstawiliśmy nowy wariant procesu dostawy uczestnikom badania oraz przygotowaliśmy szczegółowe zestawienie obserwacji i uzasadnienie decyzji produktowej.",
  });
  eq(
    await value(`select score_goal_eligible('${fakeGoal}') as value`),
    false,
    "A manually fabricated condition is not a program requirement",
  );
  await user(founder);
  await rejected(
    `select score_review_goal('${fakeGoal}','${note}')`,
    "Forged snapshot condition cannot be approved for SCORE",
  );
  const own = await goal({ owner: founder, status: "todo" });
  await user(founder);
  await rejected(
    `select score_assess('goal','${own}','large')`,
    "P4 Founder cannot rate own goal",
  );
  await user(admin);
  await sql("select score_assess('goal',$1,'large')", [own]);
  await root();
  await sql("update goals set status='completed' where id=$1", [own]);
  await user(founder);
  await rejected(
    `select score_review_goal('${own}','${note}')`,
    "Founder cannot approve own result",
  );
  await review(own, admin);
  eq(
    await value(
      "select coalesce(sum(points),0)::int as value from score_events where profile_id=auth.uid() and rules_version=2",
    ),
    0,
    "Reviewer does not get owner's points",
  );
  // Reviewed result gives owner and tasks their own awards, not the clicking admin.
  const verified = await goal();
  const staleKey = await reviewKey("goal", verified);
  await root();
  await sql(
    "insert into tasks(goal_id,startup_id,owner_id,status) select $1,$2,$3,'done' from generate_series(1,8)",
    [verified, team, member],
  );
  await user(founder);
  await assert.rejects(
    sql("select score_review_goal($1,$2,$3)", [verified, note, staleKey]),
    undefined,
    "A changed task snapshot requires a fresh review",
  );
  checks++;
  await rejected(
    `select score_review_goal('${verified}','${"c".repeat(80)}')`,
    "Repeated characters cannot serve as a review justification",
  );
  await user(member);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    0,
    "Done statuses alone do not pay",
  );
  await review(verified);
  await user(member);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    70,
    "Verified goal 40 plus bounded tasks 30",
  );
  // P2: punctuation/spacing/case do not create a fresh proof fingerprint.
  const punct = await goal({ text: proof.toUpperCase() + "..." });
  await user(founder);
  await rejected(
    `select score_review_goal('${punct}','${note}')`,
    "P2 punctuation cannot bypass proof dedup",
  );
  // Reopening invalidates approval; re-review does not pay a second time.
  await root();
  await sql("update goals set status='todo' where id=$1", [verified]);
  eq(
    await value(
      `select count(*)::int as value from score_reviews where goal_id='${verified}' and revoked_at is null`,
    ),
    0,
    "Reopening revokes review",
  );
  await sql("update goals set status='completed' where id=$1", [verified]);
  await review(verified);
  await user(member);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    70,
    "Reviewing again cannot replay XP",
  );
  // P3: sixth approved goal queues rather than disappearing.
  const texts = [
    "Dodatkowo wykonaliśmy analizę rynku dla grupy nauczycieli oraz zebraliśmy szczegółowe wyniki konsultacji w dokumencie.",
    "Zbadaliśmy proces obsługi zamówień klientów sklepu internetowego oraz opisaliśmy problemy związane z dostawami i płatnościami.",
    "Przetestowaliśmy nowy formularz rejestracji użytkowników aplikacji oraz zapisaliśmy obserwacje dotyczące błędów i oczekiwań uczestników.",
    "Przeanalizowaliśmy koszty produkcji urządzenia razem z dostawcami podzespołów oraz przygotowaliśmy szczegółowy plan zakupów materiałów.",
    "Zweryfikowaliśmy gotowość przedsiębiorców do zakupu abonamentu i udokumentowaliśmy przebieg rozmów sprzedażowych oraz otrzymane deklaracje.",
  ];
  let deferred;
  for (const text of texts) {
    deferred = await goal({ text });
    await review(deferred);
  }
  await user(member);
  eq(
    await value("select (score_overview()->>'pending')::int as value"),
    40,
    "P3 over-limit award remains queued",
  );
  await root();
  await sql(
    "update score_events set created_at=now()-interval '1 day' where profile_id=$1 and rules_version=2",
    [member],
  );
  await user(member);
  eq(
    await value("select (score_overview()->>'pending')::int as value"),
    0,
    "Next-day overview settles queue without reopening",
  );
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    270,
    "No approved points lost at daily limit",
  );
  // P5/P6/P7: real state counts, missing ledger history is irrelevant, mentor
  // updating progress never becomes the beneficiary or permanently blocks it.
  await root();
  await sql("insert into stage_subpoint_progress values($1,$2,true)", [
    stage,
    subpoint,
  ]);
  // Remove only unreviewed candidates to emulate a point completed before deployment.
  await db.exec(
    "delete from score_program_claims; delete from score_program_batches;",
  );
  await sql("insert into stage_closures values($1,'continue',$2)", [
    stage,
    founder,
  ]);
  await user(mentor, false);
  await sql("update startup_stages set status='completed' where id=$1", [
    stage,
  ]);
  eq(
    await value(
      "select sum(points)::int as value from score_program_claims c join score_program_batches b on b.id=c.batch_id where b.kind='stage'",
    ),
    150,
    "P6 full 150 pool despite absent point XP",
  );
  eq(
    await value(
      "select count(*)::int as value from score_program_claims where profile_id='00000000-0000-0000-0000-000000000004'",
    ),
    0,
    "P7 outsider mentor receives no team share",
  );
  const stageClaims = (
    await sql(
      "select c.*,b.kind from score_program_claims c join score_program_batches b on b.id=c.batch_id where b.kind='stage'",
    )
  ).rows;
  for (const claim of stageClaims) {
    await reviewProgram(
      claim.id,
      claim.profile_id === founder ? admin : founder,
    );
  }
  await root();
  eq(
    await value(
      "select sum(points)::int as value from score_events where kind='stage' and rules_version=2",
    ),
    150,
    "P5 total pool remains 150",
  );
  eq(
    await value(
      `select sum(points)::int as value from score_events where kind='stage' and rules_version=2 and profile_id='${founder}'`,
    ),
    50,
    "P5 Founder gets equal third, not clicking bonus",
  );
  const ownStage = stageClaims.find((c) => c.profile_id === founder);
  await user(founder);
  await rejected(
    `select score_review_program('${ownStage.id}','${note}')`,
    "Cannot approve own program share",
  );
  // Clone a startup and complete the same program: recipient scope keys span teams.
  await root();
  const clone = uuid(102),
    cloneStage = uuid(215),
    cloneCondition = uuid(216);
  await sql("insert into startups values($1)", [clone]);
  await sql(
    "insert into startup_members select $1,profile_id,role from startup_members where startup_id=$2",
    [clone, team],
  );
  await sql(
    "insert into startup_stages(id,startup_id,template_id) values($1,$2,$3)",
    [cloneStage, clone, template],
  );
  await sql(
    "insert into startup_goal_conditions(id,startup_id,startup_stage_id,subpoint_id) values($1,$2,$3,$4)",
    [cloneCondition, clone, cloneStage, subpoint],
  );
  const reused = await goal({
    whichTeam: clone,
    whichCondition: cloneCondition,
    text: proof,
  });
  await user(founder);
  await rejected(
    `select score_review_goal('${reused}','${note}')`,
    "Proof deduplication spans startups for the same owner",
  );
  const cg = await goal({
    whichTeam: clone,
    whichCondition: cloneCondition,
    text: "Zbudowaliśmy działający prototyp panelu administracyjnego oraz przedstawiliśmy go zespołowi klientów podczas spotkania demonstracyjnego.",
  });
  await review(cg);
  await root();
  await sql("insert into stage_subpoint_progress values($1,$2,true)", [
    cloneStage,
    subpoint,
  ]);
  await sql("insert into stage_closures values($1,'continue',$2)", [
    cloneStage,
    founder,
  ]);
  await sql("update startup_stages set status='completed' where id=$1", [
    cloneStage,
  ]);
  const duplicate = (
    await sql(
      "select c.id from score_program_claims c join score_program_batches b on b.id=c.batch_id where b.startup_id=$1 and b.kind='stage' and c.profile_id=$2",
      [clone, founder],
    )
  ).rows[0];
  await reviewProgram(duplicate.id, admin);
  await root();
  eq(
    await value(
      `select sum(points)::int as value from score_events where kind='stage' and rules_version=2 and profile_id='${founder}'`,
    ),
    50,
    "Cloned startups cannot multiply personal stage bonus",
  );
  // P8b: arbitrary repeated characters are not useful help.
  const convo = uuid(500),
    spam = uuid(501),
    msg = uuid(502);
  await sql("insert into conversation_participants values($1,$2),($1,$3)", [
    convo,
    founder,
    member,
  ]);
  await sql(
    "insert into messages(id,conversation_id,sender_id,body) values($1,$2,$3,repeat('c',80))",
    [spam, convo, member],
  );
  await user(founder);
  await rejected(
    `select score_thank_message('${spam}','help')`,
    "P8b 80 repeated chars do not earn reputation",
  );
  await root();
  await sql(
    "insert into messages(id,conversation_id,sender_id,body) values($1,$2,$3,$4)",
    [msg, convo, member, note],
  );
  await user(founder);
  await sql("select score_thank_message($1,'help')", [msg]);
  await user(member);
  eq(
    await value("select (score_overview()->>'reputation')::int as value"),
    10,
    "Substantial recipient-approved help earns reputation",
  );
  const before = await value(
    "select (score_overview()->>'work')::int as value",
  );
  eq(before, 360, "Reputation does not change work score (explicit policy)");
  await rejected(
    `select score_award(auth.uid(),null,'goal','fake',999,'fake')`,
    "Private old award helper inaccessible",
  );
  await rejected(
    `select score_process_queue('${founder}')`,
    "Cannot process someone else's queue from the client",
  );
  await rejected(
    `insert into score_reward_queue(profile_id,kind,source_key,points,label) values(auth.uid(),'goal','fake',999,'fake')`,
    "Client cannot create awards",
  );
  await user(mentor);
  eq(
    await value("select count(*)::int as value from score_reward_queue"),
    0,
    "Queue RLS hides others",
  );
  await rejected(
    `select score_review_goal('${cg}','${note}')`,
    "Outsider cannot approve team results",
  );
  // A pending reward cannot pay stale proof after the owner reopens it.
  let cancelled;
  for (let n = 0; n < 6; n++) {
    cancelled = await goal({
      owner: admin,
      text: `Sprawdziliśmy wariant rozwiązania ${n} dla odbiorców biznesowych oraz opisaliśmy wyniki eksperymentu i plan wdrożenia w szczegółowym raporcie.`,
    });
    await review(cancelled);
  }
  await user(admin);
  eq(
    await value("select (score_overview()->>'pending')::int as value"),
    40,
    "Another owner's overflow is visible",
  );
  await root();
  await sql("update goals set status='todo' where id=$1", [cancelled]);
  await user(admin);
  eq(
    await value("select (score_overview()->>'pending')::int as value"),
    0,
    "Reopening explicitly cancels stale pending XP",
  );
  eq(
    await value(
      `select count(*)::int as value from score_reward_queue where profile_id=auth.uid() and source_key='${cancelled}' and state='cancelled'`,
    ),
    1,
    "Cancellation is visible, not silently discarded",
  );
  console.log(
    `SCORE v2: ${checks} PostgreSQL regression checks passed (production proof and GoalCondition validators).`,
  );
} catch (error) {
  console.error(error.message, error.where ?? "", error.position ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
