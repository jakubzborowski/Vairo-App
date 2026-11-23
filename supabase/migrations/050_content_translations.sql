-- 050 · Tłumaczenia treści etapów (de, uk, es)
--
-- WYGENEROWANE: node scripts/content-i18n.mjs build — nie edytować ręcznie.
-- Źródło: supabase/content/i18n/<język>/<etap>-v1.json. Wymaga 049.
-- Idempotentne: każde odpalenie ustawia `translations` od nowa; wiersze
-- bez tłumaczeń dostają '{}', więc usunięte tłumaczenie też znika z bazy.

begin;

-- ═══ ambition v1 ═══
update public.stage_templates t set translations = '{"de":{"title":"Ambition Stage","subtitle":"Deine erste Idee","intro":"Wann hast du zuletzt gedacht: „Das muss doch einfacher gehen“? Gleich wählst du eine solche Situation aus, überlegst dir, wie man sie verbessern könnte, und gibst deinem Projekt einen Namen. Dauer: etwa 10–15 Minuten. Kurze Antworten reichen. Du kannst später alles ändern.","finish_label":"Ich prüfe meine Idee"},"uk":{"title":"Ambition Stage","subtitle":"Твоя перша ідея","intro":"Коли тобі востаннє спадало на думку: «Мабуть, є простіший спосіб»? Зараз ти вибереш одну таку ситуацію, придумаєш, як її покращити, і даси своєму проєкту назву. Орієнтовний час: 10–15 хвилин. Достатньо коротких відповідей. Усе можна змінити пізніше.","finish_label":"Перевіряю свою ідею"},"es":{"title":"Ambition Stage","subtitle":"Tu primera idea","intro":"¿Cuándo pensaste por última vez: «Tiene que haber una forma más fácil»? Enseguida elegirás una situación así, pensarás cómo mejorarla y le pondrás nombre a tu proyecto. Tiempo aproximado: 10–15 minutos. Bastan respuestas cortas. Podrás cambiarlo todo más adelante.","finish_label":"Pongo a prueba mi idea"}}'::jsonb
  where t.key = 'ambition' and t.version = 1;
update public.stage_categories c set translations = '{"de":{"title":"Deine erste Idee"},"uk":{"title":"Твоя перша ідея"},"es":{"title":"Tu primera idea"}}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'ambition' and t.version = 1 and c.key = 'general';
update public.stage_points p set translations = '{"de":{"title":"Wähle etwas, das du ändern willst","duration_hint":"Etwa 3 Minuten","guide_body":"Such keine bahnbrechende Idee. Such eine Situation, die jemanden wirklich nervt — am besten eine, die du aus eigener Erfahrung kennst. Je konkreter die Situation, desto leichter lässt sie sich später überprüfen. „Menschen verlieren Zeit“ ist zu allgemein. „Die Inhaberin eines Cafés wirft jeden Tag unverkaufte Sandwiches weg“ ist etwas, wonach man eine konkrete Person fragen kann."},"uk":{"title":"Вибери те, що хочеш змінити","duration_hint":"Близько 3 хвилин","guide_body":"Не шукай проривної ідеї. Шукай ситуацію, яка когось справді дратує — найкраще таку, яку знаєш із власного досвіду. Що конкретніша ситуація, то легше буде її потім перевірити. «Люди втрачають час» — надто широко. «Власниця кав''ярні щодня викидає непродані сендвічі» — це те, про що можна запитати конкретну людину."},"es":{"title":"Elige algo que quieras cambiar","duration_hint":"Unos 3 minutos","guide_body":"No busques una idea revolucionaria. Busca una situación que de verdad moleste a alguien — mejor si la conoces por experiencia propia. Cuanto más concreta sea, más fácil será comprobarla después. «La gente pierde tiempo» es demasiado amplio. «La dueña de una cafetería tira cada día los bocadillos que no ha vendido» es algo que se le puede preguntar a una persona concreta."}}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'pick-change';
update public.stage_subpoints s set translations = '{"de":{"title":"Halte das Problem fest"},"uk":{"title":"Зафіксуй проблему"},"es":{"title":"Atrapa el problema"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'pick-change' and s.key = 'catch-problem';
update public.stage_fields f set translations = '{"de":{"question":"Was war für dich oder jemanden, den du kennst, zuletzt schwierig, teuer, nervig oder hat zu viel Zeit gekostet? Wähle eine Situation aus.","help":"Denk an die letzte Woche: Arbeit, Studium, Einkäufe, Hobbys oder Pflichten. Was musste man korrigieren, lange erledigen oder mehrmals machen?","example":"In dem Café, in dem ich arbeite, bleiben am Ende des Tages unverkaufte Sandwiches übrig."},"uk":{"question":"Що останнім часом було для тебе або когось, кого ти знаєш, складним, дорогим, дратівливим чи забирало забагато часу? Вибери одну ситуацію.","help":"Згадай останній тиждень: роботу, навчання, покупки, хобі чи обов''язки. Що доводилося виправляти, довго залагоджувати або робити кілька разів?","example":"У кав''ярні, де я працюю, наприкінці дня залишаються непродані сендвічі."},"es":{"question":"¿Qué ha sido últimamente difícil, caro, molesto o ha llevado demasiado tiempo para ti o para alguien que conoces? Elige una situación.","help":"Piensa en la última semana: trabajo, estudios, compras, aficiones u obligaciones. ¿Qué hubo que corregir, tardó mucho en resolverse o hubo que hacer varias veces?","example":"En la cafetería donde trabajo, al final del día sobran bocadillos sin vender."}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'pick-change'
    and s.key = 'catch-problem' and f.key = 'problem';
update public.stage_subpoints s set translations = '{"de":{"title":"Sag, wem du helfen willst"},"uk":{"title":"Вкажи, кому хочеш допомогти"},"es":{"title":"Indica a quién quieres ayudar"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'pick-change' and s.key = 'who-to-help';
update public.stage_fields f set translations = '{"de":{"question":"Wen betrifft die gewählte Schwierigkeit?","help":"Nenne konkrete Menschen oder eine Art von Unternehmen. Du kannst bei dir selbst anfangen.","example":"Inhaber kleiner Cafés, die Essen vor Ort zubereiten."},"uk":{"question":"Кого стосується вибрана проблема?","help":"Вкажи конкретних людей або тип компанії. Можна почати із себе.","example":"Власники невеликих кав''ярень, які готують їжу на місці."},"es":{"question":"¿A quién afecta la dificultad que has elegido?","help":"Indica personas concretas o un tipo de empresa. Puedes empezar por ti.","example":"Dueños de pequeñas cafeterías que preparan la comida en el local."}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'pick-change'
    and s.key = 'who-to-help' and f.key = 'audience';
update public.stage_subpoints s set translations = '{"de":{"title":"Gib dem Projekt einen Arbeitstitel"},"uk":{"title":"Дай проєкту робочу назву"},"es":{"title":"Ponle un nombre provisional al proyecto"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'pick-change' and s.key = 'working-name';
update public.stage_fields f set translations = '{"de":{"question":"Wie willst du es vorerst nennen?","help":"Ein einfaches Stichwort reicht, z. B. „Letztes Sandwich“. Wenn dir nichts einfällt, lass „Mein erstes Projekt“ stehen."},"uk":{"question":"Як ти хочеш його поки що називати?","help":"Достатньо простого слова, напр. «Останній сендвіч». Якщо нічого не спадає на думку, залиш «Мій перший проєкт»."},"es":{"question":"¿Cómo quieres llamarlo por ahora?","help":"Basta con una palabra sencilla, p. ej. «El último bocadillo». Si no se te ocurre nada, deja «Mi primer proyecto»."}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'pick-change'
    and s.key = 'working-name' and f.key = 'working_name';
