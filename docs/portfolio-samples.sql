-- Repeatable sample expansion. Run with the database data tool, not the schema migration tool.
-- Existing accounts and their actions/outreach are never overwritten.
WITH names AS (
  SELECT name, ord::integer AS n FROM unnest(ARRAY[
    'Atlas Freight','Meridian Labs','Cedar Systems','Harbor Finance','Lumina Care',
    'Fieldwork Software','Orbit Commerce','Vertex Manufacturing','Juniper Energy','Beacon Education',
    'Clearwater Networks','Summit Legal','Mosaic Media','Relay Operations','Evergreen Foods',
    'Pioneer Robotics','Sable Security','Horizon Travel','Cobalt Research','Meadow Insurance',
    'SignalWorks','Bridgepoint Consulting','Lattice Supply','Nova Diagnostics','Willow Properties',
    'Acorn Learning','Vector Mobility','Prism Payments','Oakwell Partners','TransitCloud',
    'Crestline Engineering','Daybreak Studio','Echo Telecom','Fable Publishing','Granite Construction',
    'Helix Biotech','Indigo Warehousing','Keystone Services','Leafline Agriculture','MotionFleet',
    'Nimble Procurement','Openwater Maritime','Pinecrest Dental','Quarry Materials','Rivermark Utilities'
  ]) WITH ORDINALITY AS x(name, ord)
), samples AS (
  SELECT *, CASE WHEN n % 5 = 0 THEN 'high' WHEN n % 3 = 0 THEN 'rising' ELSE 'calm' END AS risk,
    CASE WHEN n % 9 = 0 THEN 'Unassigned' ELSE (ARRAY['Devon','Aisha','Tomás','Marta'])[1 + (n % 4)] END AS csm,
    CASE WHEN n % 11 = 0 THEN 0 ELSE (n * 7) % 61 END AS age,
    CASE WHEN n % 7 = 0 THEN 'handled' ELSE 'open' END AS workflow
  FROM names
)
INSERT INTO public.accounts (id,name,arr_eur,level,owner,last_touch_days,reason,verdict,signals,timeline,suggestion,status,handled_reason,handled_note,source)
SELECT 'sample-' || n, name, 4200 + ((n * 7300) % 118000), risk, csm, age,
  CASE risk WHEN 'high' THEN 'Usage falling, repeated support issues, champion quiet'
    WHEN 'rising' THEN 'Adoption slowing after team changes' ELSE 'Steady usage and an engaged customer team' END,
  CASE risk WHEN 'high' THEN 'Falling adoption and unresolved tickets need an owner-led follow-up.'
    WHEN 'rising' THEN 'A team change is slowing adoption; check in before it becomes a blocker.' ELSE 'Usage is stable and the customer team remains engaged.' END,
  jsonb_build_array(
    jsonb_build_object('label','Weekly active users','value',CASE risk WHEN 'high' THEN '−32%' WHEN 'rising' THEN '−12%' ELSE '+6%' END,'severity',CASE risk WHEN 'high' THEN 'bad' WHEN 'rising' THEN 'warn' ELSE 'none' END,'source','Product usage','series',CASE risk WHEN 'high' THEN '[60,58,56,53,48,44,41,40]'::jsonb WHEN 'rising' THEN '[50,51,49,48,47,46,45,44]'::jsonb ELSE '[40,41,40,42,43,42,44,45]'::jsonb END),
    jsonb_build_object('label','Support tickets, 14 days','value',CASE risk WHEN 'high' THEN '5' WHEN 'rising' THEN '2' ELSE '0' END,'severity',CASE risk WHEN 'high' THEN 'bad' ELSE 'none' END,'source','Intercom')),
  jsonb_build_array(
    jsonb_build_object('when','Today','text',CASE risk WHEN 'calm' THEN 'Usage remains steady across the customer team' ELSE 'Adoption review flagged a change in activity' END,'source','Product usage','warning',risk <> 'calm'),
    jsonb_build_object('when',CASE WHEN n % 11 = 0 THEN 'Since onboarding' ELSE age || ' days ago' END,'text',CASE WHEN n % 11 = 0 THEN 'No customer contact recorded' ELSE csm || ': customer check-in recorded' END,'source','HubSpot','warning',false)),
  'Hi Alex, I wanted to check how your team is getting on. Could we find 20 minutes this week to review adoption and any outstanding questions?',
  workflow, CASE WHEN workflow = 'handled' THEN 'reached_out' ELSE NULL END,
  CASE WHEN workflow = 'handled' THEN csm || ' reached out · watching for changes' ELSE NULL END, 'sample'
FROM samples ON CONFLICT (id) DO NOTHING;