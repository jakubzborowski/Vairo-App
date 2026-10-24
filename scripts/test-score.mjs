// Isolated PostgreSQL integration test. Install PGlite into ignored .next first:
// npm install --prefix .next/score-verification --no-save --package-lock=false @electric-sql/pglite
// node scripts/test-score.mjs
import { PGlite } from "../.next/score-verification/node_modules/@electric-sql/pglite/dist/index.js";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
let checks = 0;
const check = (value, expected, label) => {
  assert.equal(value, expected, label);
  checks++;
};
async function value(sql) {
  return (await db.query(sql)).rows[0].value;
}
async function rejected(sql, label) {
  await assert.rejects(db.exec(sql), undefined, label);
  checks++;
}
try {
  // Minimal domain fixture; production domain guards remain in migrations 003–021.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    create table profiles(id uuid primary key,full_name text default 'User');
    create table startups(id uuid primary key);
    create table startup_members(startup_id uuid,profile_id uuid,role text);
    create function is_startup_member(s uuid) returns boolean language sql as $$select exists(select 1 from startup_members where startup_id=s and profile_id=auth.uid())$$;
    create function can_edit_startup(s uuid) returns boolean language sql as $$select exists(select 1 from startup_members where startup_id=s and profile_id=auth.uid() and role in ('founder','admin'))$$;
    create table goals(id uuid primary key default gen_random_uuid(),startup_id uuid,owner_id uuid,status text default 'todo',archived_at timestamptz,proof_requirement jsonb default '{}',proof_snapshot jsonb,title text default 'Goal');
    create table tasks(id uuid primary key default gen_random_uuid(),goal_id uuid,startup_id uuid,owner_id uuid,status text default 'todo',title text default 'Task',created_at timestamptz default now());
    create function proof_matches(r jsonb,s jsonb) returns boolean language sql as $$select s is not null and s <> '{}'::jsonb$$;
    create table startup_files(id uuid primary key default gen_random_uuid(),startup_id uuid,storage_path text,size_bytes bigint,uploaded_by uuid,name text);
    create table storage.objects(bucket_id text,name text,metadata jsonb);
    create table stage_templates(id uuid primary key,key text,title text,published_at timestamptz);
    create table stage_categories(id uuid primary key,template_id uuid,key text,always_active boolean);
    create table stage_points(id uuid primary key,category_id uuid,title text);
    create table stage_subpoints(id uuid primary key,point_id uuid,is_optional boolean default false,skip_when jsonb);
    create table startup_stages(id uuid primary key,startup_id uuid,template_id uuid,status text default 'in_progress');
    create table startup_categories(startup_id uuid,category text);
    create table stage_subpoint_progress(startup_stage_id uuid,subpoint_id uuid,is_complete boolean);
    create table stage_fields(subpoint_id uuid,is_required boolean,answer_key text);
    create table stage_answers(startup_stage_id uuid,answer_key text,value jsonb);
    create function subpoint_goals_met(s uuid,p uuid) returns boolean language sql as $$select true$$;
    create table stage_closures(startup_stage_id uuid,decision text,closed_by uuid);
    create table messages(id uuid primary key,conversation_id uuid,sender_id uuid,body text,created_at timestamptz default now());
    create table conversation_participants(conversation_id uuid,profile_id uuid);
    insert into profiles(id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
    insert into startups values ('10000000-0000-0000-0000-000000000001');
    insert into startup_members select '10000000-0000-0000-0000-000000000001',id,case when id::text like '%1' then 'founder' else 'member' end from profiles;
    set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
  `);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/022_score.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(await readFile(new URL("../supabase/migrations/022_score.sql", import.meta.url),"utf8"));
  checks++;
  await db.exec(`insert into goals(id,startup_id,owner_id) values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
    insert into tasks(goal_id,startup_id,owner_id,status) select '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','done' from generate_series(1,8);`);
  check(
    await value("select count(*)::int as value from score_events"),
    0,
    "Tasks without parent proof give zero",
  );
  await db.exec(
    `select score_assess('goal','20000000-0000-0000-0000-000000000001','large'); update goals set status='in_progress' where id='20000000-0000-0000-0000-000000000001'; update goals set status='todo' where id='20000000-0000-0000-0000-000000000001';`,
  );
  await rejected(
    "select score_assess('goal','20000000-0000-0000-0000-000000000001','standard')",
    "Assessment cannot change after reopening",
  );
  await db.exec(
    `update goals set status='completed',proof_snapshot='{"kind":"sentence","text":"unique result"}' where id='20000000-0000-0000-0000-000000000001'`,
  );
  check(
    await value(
      "select sum(points)::int as value from score_events where kind='goal'",
    ),
    80,
    "Approved large goal earns 80",
  );
  check(
    await value(
      "select sum(points)::int as value from score_events where kind='task'",
    ),
    30,
    "Tasks share 30pt parent cap",
  );
  check(
    await value(
      "select count(*)::int as value from score_events where profile_id='00000000-0000-0000-0000-000000000001'",
    ),
    0,
    "Owner earns, not clicking admin",
  );
  await db.exec(
    `update goals set status='todo'; update goals set status='completed';`,
  );
  check(
    await value(
      "select count(*)::int as value from score_events where kind='goal'",
    ),
    1,
    "Recompletion cannot farm XP",
  );
  await db.exec(
    `insert into goals(startup_id,owner_id,status,proof_snapshot) values('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','completed','{"kind":"sentence","text":"unique result"}');`,
  );
  check(
    await value(
      "select count(*)::int as value from score_events where kind='goal'",
    ),
    1,
    "Reused proof cannot farm goals",
  );
  // A full point + a real continue closure award once, skipped conditions never award.
  await db.exec(`insert into stage_templates values('30000000-0000-0000-0000-000000000001','idea','Idea',now());
    insert into stage_categories values('30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','general',true);
    insert into stage_points values('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','First point');
    insert into stage_subpoints(id,point_id) values('30000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003');
    insert into startup_stages(id,startup_id,template_id) values('30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
    insert into stage_subpoint_progress values('30000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000004',true);
    insert into stage_closures values('30000000-0000-0000-0000-000000000005','continue',auth.uid());
    update startup_stages set status='completed';`);
  check(
    await value(
      "select sum(points)::int as value from score_events where kind='point'",
    ),
    25,
    "Point awards automatically",
  );
  check(
    await value(
      "select sum(points)::int as value from score_events where kind='stage'",
    ),
    150,
    "Stage awards automatically",
  );
  await db.exec(`insert into startup_files(startup_id,storage_path,size_bytes,uploaded_by,name) values
    ('10000000-0000-0000-0000-000000000001','proof-empty',0,'00000000-0000-0000-0000-000000000002','Empty'),
    ('10000000-0000-0000-0000-000000000001','proof-full',123,'00000000-0000-0000-0000-000000000002','Research');
    insert into storage.objects values('stage-files','proof-empty','{"size":0,"eTag":"empty"}'),('stage-files','proof-full','{"size":123,"eTag":"full"}');
    insert into goals(startup_id,owner_id,status,proof_snapshot) values
    ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','completed','{"kind":"file","file":{"path":"proof-empty"}}');`);
  check(
    await value(
      "select count(*)::int as value from score_events where kind='goal'",
    ),
    1,
    "Empty file cannot reward goal",
  );
  check(
    await value(
      "select count(*)::int as value from score_events where kind='document'",
    ),
    0,
    "Empty file gives no document points",
  );
  await db.exec(`insert into goals(startup_id,owner_id,status,proof_snapshot) values
    ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','completed','{"kind":"file","file":{"path":"proof-full"}}');`);
  check(
    await value(
      "select sum(points)::int as value from score_events where kind='document'",
    ),
    10,
    "Real file used as proof rewards uploader",
  );
  await db.exec(`insert into goals(startup_id,owner_id,status,proof_snapshot) values
    ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','completed','{"kind":"file","file":{"path":"proof-full"}}');`);
  check(
    await value(
      "select sum(points)::int as value from score_events where kind='document'",
    ),
    10,
    "Reusing file does not reward upload twice",
  );
  // Skipped conditional point produces no bonus, even though engine marks it done.
  await db.exec(`insert into stage_points values('30000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000002','Skipped');
    insert into stage_subpoints(id,point_id,skip_when) values('30000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000006','{"answer_key":"skipchoice","equals":"skip"}');
    insert into stage_answers values('30000000-0000-0000-0000-000000000005','skipchoice','"skip"'); insert into stage_subpoint_progress values('30000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000007',true);`);
  check(
    await value(
      "select count(*)::int as value from score_events where kind='point'",
    ),
    1,
    "Skipped point gives no bonus",
  );
  await db.exec(`insert into stage_points values('30000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000002','Missing answer');
    insert into stage_subpoints(id,point_id) values('30000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000008');
    insert into stage_fields values('30000000-0000-0000-0000-000000000009',true,'required.answer');
    insert into stage_subpoint_progress values('30000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000009',true);`);
  check(await value("select count(*)::int as value from score_events where kind='point'"),1,"Spoofed progress with missing answers earns nothing");
  // Recomputed overview sums all rows, including history beyond the visible page.
  check(
    await value("select (score_overview()->>'work')::int as value"),
    175,
    "Overview sums authenticated user's actual awards",
  );
  // Feedback is tied to a genuine received message, not a self-issued award.
  await db.exec(`insert into conversation_participants values('40000000-0000-0000-0000-000000000001',auth.uid());
    insert into messages(id,conversation_id,sender_id,body) values('40000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',repeat('Helpful concrete feedback. ',8));
    select score_thank_message('40000000-0000-0000-0000-000000000002','help');`);
  check(
    await value(
      "select sum(points)::int as value from score_events where track='reputation'",
    ),
    10,
    "Recipient grants author reputation",
  );
  await db.exec(`insert into messages(id,conversation_id,sender_id,body) values
    ('40000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',repeat('Second useful message. ',8));`);
  await rejected("select score_thank_message('40000000-0000-0000-0000-000000000003','help')","Weekly pair limit enforced");
  await db.exec("set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';");
  await rejected("select score_thank_message('40000000-0000-0000-0000-000000000003','help')","Self-acknowledgment forbidden");
  await db.exec("set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';");
  await db.exec(`insert into startup_files(startup_id,storage_path,size_bytes,uploaded_by,name)
    select '10000000-0000-0000-0000-000000000001','document-cap-'||n,100,auth.uid(),'Document '||n from generate_series(1,4) n;
    insert into storage.objects select 'stage-files','document-cap-'||n,jsonb_build_object('size',100,'eTag','doccap-'||n) from generate_series(1,4) n;
    insert into goals(startup_id,owner_id,status,proof_snapshot)
    select '10000000-0000-0000-0000-000000000001',auth.uid(),'completed',jsonb_build_object('kind','file','file',jsonb_build_object('path','document-cap-'||n)) from generate_series(1,4) n;`);
  check(await value("select sum(points)::int as value from score_events where kind='document' and profile_id=auth.uid()"),30,"Daily document cap enforced");
  await db.exec(`insert into goals(startup_id,owner_id,status,proof_snapshot)
    select '10000000-0000-0000-0000-000000000001',auth.uid(),'completed',
      jsonb_build_object('kind','sentence','text','daily goal unique '||n) from generate_series(1,6) n;`);
  check(await value("select sum(points)::int as value from score_events where kind='goal' and profile_id=auth.uid()"),200,"Daily goal cap enforced");
  await rejected(
    "select score_thank_message('40000000-0000-0000-0000-000000000002','feedback')",
    "Cannot change kind and reward twice",
  );
  await db.exec(
    "set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003'; set role authenticated;",
  );
  check(
    await value("select count(*)::int as value from score_events"),
    0,
    "RLS hides another person's awards",
  );
  await rejected(
    "select score_award(auth.uid(),null,'goal','fake',9999,'fake')",
    "Award helper inaccessible to client",
  );
  await rejected(
    "insert into score_events(profile_id,kind,source_key,points,track,label) values(auth.uid(),'goal','fake',9999,'work','fake')",
    "Direct ledger writes denied",
  );
  await rejected(
    "select score_assess('goal','20000000-0000-0000-0000-000000000001','large')",
    "Member cannot set weight",
  );
  await rejected(
    "select score_thank_message('40000000-0000-0000-0000-000000000002','help')",
    "Outsider cannot acknowledge message",
  );
  console.log(`SCORE: ${checks} PostgreSQL checks passed.`);
} catch (error) {
  console.error(error.message, error.where ?? "", error.position ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