update public.stage_points p set translations = '{"de":{"title":"Überleg dir, wie du helfen kannst","duration_hint":"Etwa 4 Minuten","guide_body":"Die Lösung muss keine App sein. Es kann eine Dienstleistung sein, eine bessere Arbeitsorganisation, ein Gegenstand oder einfach, etwas für jemanden zu erledigen. Bewerte jetzt noch nicht, ob die Idee gut ist — schreib zwei auf und wähle die, die sich leichter überprüfen lässt. Behalte die zweite; du kommst auf sie zurück, falls sich die erste nicht bewährt."},"uk":{"title":"Придумай, як допомогти","duration_hint":"Близько 4 хвилин","guide_body":"Рішенням не обов''язково має бути застосунок. Це може бути послуга, краща організація роботи, річ або просто виконання чогось за когось. На цьому етапі не оцінюй, чи ідея добра — запиши дві й вибери ту, яку легше перевірити. Другу збережи: повернешся до неї, якщо перша не витримає перевірки."},"es":{"title":"Piensa cómo ayudar","duration_hint":"Unos 4 minutos","guide_body":"La solución no tiene por qué ser una app. Puede ser un servicio, una mejor organización del trabajo, un objeto o simplemente hacer algo por otra persona. En esta etapa no valores si la idea es buena — apunta dos y elige la que sea más fácil de comprobar. Guarda la otra; volverás a ella si la primera no se sostiene."}}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'find-way';
update public.stage_subpoints s set translations = '{"de":{"title":"Finde zwei Wege"},"uk":{"title":"Знайди два способи"},"es":{"title":"Encuentra dos formas"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'find-way' and s.key = 'two-ways';
update public.stage_fields f set translations = '{"de":{"question":"Wie könnte man diese Situation leichter machen? Schreib zwei verschiedene Ideen auf.","help":"Überleg, was man weglassen, vereinfachen, vorab vorbereiten oder für jemanden erledigen könnte. Die Lösung kann ein Gegenstand, eine Dienstleistung, ein Programm oder eine bessere Organisation sein.","example":"Bestellungen aus nahen Büros sammeln, bevor die Sandwiches zubereitet werden · Übrig gebliebene Sandwiches am Ende des Tages im Paket verkaufen"},"uk":{"question":"Як можна полегшити цю ситуацію? Запиши дві різні ідеї.","help":"Подумай, що можна прибрати, спростити, підготувати заздалегідь або зробити за когось. Рішенням може бути річ, послуга, програма або кращий спосіб організації.","example":"Збирати замовлення з найближчих офісів до приготування сендвічів · Продавати залишки сендвічів наборами наприкінці дня"},"es":{"question":"¿Cómo se podría facilitar esta situación? Apunta dos ideas distintas.","help":"Piensa qué se puede quitar, simplificar, preparar de antemano o hacer por alguien. La solución puede ser un objeto, un servicio, un programa o una forma mejor de organizarse.","example":"Recoger pedidos de las oficinas cercanas antes de preparar los bocadillos · Vender los bocadillos sobrantes en packs al final del día"}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'find-way'
    and s.key = 'two-ways' and f.key = 'ideas';
update public.stage_subpoints s set translations = '{"de":{"title":"Wähle eine erste Richtung"},"uk":{"title":"Вибери перший напрям"},"es":{"title":"Elige una primera dirección"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'find-way' and s.key = 'pick-direction';
update public.stage_fields f set translations = '{"de":{"question":"Welchen dieser Wege willst du zuerst prüfen?","help":"Wähle den, dessen Funktionsweise du dir vorstellen kannst und über den du am leichtesten mehr herausfinden kannst. Behalte die andere Idee."},"uk":{"question":"Який із цих способів ти хочеш перевірити першим?","help":"Вибери той, роботу якого ти можеш собі уявити й про який найлегше буде дізнатися більше. Іншу ідею збережи."},"es":{"question":"¿Cuál de estas formas quieres comprobar primero?","help":"Elige aquella cuyo funcionamiento puedas imaginar y sobre la que te resulte más fácil averiguar más. Guarda la otra idea."}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'find-way'
    and s.key = 'pick-direction' and f.key = 'chosen_idea';
update public.stage_subpoints s set translations = '{"de":{"title":"Benenne den Nutzen"},"uk":{"title":"Назви користь"},"es":{"title":"Ponle nombre al beneficio"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'find-way' and s.key = 'name-benefit';
update public.stage_fields f set translations = '{"de":{"question":"Was wird für diese Person oder dieses Unternehmen leichter oder besser?","help":"Beschreib die Veränderung, die die Zielperson bemerken wird. In dieser Phase brauchst du keine Zahlen.","example":"Die Inhaberin verkauft mehr zubereitetes Essen und wirft weniger weg."},"uk":{"question":"Що стане легшим або кращим для цієї людини чи компанії?","help":"Опиши зміну, яку помітить отримувач. На цьому етапі цифри не потрібні.","example":"Власниця продасть більше приготованої їжі й менше викине."},"es":{"question":"¿Qué será más fácil o mejor para esta persona o empresa?","help":"Describe el cambio que notará quien lo reciba. En esta etapa no necesitas cifras.","example":"La dueña venderá más comida preparada y tirará menos."}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'find-way'
    and s.key = 'name-benefit' and f.key = 'benefit';
update public.stage_points p set translations = '{"de":{"title":"Finde deinen Ansatzpunkt","duration_hint":"Etwa 2 Minuten","guide_body":"Dein Vorteil am Anfang ist nicht Erfahrung in der Unternehmensführung, sondern Zugang: Du kennst jemanden, arbeitest in der Branche oder kannst etwas selbst umsetzen. Das verkürzt den Weg zum ersten Gespräch mit der Zielgruppe. Nenne das Hindernis ehrlich — wenn du keins siehst, schreib „noch zu prüfen“ und komm später darauf zurück."},"uk":{"title":"Знайди свою точку опори","duration_hint":"Близько 2 хвилин","guide_body":"Перевага на старті — не досвід ведення бізнесу, а доступ: ти когось знаєш, працюєш у цій галузі, умієш щось зробити сам. Це скорочує шлях до першої розмови з клієнтом. Перешкоду назви чесно — якщо не бачиш її, напиши «треба перевірити» й повернися до цього пізніше."},"es":{"title":"Encuentra tu punto de partida","duration_hint":"Unos 2 minutos","guide_body":"Tu ventaja al empezar no es la experiencia dirigiendo una empresa, sino el acceso: conoces a alguien, trabajas en ese sector, sabes hacer algo por tu cuenta. Eso acorta el camino hasta la primera conversación con tu público. Señala el obstáculo con honestidad — si no lo ves, escribe «por comprobar» y vuelve a ello más tarde."}}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'foothold';
update public.stage_subpoints s set translations = '{"de":{"title":"Nutze, was du schon hast"},"uk":{"title":"Використай те, що вже маєш"},"es":{"title":"Aprovecha lo que ya tienes"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'foothold' and s.key = 'use-what-you-have';
update public.stage_fields f set translations = '{"de":{"question":"Was hilft dir, mit der Prüfung dieser Idee anzufangen? Schreib höchstens drei Dinge auf.","help":"Das kann Wissen über das Problem sein, eine Fähigkeit, Zugang zu einem Ort oder eine Person, mit der du sprechen kannst. Du brauchst keine Erfahrung in der Unternehmensführung.","example":"Ich arbeite in einem Café · Ich kenne die Inhaberin · Ich kann ein einfaches Bestellformular erstellen"},"uk":{"question":"Що допоможе тобі почати перевіряти цю ідею? Запиши щонайбільше три речі.","help":"Це може бути знання проблеми, навичка, доступ до місця або людина, з якою можна поговорити. Досвід ведення бізнесу не потрібен.","example":"Працюю в кав''ярні · Знаю її власницю · Умію зробити просту форму замовлення"},"es":{"question":"¿Qué te ayudará a empezar a comprobar esta idea? Apunta como máximo tres cosas.","help":"Puede ser conocer el problema, una habilidad, acceso a un lugar o una persona con la que puedas hablar. No necesitas experiencia dirigiendo una empresa.","example":"Trabajo en una cafetería · Conozco a la dueña · Sé crear un formulario de pedidos sencillo"}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'foothold'
    and s.key = 'use-what-you-have' and f.key = 'assets';
update public.stage_subpoints s set translations = '{"de":{"title":"Erkenne das größte Hindernis"},"uk":{"title":"Поміть найбільшу перешкоду"},"es":{"title":"Detecta el mayor obstáculo"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'foothold' and s.key = 'biggest-obstacle';
update public.stage_fields f set translations = '{"de":{"question":"Was erschwert dir den ersten Schritt am meisten?","help":"Nenne eine Sache, z. B. fehlender Kontakt zur Zielgruppe, wenig Zeit oder Unwissen darüber, wie die Branche funktioniert. Wenn du noch kein Hindernis siehst, schreib „noch zu prüfen“."},"uk":{"question":"Що найбільше заважає тобі зробити перший крок?","help":"Назви одну річ, напр. брак контакту з клієнтами, мало часу або незнання, як працює галузь. Якщо поки не бачиш перешкоди, напиши «треба перевірити»."},"es":{"question":"¿Qué es lo que más te dificulta dar el primer paso?","help":"Señala una sola cosa, p. ej. no tener contacto con tu público, poco tiempo o no saber cómo funciona el sector. Si todavía no ves ningún obstáculo, escribe «por comprobar»."}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'foothold'
    and s.key = 'biggest-obstacle' and f.key = 'obstacle';
