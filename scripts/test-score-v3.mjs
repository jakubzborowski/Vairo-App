// N1/N2, scoped mentors and independent cron settlement. No remote database.
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
  outsider = uuid(5),
  team = "10000000-0000-0000-0000-000000000001";
const template = uuid(201),
  category = uuid(202),
  point = uuid(203),
  subpoint = uuid(204),
  stage = uuid(205),
  condition = uuid(206),
  templateCondition = uuid(207);
const proof =
  "Przeprowadziliśmy rozmowy z sześcioma klientami i zapisaliśmy konkretne problemy oraz wyniki testu prototypu w raporcie.";
const note =
  "Sprawdziłem przedstawiony raport oraz opisane rezultaty pracy i potwierdzam ich zgodność z wymaganiami tego celu oraz zakresem programu.";
const query = (text, params = []) => db.query(text, params);
const root = () => db.exec("reset role;");
async function user(id) {
  await db.exec(
    `reset role; set request.jwt.claim.sub='${id}';set role authenticated;`,
  );
}
async function value(text, params = []) {
  return (await query(text, params)).rows[0].value;
}
function eq(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  checks++;
}
async function denied(text, params, label, pattern) {
  await assert.rejects(query(text, params), pattern, label);
  checks++;
}
async function migrate(file) {
  await db.exec(
    await readFile(
      new URL(`../supabase/migrations/${file}`, import.meta.url),
      "utf8",
    ),
  );
}
async function key(id) {
  await root();
  return value("select score_goal_review_key($1) as value", [id]);
}
async function review(id, actor = founder) {
  const expected = await key(id);
  await user(actor);
  return query("select score_review_goal($1,$2,$3)", [id, note, expected]);
}
async function reviewDenied(id, actor, label, pattern) {
  const expected = await key(id);
  await user(actor);
  await denied(
    "select score_review_goal($1,$2,$3)",
    [id, note, expected],
    label,
    pattern,
  );
}
async function candidates(actor = founder, whichTeam = team) {
  await user(actor);
  return value("select score_review_candidates($1) as value", [whichTeam]);
}
let nextGoal = 1000;
async function goal({
  owner = member,
  text = proof,
  status = "completed",
  whichTeam = team,
  cond = condition,
} = {}) {
  const id = uuid(nextGoal++);
  await root();
  await query(
    "insert into goals(id,startup_id,owner_id,status,proof_requirement,proof_snapshot) values($1,$2,$3,$4,'{\"kind\":\"sentence\"}',jsonb_build_object('kind','sentence','text',$5::text))",
    [id, whichTeam, owner, status, text],
  );
  await query("insert into goal_condition_links values($1,$2)", [cond, id]);
  return id;
}
async function programReview(id, actor = mentor) {
  await root();
  const expected = await value(
    "select score_program_evidence(b.startup_stage_id,b.point_id) as value from score_program_claims c join score_program_batches b on b.id=c.batch_id where c.id=$1",
    [id],
  );
  await user(actor);
  return query("select score_review_program($1,$2,$3)", [id, note, expected]);
}
try {
  const old = await readFile(
    new URL("test-score.mjs", import.meta.url),
    "utf8",
  );
  await db.exec(old.match(/await db\.exec\(`([\s\S]*?)`\);/)[1]);
  await db.exec(`create role service_role;alter role service_role bypassrls;
    alter table startups add column name text default 'Test team';
    alter table goals add column created_at timestamptz default now(),add column goal_type_id text default 'build_result',add column due_date date default current_date;
    alter table stage_points add column key text default 'first-point',add column shared_key text;
    alter table stage_fields add column question text default 'Pytanie programu';
    create table startup_goal_conditions(id uuid primary key,startup_id uuid,startup_stage_id uuid,subpoint_id uuid,goal_type_id text default 'build_result',match_any_type boolean default false,counts_when text default 'completed',min_count integer default 1,proof_kind text,template_condition_id uuid default '${templateCondition}');
    create table goal_condition_links(condition_id uuid,goal_id uuid);
    create table stage_goal_conditions(id uuid primary key,subpoint_id uuid,goal_type_id text default 'build_result',match_any_type boolean default false,proof_kind text,min_count integer default 1);
    insert into profiles(id) values('${mentor}'),('${outsider}');update startup_members set role='admin' where profile_id='${admin}';
    grant select on startup_members to authenticated;
    drop function proof_matches(jsonb,jsonb);drop function subpoint_goals_met(uuid,uuid);`);
  const domain = await readFile(
    new URL("../supabase/migrations/018_execution_goals.sql", import.meta.url),
    "utf8",
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
  await migrate("023_score_verification.sql");
  await db.exec(`insert into stage_templates values('${template}','mvp','MVP Stage',now());
    insert into stage_categories values('${category}','${template}','general',true);
    insert into stage_points(id,category_id,title) values('${point}','${category}','Real work');
    insert into stage_subpoints(id,point_id) values('${subpoint}','${point}');
    insert into startup_stages(id,startup_id,template_id) values('${stage}','${team}','${template}');
    insert into stage_goal_conditions(id,subpoint_id) values('${templateCondition}','${subpoint}');
    insert into startup_goal_conditions(id,startup_id,startup_stage_id,subpoint_id) values('${condition}','${team}','${stage}','${subpoint}');`);
  const historical = await goal();
  await review(historical);
  await root();
  await migrate("024_score_mentors_and_condition_limits.sql");
  await migrate("024_score_mentors_and_condition_limits.sql");
  checks++;
  await user(member);
  eq(
    await value(
      "select (score_overview()->>'queue_scheduled')::boolean as value",
    ),
    false,
    "UI does not claim cron works before registration",
  );
  await root();
  eq(
    await value("select count(*)::int as value from score_condition_slots"),
    1,
    "Historical reviewed goal reserves a slot before new reviews",
  );
  eq(
    (await candidates()).goals.some((g) => g.id === historical),
    false,
    "Unchanged historical review does not reappear",
  );
  // N1: new task automatically exposes a second review without reopening goal.
  await root();
  await query(
    "insert into tasks(goal_id,startup_id,owner_id,status,title) values($1,$2,$3,'done','New verified task')",
    [historical, team, member],
  );
  eq(
    (await candidates()).goals.some(
      (g) => g.id === historical && g.rereview && g.eligible,
    ),
    true,
    "N1 changed task hash returns goal to review UI",
  );
  await user(member);
  const own = await value("select score_overview() as value");
  eq(
    own.awaiting_review.some((g) => g.id === historical),
    true,
    "Owner sees pending additional review",
  );
  await review(historical);
  await user(member);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    45,
    "Only new task pays; goal never pays twice",
  );
  eq(
    (await candidates()).goals.some((g) => g.id === historical),
    false,
    "Fresh hash hides reviewed goal again",
  );
  await root();
  eq(
    await value("select status as value from goals where id=$1", [historical]),
    "completed",
    "Goal was never reopened",
  );
  eq(
    await value("select count(*)::int as value from score_condition_slots"),
    1,
    "Re-review does not consume a second condition slot",
  );
  // N2: capacity is shared across owners, includes paid/pending, and comes from
  // both the snapshot and authoritative template rather than founder's edits.
  const second = await goal({
    text: "Sprawdziliśmy nowy proces obsługi zamówień klientów sklepu internetowego oraz opisaliśmy problemy dotyczące dostaw i płatności.",
  });
  await reviewDenied(
    second,
    founder,
    "N2 min_count=1 blocks second goal and its bundle",
    /min_count/,
  );
  const secondCandidate = (await candidates()).goals.find(
    (g) => g.id === second,
  );
  eq(
    secondCandidate.eligible,
    false,
    "UI marks quota-exhausted goal ineligible",
  );
  eq(
    secondCandidate.eligibility_reason.includes("min_count"),
    true,
    "UI explains full condition quota",
  );
  await root();
  await query("update startup_goal_conditions set min_count=99 where id=$1", [
    condition,
  ]);
  await reviewDenied(
    second,
    founder,
    "Editing snapshot min_count cannot inflate authoritative quota",
    /min_count/,
  );
  await root();
  await query("update startup_goal_conditions set min_count=2 where id=$1", [
    condition,
  ]);
  await query("update stage_goal_conditions set min_count=2 where id=$1", [
    templateCondition,
  ]);
  await review(second);
  await root();
  eq(
    await value("select count(*)::int as value from score_condition_slots"),
    2,
    "min_count=2 allows exactly two unique goals",
  );
  const third = await goal({
    owner: founder,
    text: "Przetestowaliśmy nowy formularz rejestracji użytkowników aplikacji oraz zapisaliśmy obserwacje dotyczące błędów i oczekiwań uczestników.",
  });
  await reviewDenied(
    third,
    admin,
    "Quota is shared across goal owners",
    /min_count/,
  );
  // Trusted mentor setup: ordinary team roles cannot appoint themselves.
  await user(founder);
  await denied(
    "insert into program_mentors(profile_id,operator_note) values($1,'self nomination')",
    [founder],
    "Founder cannot self-nominate a mentor",
    /permission denied/,
  );
  await denied(
    "insert into startup_mentors(startup_id,mentor_id) values($1,$2)",
    [team, mentor],
    "Founder cannot assign a mentor",
    /permission denied/,
  );
  await user(mentor);
  eq(
    await value("select score_can_review_startup($1) as value", [team]),
    false,
    "Unverified mentor has no permissions",
  );
  await root();
  await query(
    "insert into program_mentors(profile_id,operator_note) values($1,'Vairo operator verified')",
    [mentor],
  );
  await user(mentor);
  eq(
    await value("select score_can_review_startup($1) as value", [team]),
    false,
    "Verified but unassigned mentor has no startup access",
  );
  await root();
  await query("insert into startup_mentors values($1,$2,now(),null)", [
    team,
    mentor,
  ]);
  await user(mentor);
  eq(
    await value("select score_can_review_startup($1) as value", [team]),
    true,
    "Assigned mentor can review outside membership",
  );
  eq(
    (await query("select * from score_review_workspaces()")).rows.map(
      (r) => r.id,
    ),
    [team],
    "Mentor workspace selector is startup-scoped",
  );
  await root();
  await query("update startup_goal_conditions set min_count=20 where id=$1", [
    condition,
  ]);
  await query("update stage_goal_conditions set min_count=20 where id=$1", [
    templateCondition,
  ]);
  // Remove all team Admins: mentor can still assess and approve the Founder.
  await query(
    "update startup_members set role='member' where startup_id=$1 and profile_id=$2",
    [team, admin],
  );
  const founderGoal = await goal({
    owner: founder,
    status: "todo",
    text: "Opracowaliśmy plan dostaw urządzenia wraz z kosztami produkcji oraz uzyskaliśmy szczegółowe potwierdzenia od wybranych dostawców.",
  });
  await user(mentor);
  await query("select score_assess('goal',$1,'large')", [founderGoal]);
  eq(
    (
      await value("select score_assessment_candidates($1) as value", [team])
    ).some((g) => g.id === founderGoal),
    true,
    "Mentor can assess Founder work in SCORE",
  );
  await root();
  await query("update goals set status='completed' where id=$1", [founderGoal]);
  await review(founderGoal, mentor);
  await user(founder);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    80,
    "Founder without Admin receives mentor-approved SCORE",
  );
  await root();
  await query("insert into stage_subpoint_progress values($1,$2,true)", [
    stage,
    subpoint,
  ]);
  await query("update startup_goal_conditions set min_count=1 where id=$1", [
    condition,
  ]); // real program completion fixture
  await query("insert into stage_closures values($1,'continue',$2)", [
    stage,
    founder,
  ]);
  await query("update startup_stages set status='completed' where id=$1", [
    stage,
  ]);
  const claim = await value(
    "select c.id as value from score_program_claims c join score_program_batches b on b.id=c.batch_id where b.kind='stage' and c.profile_id=$1",
    [founder],
  );
  await programReview(claim);
  await user(founder);
  eq(
    await value("select (score_overview()->>'work')::int as value"),
    130,
    "Mentor approves Founder program share without becoming a recipient",
  );
  // Assignment revocation and storage read permissions stay scoped.
  await user(mentor);
  eq(
    await value("select score_mentor_file_allowed($1) as value", [
      team + "/proof.pdf",
    ]),
    true,
    "Assigned mentor can sign team's proof file",
  );
  eq(
    await value(
      "select score_mentor_file_allowed('unrelated/proof.pdf') as value",
    ),
    false,
    "Mentor cannot read another team's files",
  );
  await root();
  await query(
    "update startup_mentors set revoked_at=now() where startup_id=$1 and mentor_id=$2",
    [team, mentor],
  );
  await user(mentor);
  eq(
    await value("select score_can_review_startup($1) as value", [team]),
    false,
    "Revoked assignment immediately removes review rights",
  );
  await reviewDenied(third, mentor, "Revoked mentor cannot review", /mentor/);
  await root();
  await query(
    "update startup_mentors set revoked_at=null where startup_id=$1 and mentor_id=$2",
    [team, mentor],
  );
  await query("update startup_goal_conditions set min_count=20 where id=$1", [
    condition,
  ]);
  // Overflow remains pending; the scheduled worker pays without score_overview.
  for (let n = 0; n < 5; n++) {
    const id = await goal({
      text: `Zweryfikowaliśmy wariant rozwiązania ${n} podczas badania potrzeb klientów biznesowych oraz opisaliśmy wyniki eksperymentu i plan wdrożenia w szczegółowym raporcie.`,
    });
    await review(id);
  }
  await root();
  eq(
    await value(
      "select count(*)::int as value from score_reward_queue where profile_id=$1 and state='pending'",
      [member],
    ),
    2,
    "Overflow persists before cron",
  );
  await query(
    "update score_events set created_at=now()-interval '1 day' where profile_id=$1 and rules_version=2",
    [member],
  );
  // PGlite has no pg_cron daemon. Test the real registration call using a small
  // scheduling API fixture; then execute exactly the stored job command.
  await db.exec(`create schema cron;create table cron.job(jobid bigserial primary key,jobname text unique,schedule text,command text,active boolean default true);
    create function cron.schedule(text,text,text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values($1,$2,$3) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command,active=true returning jobid$$;`);
  const cronSql = await readFile(
    new URL("../supabase/migrations/025_score_cron.sql", import.meta.url),
    "utf8",
  );
  const register = cronSql
    .split("\n")
    .find((line) => line.startsWith("select cron.schedule("));
  await db.exec(register);
  await db.exec(register);
  eq(
    await value("select count(*)::int as value from cron.job"),
    1,
    "Cron installation is idempotent by job name",
  );
  eq(
    await value("select schedule as value from cron.job"),
    "*/5 * * * *",
    "Queue is scheduled every five minutes",
  );
  const command = await value("select command as value from cron.job");
  await db.exec(command);
  eq(
    await value(
      "select count(*)::int as value from score_reward_queue where profile_id=$1 and state='pending'",
      [member],
    ),
    0,
    "Cron command settles next-day queue without opening SCORE",
  );
  await user(member);
  eq(
    await value(
      "select (score_overview()->>'queue_scheduled')::boolean as value",
    ),
    true,
    "UI detects the registered active cron job",
  );
  await root();
  await db.exec(
    `grant usage on schema storage to authenticated;grant select on storage.objects to authenticated;alter table storage.objects enable row level security;`,
  );
  await query(
    "insert into storage.objects values('stage-files',$1,'{\"size\":100}'),('stage-files','unrelated/proof.pdf','{\"size\":100}')",
    [team + "/proof.pdf"],
  );
  await user(mentor);
  eq(
    await value("select count(*)::int as value from storage.objects"),
    1,
    "Real Storage RLS permits assigned mentor's file only",
  );
  await denied(
    "insert into storage.objects values('stage-files','injected','{}')",
    [],
    "Mentor has no Storage write grant",
    /permission denied/,
  );
  await user(outsider);
  eq(
    await value("select count(*)::int as value from storage.objects"),
    0,
    "Unassigned outsider sees no mentor Storage files",
  );
  let mentorDeferred;
  for (let n = 0; n < 4; n++) {
    mentorDeferred = await goal({
      owner: founder,
      text: `Sprawdziliśmy wariant produktu ${n} podczas konsultacji z klientami i opracowaliśmy szczegółowe zestawienie wyników badania oraz uzasadnienie dalszych działań zespołu.`,
    });
    await review(mentorDeferred, mentor);
  }
  await root();
  eq(
    await value(
      "select count(*)::int as value from score_reward_queue where source_key=$1 and state='pending'",
      [mentorDeferred],
    ),
    1,
    "Mentor-approved overflow waits for daily capacity",
  );
  await query(
    "update program_mentors set revoked_at=now() where profile_id=$1",
    [mentor],
  );
  await user(mentor);
  eq(
    await value("select count(*)::int as value from storage.objects"),
    0,
    "Global mentor revocation removes Storage access",
  );
  await root();
  await db.exec(command);
  eq(
    await value(
      "select count(*)::int as value from score_reward_queue where source_key=$1 and state='cancelled'",
      [mentorDeferred],
    ),
    1,
    "Worker does not pay an approval from a revoked mentor",
  );
  await query(
    "update program_mentors set revoked_at=null where profile_id=$1",
    [mentor],
  );
  // More than one batch, all at today's cap: the second sweep still visits
  // someone outside the first hundred rather than starving behind them.
  const blockedUsers = Array.from({ length: 101 }, (_, n) => uuid(20000 + n));
  for (const id of blockedUsers) {
    await query("insert into profiles(id) values($1)", [id]);
    await query(
      "insert into score_events(profile_id,kind,source_key,points,track,label,rules_version) select $1::uuid,'help',($1::uuid)::text||':'||n,10,'reputation','Previously awarded',2 from generate_series(1,2) n",
      [id],
    );
    await query(
      "select score_enqueue($1,null,'help',$2,10,'Awaiting help',null,$3)",
      [id, "batch:" + id, founder],
    );
  }
  await db.exec(command);
  eq(
    await value(
      "select count(*)::int as value from score_reward_queue where source_key like 'batch:%' and last_checked_at is not null",
    ),
    100,
    "Cron uses a bounded 100-user batch",
  );
  await db.exec(command);
  eq(
    await value(
      "select count(*)::int as value from score_reward_queue where source_key like 'batch:%' and last_checked_at is not null",
    ),
    101,
    "Blocked first batch cannot starve later users",
  );
  const definedGoal = await goal({
    status: "todo",
    owner: founder,
    text: "Plan wynikowy do uzupełnienia po zakończeniu pracy zespołu.",
  });
  await root();
  await query("update goals set proof_snapshot=null where id=$1", [
    definedGoal,
  ]);
  const programme = await candidates(mentor);
  eq(
    programme.program
      .flatMap((claim) => claim.context.goals)
      .find((g) => g.id === definedGoal)?.proof_snapshot,
    {},
    "Mentor context safely represents defined Goals without delivered proof",
  );
  await user(member);
  await denied(
    "select score_flush_due_rewards()",
    [],
    "User cannot run global cron worker",
    /permission denied/,
  );
  await denied(
    "select score_reserve_condition_slot($1)",
    [third],
    "Client cannot reserve quota slots",
    /permission denied/,
  );
  console.log(
    `SCORE v3: ${checks} PostgreSQL checks passed (N1/N2, mentor scoping, scheduled-worker settlement).`,
  );
} catch (error) {
  console.error(error.message, error.where ?? "", error.position ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