update public.stage_points p set translations = '{"de":{"title":"Halte deine Idee fest","duration_hint":"Etwa 1 Minute","guide_body":"Das ist die Zusammenfassung von allem, was du gerade aufgeschrieben hast. Lies sie als Ganzes und prüf, ob sie wiedergibt, was du vorhast. Korrigiere nur die Antworten, die es brauchen — der Rest bleibt unverändert. Nach der Bestätigung prüfst du, ob die Menschen, denen du helfen willst, eine solche Veränderung auch brauchen."},"uk":{"title":"Збережи свою ідею","duration_hint":"Близько 1 хвилини","guide_body":"Це підсумок усього, що щойно було записано. Прочитай його як одне ціле й перевір, чи він відображає те, що ти хочеш зробити. Виправ лише ті відповіді, які цього потребують — решта залишиться без змін. Після підтвердження ти перейдеш до перевірки, чи людям, яким хочеш допомогти, теж потрібна така зміна."},"es":{"title":"Guarda tu idea","duration_hint":"Alrededor de 1 minuto","guide_body":"Es el resumen de todo lo que acabas de escribir. Léelo como un todo y comprueba si refleja lo que quieres hacer. Corrige solo las respuestas que lo necesiten — el resto se queda igual. Tras confirmarlo, pasarás a comprobar si las personas a las que quieres ayudar también necesitan ese cambio."}}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'save-idea';
update public.stage_subpoints s set translations = '{"de":{"title":"Lies den Projektentwurf"},"uk":{"title":"Прочитай задум проєкту"},"es":{"title":"Lee el esbozo del proyecto"}}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'ambition' and t.version = 1
    and c.key = 'general' and p.key = 'save-idea' and s.key = 'project-outline';
update public.stage_fields f set translations = '{"de":{"question":"Prüf, ob die Zusammenfassung wiedergibt, was du vorhast.","help":"Du kannst jede Antwort direkt hier korrigieren. Änderungen werden in denselben Feldern gespeichert wie zuvor.","config":{"confirm_label":"Entwurf bestätigen","sources":[{"field":"pick-change.working-name.working_name","label":"Name"},{"field":"pick-change.who-to-help.audience","label":"Ich will helfen"},{"field":"pick-change.catch-problem.problem","label":"Problem, das ich angehe"},{"field":"find-way.pick-direction.chosen_idea","label":"Meine Lösungsidee"},{"field":"find-way.name-benefit.benefit","label":"Nutzen für die Zielgruppe"},{"field":"foothold.use-what-you-have.assets","label":"Was ich zum Start habe"},{"field":"foothold.biggest-obstacle.obstacle","label":"Noch zu klären"}]}},"uk":{"question":"Перевір, чи підсумок відображає те, що ти хочеш зробити.","help":"Будь-яку відповідь можна виправити тут же. Зміни зберігаються в тих самих полях, що й раніше.","config":{"confirm_label":"Підтверджую задум","sources":[{"field":"pick-change.working-name.working_name","label":"Назва"},{"field":"pick-change.who-to-help.audience","label":"Хочу допомогти"},{"field":"pick-change.catch-problem.problem","label":"Проблема, якою займуся"},{"field":"find-way.pick-direction.chosen_idea","label":"Моя ідея рішення"},{"field":"find-way.name-benefit.benefit","label":"Користь для отримувача"},{"field":"foothold.use-what-you-have.assets","label":"Що маю на початок"},{"field":"foothold.biggest-obstacle.obstacle","label":"Треба з''ясувати"}]}},"es":{"question":"Comprueba si el resumen refleja lo que quieres hacer.","help":"Puedes corregir cualquier respuesta aquí mismo. Los cambios se guardan en los mismos campos que antes.","config":{"confirm_label":"Confirmo el esbozo","sources":[{"field":"pick-change.working-name.working_name","label":"Nombre"},{"field":"pick-change.who-to-help.audience","label":"Quiero ayudar a"},{"field":"pick-change.catch-problem.problem","label":"El problema que voy a abordar"},{"field":"find-way.pick-direction.chosen_idea","label":"Mi idea de solución"},{"field":"find-way.name-benefit.benefit","label":"Beneficio para el destinatario"},{"field":"foothold.use-what-you-have.assets","label":"Con qué cuento para empezar"},{"field":"foothold.biggest-obstacle.obstacle","label":"Por aclarar"}]}}}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'ambition' and t.version = 1 and c.key = 'general' and p.key = 'save-idea'
    and s.key = 'project-outline' and f.key = 'outline';

-- ═══ idea v1 ═══
update public.stage_templates t set translations = '{}'::jsonb
  where t.key = 'idea' and t.version = 1;
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'idea' and t.version = 1 and c.key = 'general';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zdefiniuj-problem';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zdefiniuj-problem' and s.key = 'opisz-problem';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'opisz-problem' and f.key = 'co-nie-dziala';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'opisz-problem' and f.key = 'sytuacja';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zdefiniuj-problem' and s.key = 'przykladowy-uzytkownik';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'przykladowy-uzytkownik' and f.key = 'kto';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'przykladowy-uzytkownik' and f.key = 'jak-radzi-sobie-dzis';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zdefiniuj-problem' and s.key = 'gdzie-nie-dziala';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'gdzie-nie-dziala' and f.key = 'problemy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'gdzie-nie-dziala' and f.key = 'konsekwencje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zdefiniuj-problem' and s.key = 'waznosc-problemu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'waznosc-problemu' and f.key = 'waznosc';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'waznosc-problemu' and f.key = 'pilnosc';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zdefiniuj-problem' and s.key = 'ostateczna-definicja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zdefiniuj-problem'
    and s.key = 'ostateczna-definicja' and f.key = 'zdanie';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'hipoteza-rozwiazania';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'hipoteza-rozwiazania' and s.key = 'wersja-minimalna';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'hipoteza-rozwiazania'
    and s.key = 'wersja-minimalna' and f.key = 'funkcje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'hipoteza-rozwiazania' and s.key = 'dlaczego-skorzysta';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'hipoteza-rozwiazania'
    and s.key = 'dlaczego-skorzysta' and f.key = 'zalozenie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'hipoteza-rozwiazania'
    and s.key = 'dlaczego-skorzysta' and f.key = 'warunki';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'hipoteza-rozwiazania' and s.key = 'zalozenie-do-testow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'hipoteza-rozwiazania'
    and s.key = 'zalozenie-do-testow' and f.key = 'najwazniejsze';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'hipoteza-rozwiazania'
    and s.key = 'zalozenie-do-testow' and f.key = 'pozostale';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja' and s.key = 'znajdz-rozwiazania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'znajdz-rozwiazania' and f.key = 'produkty';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'znajdz-rozwiazania' and f.key = 'obejscia';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja' and s.key = 'opisz-rozwiazania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opisz-rozwiazania' and f.key = 'dla-kogo';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opisz-rozwiazania' and f.key = 'jak-rozwiazuja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opisz-rozwiazania' and f.key = 'cena';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opisz-rozwiazania' and f.key = 'funkcje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja' and s.key = 'opinie-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opinie-uzytkownikow' and f.key = 'przeczytane';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opinie-uzytkownikow' and f.key = 'chwala';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opinie-uzytkownikow' and f.key = 'narzekaja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opinie-uzytkownikow' and f.key = 'niezaspokojone';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'opinie-uzytkownikow' and f.key = 'zrodla';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja' and s.key = 'porownaj';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'porownaj' and f.key = 'inaczej';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'porownaj' and f.key = 'ci-sami-ludzie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'porownaj' and f.key = 'cena';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'porownaj' and f.key = 'przewagi';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja' and s.key = 'dlaczego-zmiana';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'dlaczego-zmiana' and f.key = 'co-przekona';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'dlaczego-zmiana' and f.key = 'co-utrudnia';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'konkurencja' and s.key = 'brak-konkurencji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'brak-konkurencji' and f.key = 'potwierdzam';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'brak-konkurencji' and f.key = 'gdzie-szukales';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'brak-konkurencji' and f.key = 'dlaczego-nie-ma';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'konkurencja'
    and s.key = 'brak-konkurencji' and f.key = 'jak-sprawdzisz';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zainteresowanie-i-cena';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zainteresowanie-i-cena' and s.key = 'propozycja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'propozycja' and f.key = 'oferta';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'propozycja' and f.key = 'cena';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zainteresowanie-i-cena' and s.key = 'miara-zainteresowania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'miara-zainteresowania' and f.key = 'dzialanie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'miara-zainteresowania' and f.key = 'prog';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zainteresowanie-i-cena' and s.key = 'przedstaw-pomysl';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'przedstaw-pomysl' and f.key = 'reakcje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'przedstaw-pomysl' and f.key = 'wynik';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'general' and p.key = 'zainteresowanie-i-cena' and s.key = 'decyzja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'general' and p.key = 'zainteresowanie-i-cena'
    and s.key = 'decyzja' and f.key = 'wnioski';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'idea' and t.version = 1 and c.key = 'saas';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'za-co-placi';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'za-co-placi' and s.key = 'co-zapewnia-z-czasem';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'za-co-placi'
    and s.key = 'co-zapewnia-z-czasem' and f.key = 'po-pierwszym-uzyciu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'za-co-placi'
    and s.key = 'co-zapewnia-z-czasem' and f.key = 'rodzaj-dostepu';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'za-co-placi' and s.key = 'sposob-naliczania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'za-co-placi'
    and s.key = 'sposob-naliczania' and f.key = 'za-co';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'za-co-placi'
    and s.key = 'sposob-naliczania' and f.key = 'w-cenie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'za-co-placi' and s.key = 'reakcja-na-rozliczenie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'za-co-placi'
    and s.key = 'reakcja-na-rozliczenie' and f.key = 'pasuje-przeszkadza';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'za-co-placi'
    and s.key = 'reakcja-na-rozliczenie' and f.key = 'kiedy-zrezygnuja';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'start-korzystania';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'start-korzystania' and s.key = 'czego-potrzebuje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'czego-potrzebuje' and f.key = 'dane';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'czego-potrzebuje' and f.key = 'skad-je-wezmie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'czego-potrzebuje' and f.key = 'legalnosc';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'start-korzystania' and s.key = 'integracje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'integracje' and f.key = 'z-czym';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'integracje' and f.key = 'prostszy-sposob';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'start-korzystania' and s.key = 'warunki-startu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'warunki-startu' and f.key = 'co-powstrzyma';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'start-korzystania'
    and s.key = 'warunki-startu' and f.key = 'potwierdzone-vs-domysly';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci' and s.key = 'wspolne-vs-indywidualne';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci'
    and s.key = 'wspolne-vs-indywidualne' and f.key = 'wspolne';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci'
    and s.key = 'wspolne-vs-indywidualne' and f.key = 'indywidualne';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci' and s.key = 'potrzebna-pomoc';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci'
    and s.key = 'potrzebna-pomoc' and f.key = 'przygotowanie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci'
    and s.key = 'potrzebna-pomoc' and f.key = 'pozniejsza-pomoc';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci' and s.key = 'najwieksza-niewiadoma';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci'
    and s.key = 'najwieksza-niewiadoma' and f.key = 'osobna-wersja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'saas' and p.key = 'jeden-program-rozni-klienci'
    and s.key = 'najwieksza-niewiadoma' and f.key = 'do-wyjasnienia';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'idea' and t.version = 1 and c.key = 'b2b';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'decyzja-o-zakupie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'decyzja-o-zakupie' and s.key = 'docelowa-firma';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'decyzja-o-zakupie'
    and s.key = 'docelowa-firma' and f.key = 'profil-firmy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'decyzja-o-zakupie'
    and s.key = 'docelowa-firma' and f.key = 'profil-uzytkownika';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'decyzja-o-zakupie' and s.key = 'kto-decyduje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'decyzja-o-zakupie'
    and s.key = 'kto-decyduje' and f.key = 'role';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'decyzja-o-zakupie' and s.key = 'wymagane-zgody';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'decyzja-o-zakupie'
    and s.key = 'wymagane-zgody' and f.key = 'dzialy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'decyzja-o-zakupie'
    and s.key = 'wymagane-zgody' and f.key = 'dodatkowe-zgody';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'decyzja-o-zakupie' and s.key = 'sciezka-zakupowa';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'decyzja-o-zakupie'
    and s.key = 'sciezka-zakupowa' and f.key = 'kroki';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'czas-sprzedazy';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'czas-sprzedazy' and s.key = 'jak-decyduje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'czas-sprzedazy'
    and s.key = 'jak-decyduje' and f.key = 'ile-osob';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'czas-sprzedazy'
    and s.key = 'jak-decyduje' and f.key = 'budzet';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'czas-sprzedazy' and s.key = 'opoznienia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'czas-sprzedazy'
    and s.key = 'opoznienia' and f.key = 'co-opozni';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'roi';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'roi' and s.key = 'koszt-problemu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'roi'
    and s.key = 'koszt-problemu' and f.key = 'czas';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'roi'
    and s.key = 'koszt-problemu' and f.key = 'pieniadze';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'roi'
    and s.key = 'koszt-problemu' and f.key = 'bledy';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'roi' and s.key = 'przelicz-na-pieniadze';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'roi'
    and s.key = 'przelicz-na-pieniadze' and f.key = 'cena';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'roi'
    and s.key = 'przelicz-na-pieniadze' and f.key = 'minimalny-wynik';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'roi' and s.key = 'korzysci-miekkie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'roi'
    and s.key = 'korzysci-miekkie' and f.key = 'lista';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'po-zakupie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'po-zakupie' and s.key = 'przygotowanie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'po-zakupie'
    and s.key = 'przygotowanie' and f.key = 'co-musi-sie-wydarzyc';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'po-zakupie'
    and s.key = 'przygotowanie' and f.key = 'kto-sie-zajmie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'po-zakupie' and s.key = 'pomoc-pracownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'po-zakupie'
    and s.key = 'pomoc-pracownikow' and f.key = 'czego-sie-naucza';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'po-zakupie'
    and s.key = 'pomoc-pracownikow' and f.key = 'jaka-pomoc';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2b' and p.key = 'po-zakupie' and s.key = 'co-utrudni';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'po-zakupie'
    and s.key = 'co-utrudni' and f.key = 'powroty-do-starego';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2b' and p.key = 'po-zakupie'
    and s.key = 'co-utrudni' and f.key = 'poprzednie-zakupy';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'idea' and t.version = 1 and c.key = 'b2c';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'zakup-konsumencki';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'zakup-konsumencki' and s.key = 'role-zakupu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'role-zakupu' and f.key = 'dla-kogo';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'role-zakupu' and f.key = 'jedna-osoba';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'role-zakupu' and f.key = 'korzysta';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'role-zakupu' and f.key = 'wybiera';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'role-zakupu' and f.key = 'placi';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'zakup-konsumencki' and s.key = 'okazja-zakupu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'okazja-zakupu' and f.key = 'sytuacja';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'zakup-konsumencki' and s.key = 'prywatny-budzet';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'prywatny-budzet' and f.key = 'rodzaj-wydatku';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'zakup-konsumencki'
    and s.key = 'prywatny-budzet' and f.key = 'kategoria';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'pozyskanie-klientow';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'pozyskanie-klientow' and s.key = 'gdzie-sa-klienci';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'gdzie-sa-klienci' and f.key = 'do-kogo';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'gdzie-sa-klienci' and f.key = 'miejsca';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'pozyskanie-klientow' and s.key = 'test-ogloszenia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'test-ogloszenia' and f.key = 'wypuszczone';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'test-ogloszenia' and f.key = 'kogo-zainteresowalo';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'test-ogloszenia' and f.key = 'ile-osob';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'pozyskanie-klientow' and s.key = 'koszt-klienta';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'koszt-klienta' and f.key = 'wydane';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'koszt-klienta' and f.key = 'cac';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'koszt-klienta' and f.key = 'czy-oplaca';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'pozyskanie-klientow' and s.key = 'glowny-kanal';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'glowny-kanal' and f.key = 'glowny';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'pozyskanie-klientow'
    and s.key = 'glowny-kanal' and f.key = 'zapasowy';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'gotowosc-do-zaplaty';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'gotowosc-do-zaplaty' and s.key = 'obiekcje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'gotowosc-do-zaplaty'
    and s.key = 'obiekcje' and f.key = 'lista';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'b2c' and p.key = 'gotowosc-do-zaplaty' and s.key = 'ltv-vs-cac';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'gotowosc-do-zaplaty'
    and s.key = 'ltv-vs-cac' and f.key = 'ltv';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'b2c' and p.key = 'gotowosc-do-zaplaty'
    and s.key = 'ltv-vs-cac' and f.key = 'wniosek';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'idea' and t.version = 1 and c.key = 'hardware';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna' and s.key = 'dlaczego-sprzet';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna'
    and s.key = 'dlaczego-sprzet' and f.key = 'uzasadnienie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna' and s.key = 'koncepcja-formy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna'
    and s.key = 'koncepcja-formy' and f.key = 'opis-formy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna'
    and s.key = 'koncepcja-formy' and f.key = 'makieta';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna' and s.key = 'opinia-o-koncepcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'problem-i-potrzeba-fizyczna'
    and s.key = 'opinia-o-koncepcji' and f.key = 'reakcje';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna' and s.key = 'technologie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'technologie' and f.key = 'lista';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna' and s.key = 'dostepnosc';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'dostepnosc' and f.key = 'sprawdzone';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'dostepnosc' and f.key = 'linki';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'dostepnosc' and f.key = 'watpliwosci';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna' and s.key = 'konsultacja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'konsultacja' and f.key = 'rozmowa';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'konsultacja' and f.key = 'wnioski';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna' and s.key = 'ryzyko-technologiczne';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'wykonalnosc-techniczna'
    and s.key = 'ryzyko-technologiczne' and f.key = 'ryzyko';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'koszty-jednostkowe';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'koszty-jednostkowe' and s.key = 'bom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'bom' and f.key = 'czesci';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'bom' and f.key = 'arkusz';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'koszty-jednostkowe' and s.key = 'koszt-jednostkowy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'koszt-jednostkowy' and f.key = 'komponenty';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'koszt-jednostkowy' and f.key = 'szacunek';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'koszty-jednostkowe' and s.key = 'ryzyko-kosztowe';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'ryzyko-kosztowe' and f.key = 'element';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'koszty-jednostkowe' and s.key = 'koszt-vs-cena';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'koszt-vs-cena' and f.key = 'cena';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'koszty-jednostkowe'
    and s.key = 'koszt-vs-cena' and f.key = 'marza';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'zamiar-zakupu';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'zamiar-zakupu' and s.key = 'akceptacja-cenowa';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'zamiar-zakupu'
    and s.key = 'akceptacja-cenowa' and f.key = 'zakres';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'zamiar-zakupu'
    and s.key = 'akceptacja-cenowa' and f.key = 'reakcje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'zamiar-zakupu' and s.key = 'testy-zaangazowania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'zamiar-zakupu'
    and s.key = 'testy-zaangazowania' and f.key = 'forma';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'zamiar-zakupu'
    and s.key = 'testy-zaangazowania' and f.key = 'ile-osob';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'zamiar-zakupu' and s.key = 'early-adopters';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'zamiar-zakupu'
    and s.key = 'early-adopters' and f.key = 'segment';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'regulacje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'regulacje' and s.key = 'kategoryzacja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'regulacje'
    and s.key = 'kategoryzacja' and f.key = 'kategoria';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'regulacje'
    and s.key = 'kategoryzacja' and f.key = 'uzasadnienie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'regulacje' and s.key = 'certyfikaty';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'regulacje'
    and s.key = 'certyfikaty' and f.key = 'lista';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'regulacje'
    and s.key = 'certyfikaty' and f.key = 'ograniczenia';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'idea' and t.version = 1
    and c.key = 'hardware' and p.key = 'regulacje' and s.key = 'decyzja';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'idea' and t.version = 1 and c.key = 'hardware' and p.key = 'regulacje'
    and s.key = 'decyzja' and f.key = 'podsumowanie';

-- ═══ preparation v1 ═══
update public.stage_templates t set translations = '{}'::jsonb
  where t.key = 'preparation' and t.version = 1;
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'preparation' and t.version = 1 and c.key = 'general';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'rozmowy';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'rozmowy' and s.key = 'znajdz-rozmowcow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'rozmowy'
    and s.key = 'znajdz-rozmowcow' and f.key = 'osoby';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'rozmowy' and s.key = 'zapytaj-o-doswiadczenia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'rozmowy'
    and s.key = 'zapytaj-o-doswiadczenia' and f.key = 'zapisy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'rozmowy'
    and s.key = 'zapytaj-o-doswiadczenia' and f.key = 'materialy';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'rozmowy' and s.key = 'podsumuj-rozmowy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'rozmowy'
    and s.key = 'podsumuj-rozmowy' and f.key = 'powtarzalo';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'rozmowy'
    and s.key = 'podsumuj-rozmowy' and f.key = 'za-i-przeciw';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'scope';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'scope' and s.key = 'tasks';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'tasks' and f.key = 'mvp_tasks';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'scope' and s.key = 'split';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'split' and f.key = 'alone';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'split' and f.key = 'learn';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'split' and f.key = 'others';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'scope' and s.key = 'mode';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'mode' and f.key = 'choice';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'scope' and s.key = 'cofounder';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'cofounder' and f.key = 'profile';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'scope' and s.key = 'helpers';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'scope'
    and s.key = 'helpers' and f.key = 'roles';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'find-help';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'find-help' and s.key = 'social';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'find-help'
    and s.key = 'social' and f.key = 'opened';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'find-help' and s.key = 'outreach';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'find-help'
    and s.key = 'outreach' and f.key = 'contacts';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'find-help' and s.key = 'pick';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'find-help'
    and s.key = 'pick' and f.key = 'people';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'trial';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'trial' and s.key = 'task';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'trial'
    and s.key = 'task' and f.key = 'which';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'trial'
    and s.key = 'task' and f.key = 'plan';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'trial' and s.key = 'result';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'trial'
    and s.key = 'result' and f.key = 'outcome';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'trial'
    and s.key = 'result' and f.key = 'decision';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'trial'
    and s.key = 'result' and f.key = 'ready';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'workspace';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'workspace' and s.key = 'files';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'workspace'
    and s.key = 'files' and f.key = 'collected';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'workspace' and s.key = 'rules';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'workspace'
    and s.key = 'rules' and f.key = 'agreements';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'supplies';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'general' and p.key = 'supplies' and s.key = 'missing';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'general' and p.key = 'supplies'
    and s.key = 'missing' and f.key = 'items';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'preparation' and t.version = 1 and c.key = 'saas';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'access';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'access' and s.key = 'space';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'access'
    and s.key = 'space' and f.key = 'model';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'access' and s.key = 'roles';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'access'
    and s.key = 'roles' and f.key = 'permissions';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'test-cost';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'test-cost' and s.key = 'usage';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'test-cost'
    and s.key = 'usage' and f.key = 'plan';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'test-cost'
    and s.key = 'usage' and f.key = 'monthly';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'test-cost' and s.key = 'limits';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'test-cost'
    and s.key = 'limits' and f.key = 'overage';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'test-cost'
    and s.key = 'limits' and f.key = 'cap';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'paid';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'paid' and s.key = 'choice';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'choice' and f.key = 'answer';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'paid' and s.key = 'how';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'how' and f.key = 'flow';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'saas' and p.key = 'paid' and s.key = 'cases';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'cases' and f.key = 'paid_ok';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'cases' and f.key = 'trial';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'cases' and f.key = 'failed';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'cases' and f.key = 'cancel';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'saas' and p.key = 'paid'
    and s.key = 'cases' and f.key = 'ended';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'preparation' and t.version = 1 and c.key = 'hardware';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'spec';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'spec' and s.key = 'numbers';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'spec'
    and s.key = 'numbers' and f.key = 'requirements';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'supply';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'supply' and s.key = 'bom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'supply'
    and s.key = 'bom' and f.key = 'parts';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'supply' and s.key = 'backup';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'supply'
    and s.key = 'backup' and f.key = 'seconds';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'supply'
    and s.key = 'backup' and f.key = 'tools';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'supply'
    and s.key = 'backup' and f.key = 'logistics';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'quality';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'quality' and s.key = 'safe';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'quality'
    and s.key = 'safe' and f.key = 'use';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'quality'
    and s.key = 'safe' and f.key = 'life';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'quality' and s.key = 'tests';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'quality'
    and s.key = 'tests' and f.key = 'checks';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'rules';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'rules' and s.key = 'map';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'rules'
    and s.key = 'map' and f.key = 'links';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'rules'
    and s.key = 'map' and f.key = 'labels';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'rules'
    and s.key = 'map' and f.key = 'clash';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'readiness';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'readiness' and s.key = 'resources';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'readiness'
    and s.key = 'resources' and f.key = 'needs';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'readiness'
    and s.key = 'resources' and f.key = 'budget';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'hardware' and p.key = 'readiness' and s.key = 'risks';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'hardware' and p.key = 'readiness'
    and s.key = 'risks' and f.key = 'open';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'preparation' and t.version = 1 and c.key = 'b2b';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'sales';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'sales' and s.key = 'steps';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'sales'
    and s.key = 'steps' and f.key = 'path';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'sales' and s.key = 'accounts';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'sales'
    and s.key = 'accounts' and f.key = 'companies';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'offer';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'offer' and s.key = 'scope';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'offer'
    and s.key = 'scope' and f.key = 'what';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'offer'
    and s.key = 'scope' and f.key = 'price';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'offer'
    and s.key = 'scope' and f.key = 'term';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'offer' and s.key = 'pilot';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'offer'
    and s.key = 'pilot' and f.key = 'deal';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'kickoff';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'kickoff' and s.key = 'needs';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'kickoff'
    and s.key = 'needs' and f.key = 'from_client';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'kickoff'
    and s.key = 'needs' and f.key = 'ours';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'kickoff'
    and s.key = 'needs' and f.key = 'theirs';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2b' and p.key = 'kickoff' and s.key = 'start';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'kickoff'
    and s.key = 'start' and f.key = 'path';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2b' and p.key = 'kickoff'
    and s.key = 'start' and f.key = 'data';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'preparation' and t.version = 1 and c.key = 'b2c';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2c' and p.key = 'returns';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2c' and p.key = 'returns' and s.key = 'channel';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2c' and p.key = 'returns'
    and s.key = 'channel' and f.key = 'where';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2c' and p.key = 'returns' and s.key = 'rights';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2c' and p.key = 'returns'
    and s.key = 'rights' and f.key = 'rule';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'preparation' and t.version = 1
    and c.key = 'b2c' and p.key = 'returns' and s.key = 'handling';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'preparation' and t.version = 1 and c.key = 'b2c' and p.key = 'returns'
    and s.key = 'handling' and f.key = 'flow';

-- ═══ execution v1 ═══
update public.stage_templates t set translations = '{}'::jsonb
  where t.key = 'execution' and t.version = 1;
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'execution' and t.version = 1 and c.key = 'general';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'general' and p.key = 'next';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'general' and p.key = 'next' and s.key = 'setup';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'general' and p.key = 'next'
    and s.key = 'setup' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'general' and p.key = 'work';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'general' and p.key = 'work' and s.key = 'done';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'general' and p.key = 'work'
    and s.key = 'done' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'general' and p.key = 'close';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'general' and p.key = 'close' and s.key = 'summary';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'general' and p.key = 'close'
    and s.key = 'summary' and f.key = 'open';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'execution' and t.version = 1 and c.key = 'saas';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-core';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-core' and s.key = 'result';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-core'
    and s.key = 'result' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-access';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-access' and s.key = 'rules';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-access'
    and s.key = 'rules' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-access' and s.key = 'data';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-access'
    and s.key = 'data' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-check';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-check' and s.key = 'behavior';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-check'
    and s.key = 'behavior' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-check' and s.key = 'load';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-check'
    and s.key = 'load' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-check' and s.key = 'fix';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-check'
    and s.key = 'fix' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-keep';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-keep' and s.key = 'release';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-keep'
    and s.key = 'release' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-keep' and s.key = 'recover';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-keep'
    and s.key = 'recover' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ready';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ready' and s.key = 'confirm';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ready'
    and s.key = 'confirm' and f.key = 'version';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ready'
    and s.key = 'confirm' and f.key = 'ready';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'execution' and t.version = 1 and c.key = 'hardware';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-spec';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-spec' and s.key = 'checks';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-spec'
    and s.key = 'checks' and f.key = 'use';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-spec'
    and s.key = 'checks' and f.key = 'requirements';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-spec' and s.key = 'safety';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-spec'
    and s.key = 'safety' and f.key = 'rules';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-try';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-try' and s.key = 'probe';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-try'
    and s.key = 'probe' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-build';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-build' and s.key = 'unit';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-build'
    and s.key = 'unit' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-build' and s.key = 'repeat';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-build'
    and s.key = 'repeat' and f.key = 'how';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-build'
    and s.key = 'repeat' and f.key = 'files';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-test';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-test' and s.key = 'trial';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-test'
    and s.key = 'trial' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-test' and s.key = 'fix';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-test'
    and s.key = 'fix' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-ready';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-ready' and s.key = 'pack';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-ready'
    and s.key = 'pack' and f.key = 'control';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'hardware' and p.key = 'hw-ready' and s.key = 'confirm';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-ready'
    and s.key = 'confirm' and f.key = 'version';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'hardware' and p.key = 'hw-ready'
    and s.key = 'confirm' and f.key = 'ready';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'execution' and t.version = 1 and c.key = 'b2b';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-hand';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-hand' and s.key = 'pack';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-hand'
    and s.key = 'pack' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-try';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-try' and s.key = 'trial';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-try'
    and s.key = 'trial' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-try' and s.key = 'ready';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-try'
    and s.key = 'ready' and f.key = 'version';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-try'
    and s.key = 'ready' and f.key = 'ready';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'execution' and t.version = 1 and c.key = 'b2c';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-offer';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-offer' and s.key = 'place';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-offer'
    and s.key = 'place' and f.key = 'open';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-path';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-path' and s.key = 'trial';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-path'
    and s.key = 'trial' and f.key = 'open';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'execution' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-path' and s.key = 'ready';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-path'
    and s.key = 'ready' and f.key = 'version';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'execution' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-path'
    and s.key = 'ready' and f.key = 'ready';

-- ═══ mvp v1 ═══
update public.stage_templates t set translations = '{}'::jsonb
  where t.key = 'mvp' and t.version = 1;
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'mvp' and t.version = 1 and c.key = 'general';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania' and s.key = 'zrealizuj-podstawowe-funkcje-mvp';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania'
    and s.key = 'zrealizuj-podstawowe-funkcje-mvp' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania' and s.key = 'polacz-kluczowe-elementy-rozwiazania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania'
    and s.key = 'polacz-kluczowe-elementy-rozwiazania' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania' and s.key = 'przygotuj-mvp-do-testowania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbuduj-minimalna-wersje-rozwiazania'
    and s.key = 'przygotuj-mvp-do-testowania' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'okresl-grupe-badawcza';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'okresl-grupe-badawcza' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'ustal-okres-badania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'ustal-okres-badania' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'udostepnij-mvp-uzytkownikom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'udostepnij-mvp-uzytkownikom' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'obserwuj-reakcje-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'obserwuj-reakcje-uzytkownikow' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbierz-feedback';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbierz-feedback' and s.key = 'zbieraj-opinie-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbierz-feedback'
    and s.key = 'zbieraj-opinie-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbierz-feedback' and s.key = 'konsultuj-rozwiazanie-z-ekspertami';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbierz-feedback'
    and s.key = 'konsultuj-rozwiazanie-z-ekspertami' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbierz-feedback' and s.key = 'zbieraj-informacje-o-problemach';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbierz-feedback'
    and s.key = 'zbieraj-informacje-o-problemach' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-zbierz-feedback' and s.key = 'zbieraj-oczekiwania-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-zbierz-feedback'
    and s.key = 'zbieraj-oczekiwania-uzytkownikow' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-przeanalizuj-feedback';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-przeanalizuj-feedback' and s.key = 'ocen-poziom-zadowolenia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-przeanalizuj-feedback'
    and s.key = 'ocen-poziom-zadowolenia' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-przeanalizuj-feedback' and s.key = 'przeanalizuj-zglaszane-problemy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-przeanalizuj-feedback'
    and s.key = 'przeanalizuj-zglaszane-problemy' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-przeanalizuj-feedback' and s.key = 'przeanalizuj-potrzeby-dotyczace-funkcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-przeanalizuj-feedback'
    and s.key = 'przeanalizuj-potrzeby-dotyczace-funkcji' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-przeanalizuj-feedback' and s.key = 'wyciagnij-najwazniejsze-wnioski';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-przeanalizuj-feedback'
    and s.key = 'wyciagnij-najwazniejsze-wnioski' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju' and s.key = 'ustal-najwazniejsze-poprawki';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju'
    and s.key = 'ustal-najwazniejsze-poprawki' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju' and s.key = 'zaplanuj-ulepszenie-mvp';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju'
    and s.key = 'zaplanuj-ulepszenie-mvp' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju' and s.key = 'rozwaz-zmiane-zalozen';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju'
    and s.key = 'rozwaz-zmiane-zalozen' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju' and s.key = 'okresl-kolejny-kierunek-dzialania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-opracuj-kierunek-dalszego-rozwoju'
    and s.key = 'okresl-kolejny-kierunek-dzialania' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie' and s.key = 'wprowadz-najwazniejsze-zmiany';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie'
    and s.key = 'wprowadz-najwazniejsze-zmiany' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie' and s.key = 'ponownie-udostepnij-rozwiazanie-uzytkownikom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie'
    and s.key = 'ponownie-udostepnij-rozwiazanie-uzytkownikom' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie' and s.key = 'porownaj-reakcje-przed-i-po-zmianach';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie'
    and s.key = 'porownaj-reakcje-przed-i-po-zmianach' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie' and s.key = 'powtorz-proces-walidacji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'general' and p.key = 'general-ponownie-skonsultuj-rozwiazanie'
    and s.key = 'powtorz-proces-walidacji' and f.key = 'note';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'mvp' and t.version = 1 and c.key = 'saas';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas' and s.key = 'zrealizuj-zakres-mvp';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas'
    and s.key = 'zrealizuj-zakres-mvp' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas' and s.key = 'polacz-kluczowe-elementy-saas';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas'
    and s.key = 'polacz-kluczowe-elementy-saas' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas' and s.key = 'udostepnij-saas-w-srodowisku-produkcyjnym';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas'
    and s.key = 'udostepnij-saas-w-srodowisku-produkcyjnym' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas' and s.key = 'sprawdz-dzialanie-kluczowych-integracji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas'
    and s.key = 'sprawdz-dzialanie-kluczowych-integracji' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas' and s.key = 'sprawdz-dzialanie-platnosci-i-subskrypcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-uruchom-pierwsza-wersje-saas'
    and s.key = 'sprawdz-dzialanie-platnosci-i-subskrypcji' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami' and s.key = 'udostepnij-produkt-pierwszym-uzytkownikom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami'
    and s.key = 'udostepnij-produkt-pierwszym-uzytkownikom' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami' and s.key = 'przeprowadz-onboarding-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami'
    and s.key = 'przeprowadz-onboarding-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami' and s.key = 'obserwuj-zachowania-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami'
    and s.key = 'obserwuj-zachowania-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami' and s.key = 'rejestruj-problemy-podczas-uzytkowania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami'
    and s.key = 'rejestruj-problemy-podczas-uzytkowania' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas' and s.key = 'zmierz-aktywacje-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas'
    and s.key = 'zmierz-aktywacje-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas' and s.key = 'zmierz-wykorzystanie-kluczowych-funkcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas'
    and s.key = 'zmierz-wykorzystanie-kluczowych-funkcji' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas' and s.key = 'zmierz-czestotliwosc-korzystania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas'
    and s.key = 'zmierz-czestotliwosc-korzystania' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas' and s.key = 'zmierz-retencje-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas'
    and s.key = 'zmierz-retencje-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas' and s.key = 'porownaj-wyniki-z-zalozeniami';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zmierz-wykorzystanie-saas'
    and s.key = 'porownaj-wyniki-z-zalozeniami' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas' and s.key = 'sprawdz-osiaganie-glownego-rezultatu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas'
    and s.key = 'sprawdz-osiaganie-glownego-rezultatu' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas' and s.key = 'zbierz-feedback-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas'
    and s.key = 'zbierz-feedback-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas' and s.key = 'zidentyfikuj-bariery-uzytkowania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas'
    and s.key = 'zidentyfikuj-bariery-uzytkowania' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas' and s.key = 'ocen-powtarzalnosc-wartosci';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas'
    and s.key = 'ocen-powtarzalnosc-wartosci' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas' and s.key = 'okresl-najwazniejsze-problemy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-wartosc-saas'
    and s.key = 'okresl-najwazniejsze-problemy' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny' and s.key = 'sprawdz-konwersje-na-platne-plany';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny'
    and s.key = 'sprawdz-konwersje-na-platne-plany' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny' and s.key = 'monitoruj-odnowienia-subskrypcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny'
    and s.key = 'monitoruj-odnowienia-subskrypcji' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny' and s.key = 'monitoruj-anulowania-subskrypcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny'
    and s.key = 'monitoruj-anulowania-subskrypcji' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny' and s.key = 'zmierz-churn';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny'
    and s.key = 'zmierz-churn' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny' and s.key = 'porownaj-przychody-z-kosztami-obslugi';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-zweryfikuj-model-subskrypcyjny'
    and s.key = 'porownaj-przychody-z-kosztami-obslugi' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas' and s.key = 'ustal-priorytety-zmian';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas'
    and s.key = 'ustal-priorytety-zmian' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas' and s.key = 'wprowadz-najwazniejsze-poprawki';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas'
    and s.key = 'wprowadz-najwazniejsze-poprawki' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas' and s.key = 'ponownie-przetestuj-zmienione-elementy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas'
    and s.key = 'ponownie-przetestuj-zmienione-elementy' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas' and s.key = 'ocen-potrzebe-zmiany-kierunku';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas'
    and s.key = 'ocen-potrzebe-zmiany-kierunku' and f.key = 'decision';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas' and s.key = 'okresl-kolejna-iteracje';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'saas' and p.key = 'saas-ulepsz-lub-zmien-kierunek-saas'
    and s.key = 'okresl-kolejna-iteracje' and f.key = 'note';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'mvp' and t.version = 1 and c.key = 'hardware';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke' and s.key = 'wyslij-pierwsza-serie-produktow-pvt';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke'
    and s.key = 'wyslij-pierwsza-serie-produktow-pvt' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke' and s.key = 'skontroluj-stan-przesylek-i-pakowanie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke'
    and s.key = 'skontroluj-stan-przesylek-i-pakowanie' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke' and s.key = 'zmierz-czas-unboxingu-i-pierwszego-uruchomienia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke'
    and s.key = 'zmierz-czas-unboxingu-i-pierwszego-uruchomienia' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke' and s.key = 'zweryfikuj-wydajnosc-obslugi-klienta';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke'
    and s.key = 'zweryfikuj-wydajnosc-obslugi-klienta' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu' and s.key = 'oblicz-wskaznik-awaryjnosci-rma';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu'
    and s.key = 'oblicz-wskaznik-awaryjnosci-rma' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu' and s.key = 'przeprowadz-wywiady-usterkowe-z-uzytkownikami';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu'
    and s.key = 'przeprowadz-wywiady-usterkowe-z-uzytkownikami' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu' and s.key = 'zmierz-poziom-satysfakcji-nps';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu'
    and s.key = 'zmierz-poziom-satysfakcji-nps' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu' and s.key = 'zaktualizuj-oprogramowanie-ukladowe-firmware';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu'
    and s.key = 'zaktualizuj-oprogramowanie-ukladowe-firmware' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej' and s.key = 'ustal-procedure-wymiany-wadliwych-sztuk';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej'
    and s.key = 'ustal-procedure-wymiany-wadliwych-sztuk' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej' and s.key = 'diagnozuj-przyczyny-awarii';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej'
    and s.key = 'diagnozuj-przyczyny-awarii' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej' and s.key = 'stworz-baze-wiedzy-dla-wsparcia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej'
    and s.key = 'stworz-baze-wiedzy-dla-wsparcia' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje' and s.key = 'sprawdz-dostepnosc-komponentow-u-dostawcow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje'
    and s.key = 'sprawdz-dostepnosc-komponentow-u-dostawcow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje' and s.key = 'renegocjuj-ceny-przy-wyzszym-wolumenie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje'
    and s.key = 'renegocjuj-ceny-przy-wyzszym-wolumenie' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje' and s.key = 'zamknij-liste-poprawek-w-projekcie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje'
    and s.key = 'zamknij-liste-poprawek-w-projekcie' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa' and s.key = 'zderz-rzeczywisty-koszt-jednostkowy-z-przychodem';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa'
    and s.key = 'zderz-rzeczywisty-koszt-jednostkowy-z-przychodem' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa' and s.key = 'uzyskaj-twarde-zamowienia-na-wiekszy-wolumen';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa'
    and s.key = 'uzyskaj-twarde-zamowienia-na-wiekszy-wolumen' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa' and s.key = 'podejmij-decyzje-o-zamowieniu-masowym';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'hardware' and p.key = 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa'
    and s.key = 'podejmij-decyzje-o-zamowieniu-masowym' and f.key = 'decision';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'mvp' and t.version = 1 and c.key = 'b2b';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania' and s.key = 'zrealizuj-podstawowe-funkcje-mvp';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania'
    and s.key = 'zrealizuj-podstawowe-funkcje-mvp' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania' and s.key = 'polacz-kluczowe-elementy-rozwiazania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania'
    and s.key = 'polacz-kluczowe-elementy-rozwiazania' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania' and s.key = 'udostepnij-mvp-do-testowania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbuduj-minimalna-wersje-rozwiazania'
    and s.key = 'udostepnij-mvp-do-testowania' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'okresl-grupe-badawcza';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'okresl-grupe-badawcza' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'ustal-okres-badania';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'ustal-okres-badania' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'udostepnij-mvp-uzytkownikom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'udostepnij-mvp-uzytkownikom' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami' and s.key = 'obserwuj-reakcje-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-rozpocznij-testowanie-z-uzytkownikami'
    and s.key = 'obserwuj-reakcje-uzytkownikow' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback' and s.key = 'zbieraj-opinie-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback'
    and s.key = 'zbieraj-opinie-uzytkownikow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback' and s.key = 'konsultuj-rozwiazanie-z-ekspertami';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback'
    and s.key = 'konsultuj-rozwiazanie-z-ekspertami' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback' and s.key = 'zbieraj-informacje-o-problemach';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback'
    and s.key = 'zbieraj-informacje-o-problemach' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback' and s.key = 'zbieraj-oczekiwania-uzytkownikow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-zbierz-feedback'
    and s.key = 'zbieraj-oczekiwania-uzytkownikow' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback' and s.key = 'ocen-poziom-zadowolenia';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback'
    and s.key = 'ocen-poziom-zadowolenia' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback' and s.key = 'przeanalizuj-zglaszane-problemy';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback'
    and s.key = 'przeanalizuj-zglaszane-problemy' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback' and s.key = 'przeanalizuj-potrzeby-dotyczace-funkcji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback'
    and s.key = 'przeanalizuj-potrzeby-dotyczace-funkcji' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback' and s.key = 'wyciagnij-najwazniejsze-wnioski';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-przeanalizuj-feedback'
    and s.key = 'wyciagnij-najwazniejsze-wnioski' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania' and s.key = 'ustal-najwazniejsze-poprawki';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania'
    and s.key = 'ustal-najwazniejsze-poprawki' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania' and s.key = 'zaplanuj-ulepszenie-mvp';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania'
    and s.key = 'zaplanuj-ulepszenie-mvp' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania' and s.key = 'rozwaz-zmiane-zalozen';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania'
    and s.key = 'rozwaz-zmiane-zalozen' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania' and s.key = 'podejmij-decyzje-o-dalszym-dzialaniu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-okresl-kierunek-dalszego-dzialania'
    and s.key = 'podejmij-decyzje-o-dalszym-dzialaniu' and f.key = 'decision';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie' and s.key = 'wprowadz-najwazniejsze-zmiany';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie'
    and s.key = 'wprowadz-najwazniejsze-zmiany' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie' and s.key = 'ponownie-udostepnij-rozwiazanie-uzytkownikom';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie'
    and s.key = 'ponownie-udostepnij-rozwiazanie-uzytkownikom' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie' and s.key = 'porownaj-wyniki-przed-i-po-zmianach';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie'
    and s.key = 'porownaj-wyniki-przed-i-po-zmianach' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie' and s.key = 'powtorz-proces-walidacji';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2b' and p.key = 'b2b-ponownie-przetestuj-rozwiazanie'
    and s.key = 'powtorz-proces-walidacji' and f.key = 'note';
update public.stage_categories c set translations = '{}'::jsonb
  from public.stage_templates t where c.template_id = t.id and t.key = 'mvp' and t.version = 1 and c.key = 'b2c';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje' and s.key = 'uruchom-platne-kampanie-akwizycyjne';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje'
    and s.key = 'uruchom-platne-kampanie-akwizycyjne' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje' and s.key = 'zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje'
    and s.key = 'zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje' and s.key = 'znajdz-i-usun-waskie-gardla';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje'
    and s.key = 'znajdz-i-usun-waskie-gardla' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje' and s.key = 'zoptymalizuj-kreacje-i-komunikaty';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje'
    and s.key = 'zoptymalizuj-kreacje-i-komunikaty' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention' and s.key = 'zmierz-poziom-powracalnosci-do-produktu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention'
    and s.key = 'zmierz-poziom-powracalnosci-do-produktu' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention' and s.key = 'przeanalizuj-aktywnosc-w-programie-polecen';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention'
    and s.key = 'przeanalizuj-aktywnosc-w-programie-polecen' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention' and s.key = 'zidentyfikuj-moment-kluczowej-wartosci';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention'
    and s.key = 'zidentyfikuj-moment-kluczowej-wartosci' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention' and s.key = 'zbadaj-powody-rezygnacji-churn';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention'
    and s.key = 'zbadaj-powody-rezygnacji-churn' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne' and s.key = 'zmierz-wskaznik-zwrotow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne'
    and s.key = 'zmierz-wskaznik-zwrotow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne' and s.key = 'uruchom-odzyskiwanie-porzuconych-koszykow';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne'
    and s.key = 'uruchom-odzyskiwanie-porzuconych-koszykow' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne' and s.key = 'dopilnuj-zgod-prawnych-i-rodo';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne'
    and s.key = 'dopilnuj-zgod-prawnych-i-rodo' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami' and s.key = 'porozmawiaj-z-placacymi-klientami';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami'
    and s.key = 'porozmawiaj-z-placacymi-klientami' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami' and s.key = 'zbierz-powody-braku-zakupu';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami'
    and s.key = 'zbierz-powody-braku-zakupu' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami' and s.key = 'pozyskaj-opinie-i-dowody-spoleczne';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami'
    and s.key = 'pozyskaj-opinie-i-dowody-spoleczne' and f.key = 'note';
update public.stage_points p set translations = '{}'::jsonb
  from public.stage_categories c, public.stage_templates t
  where p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok' and s.key = 'zestaw-koszt-pozyskania-cac-z-wartoscia-klienta-ltv';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok'
    and s.key = 'zestaw-koszt-pozyskania-cac-z-wartoscia-klienta-ltv' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok' and s.key = 'osiagnij-zalozony-cel-ilosciowy-mvp';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok'
    and s.key = 'osiagnij-zalozony-cel-ilosciowy-mvp' and f.key = 'note';
update public.stage_subpoints s set translations = '{}'::jsonb
  from public.stage_points p, public.stage_categories c, public.stage_templates t
  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and t.key = 'mvp' and t.version = 1
    and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok' and s.key = 'podejmij-decyzje-o-skalowaniu-lub-zmianie';
update public.stage_fields f set translations = '{}'::jsonb
  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t
  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id
    and t.key = 'mvp' and t.version = 1 and c.key = 'b2c' and p.key = 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok'
    and s.key = 'podejmij-decyzje-o-skalowaniu-lub-zmianie' and f.key = 'decision';

commit;
