(function () {
var WA = 'https://wa.me/34624309985';
var LANG = (document.documentElement.getAttribute('lang') || '').slice(0, 2);
var UK = LANG === 'uk';
var ES = LANG === 'es', EN = LANG === 'en';
(function () {
var box = document.querySelector('[data-deadline]');
if (!box) return;
var target = new Date(box.getAttribute('data-deadline') + 'T00:00:00');
if (isNaN(target)) return;
var out = box.querySelector('[data-deadline-count]');
if (!out) return;
var days = Math.ceil((target - new Date()) / 86400000);
if (days <= 0) return;
if (ES || EN) {
out.textContent = ES ? (days === 1 ? 'queda 1 día' : 'quedan ' + days + ' días')
: (days === 1 ? '1 day left' : days + ' days left');
out.hidden = false;
return;
}
var n = days % 100, n10 = days % 10, word = UK ? 'днів' : 'дней', one = false;
if (n < 11 || n > 14) {
if (n10 === 1) { word = 'день'; one = true; }
else if (n10 >= 2 && n10 <= 4) word = UK ? 'дні' : 'дня';
}
out.textContent = (UK ? (one ? 'залишився ' : 'залишилося ') : 'осталось ') + days + ' ' + word;
out.hidden = false;
})();
var thread = document.getElementById('rfinder-thread');
if (!thread) return;
var section = document.getElementById('route-finder');
if (section) section.hidden = false;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var QUESTIONS = [
{
key: 'years',
ask: 'Давайте разберёмся за три вопроса. Сколько вы живёте в Испании?',
opts: [
{ v: 'lt2', t: 'Меньше 2 лет' },
{ v: '2to3', t: '2–3 года' },
{ v: '3to5', t: '3–5 лет' },
{ v: 'gt5', t: '5 лет и больше' },
],
},
{
key: 'work',
ask: 'Понял. Работаете официально — по контракту или как autónomo?',
opts: [
{ v: 'gt1y', t: 'Да, больше года' },
{ v: 'lt1y', t: 'Да, меньше года' },
{ v: 'no', t: 'Нет' },
],
},
{
key: 'family',
ask: 'Последний вопрос: есть ли у вас семья в Испании?',
opts: [
{ v: 'eu', t: 'Супруг(а) — гражданин Испании или ЕС' },
{ v: 'relatives', t: 'Близкие родственники с ВНЖ' },
{ v: 'kids', t: 'Дети живут со мной' },
{ v: 'no', t: 'Нет' },
],
},
];
var ROUTES = {
eu: {
name: 'ВНЖ члена семьи гражданина Испании или ЕС',
why: 'Супруг(а) с гражданством Испании или другой страны ЕС даёт право на отдельный режим: карта на пять лет, право работать сразу и мягкие требования.',
alt: ['Проверим, не выгоднее ли параллельно larga duración, если стаж уже большой'],
},
larga: {
name: 'Larga duración — долгосрочная резиденция',
why: 'Пять лет проживания открывают долгосрочный статус, и время на временной защите засчитывается полностью. Через защиту пять лет наберутся не раньше марта 2027 года: считаем от даты решения о защите. Это самый устойчивый статус из доступных: разрешение бессрочное, карта выдаётся на пять лет, жить и работать — на тех же условиях, что граждане Испании.',
alt: ['Если работаете официально — модификация статуса на четыре года доступна уже сейчас, не дожидаясь пяти лет', 'Если по стажу что-то не сойдётся — запасной маршрут arraigo', 'После larga duración начинает считаться срок до гражданства'],
},
mod191: {
name: 'Модификация статуса (ст. 191)',
why: 'Если вы больше года в Испании по разрешению с правом на работу — временная защита его даёт — и работаете официально (обычно нужно не меньше трёх месяцев работы в год и действующий контракт), это выгодный переход: разрешение выдают сразу на четыре года, а по arraigo sociolaboral, social и socioformativo — на год. Если года ещё нет, разрешение будет на год, а требования строже — иногда выгоднее дождаться года. Ждать окончания временной защиты не нужно.',
alt: ['Arraigo sociolaboral — если по модификации чего-то не хватит и вы в Испании от двух лет', 'При пяти годах стажа стоит сравнить с larga duración'],
},
social: {
name: 'Arraigo social',
why: 'Два года в Испании плюс родственные связи с резидентами дают маршрут без требования действующего контракта. Второй путь внутри него — отчёт об интеграции от автономного сообщества.',
alt: ['Arraigo socioformativo — через обучение', 'Три месяца официальной работы откроют модификацию статуса на четыре года'],
},
socioformativo: {
name: 'Arraigo socioformativo',
why: 'Маршрут для тех, у кого нет официальной работы: зачисление на профессиональное обучение даёт основание для ВНЖ. Работать по нему можно после выдачи разрешения — до 30 часов в неделю.',
alt: ['Arraigo social — если найдутся родственники с ВНЖ или будет отчёт об интеграции', 'Дети в Испании открывают отдельные семейные маршруты'],
},
kids: {
name: 'Семейный маршрут через детей',
why: 'Дети в Испании открывают собственные основания: у ребёнка свой путь к ВНЖ, а рождённый в Испании может получить разрешение сразу на пять лет. Часто это оказывается быстрее, чем маршрут родителя.',
alt: ['Arraigo social или socioformativo — параллельно для взрослых'],
},
wait: {
name: 'Подготовка к arraigo и продление защиты',
why: 'Основные маршруты открываются от двух лет проживания. Пока стаж набирается, задача другая: держать прописку непрерывной и заранее получить украинские справки — именно они идут дольше всего и чаще всего срывают сроки.',
alt: ['Год в Испании и три месяца официальной работы откроют модификацию статуса — без ожидания двух лет', 'Проверим семейные основания — они от стажа не зависят'],
},
};
var LABELS = {
years: { lt2: 'меньше 2 лет в Испании', '2to3': '2–3 года в Испании', '3to5': '3–5 лет в Испании', gt5: '5 лет и больше в Испании' },
work: { gt1y: 'официальная работа больше года', lt1y: 'официальная работа меньше года', no: 'без официальной работы' },
family: { eu: 'супруг(а) — гражданин Испании или ЕС', relatives: 'близкие родственники с ВНЖ', kids: 'дети живут со мной', no: 'без семьи в Испании' },
};
if (UK) {
QUESTIONS = [
{ key: 'years', ask: 'Розберімося за три запитання. Скільки ви живете в Іспанії?',
opts: [{ v: 'lt2', t: 'Менше 2 років' }, { v: '2to3', t: '2–3 роки' },
{ v: '3to5', t: '3–5 років' }, { v: 'gt5', t: '5 років і більше' }] },
{ key: 'work', ask: 'Зрозумів. Працюєте офіційно — за контрактом чи як autónomo?',
opts: [{ v: 'gt1y', t: 'Так, понад рік' }, { v: 'lt1y', t: 'Так, менше року' }, { v: 'no', t: 'Ні' }] },
{ key: 'family', ask: 'Останнє запитання: чи є у вас сім’я в Іспанії?',
opts: [{ v: 'eu', t: 'Чоловік або дружина — громадянин Іспанії чи ЄС' },
{ v: 'relatives', t: 'Близькі родичі з посвідкою на проживання' },
{ v: 'kids', t: 'Діти живуть зі мною' }, { v: 'no', t: 'Ні' }] },
];
ROUTES = {
eu: {
name: 'Посвідка члена сім’ї громадянина Іспанії чи ЄС',
why: 'Чоловік або дружина з громадянством Іспанії чи іншої країни ЄС дає право на окремий режим: картка на п’ять років, право працювати одразу та м’які вимоги.',
alt: ['Перевіримо, чи не вигідніше паралельно larga duración, якщо стаж уже великий'],
},
larga: {
name: 'Larga duración — довгострокове резидентство',
why: 'П’ять років проживання відкривають довгостроковий статус, і час на тимчасовому захисті зараховується повністю. Через захист п’ять років набереться не раніше березня 2027 року: рахуємо від дати рішення про захист. Це найстійкіший статус із доступних: дозвіл безстроковий, картка видається на п’ять років, жити й працювати — на тих самих умовах, що й громадяни Іспанії.',
alt: ['Якщо працюєте офіційно — модифікація статусу на чотири роки доступна вже зараз, не чекаючи п’яти років', 'Якщо за стажем щось не зійдеться — запасний маршрут arraigo', 'Після larga duración починає рахуватися строк до громадянства'],
},
mod191: {
name: 'Модифікація статусу (ст. 191)',
why: 'Якщо ви понад рік в Іспанії за дозволом із правом на роботу — тимчасовий захист його дає — і працюєте офіційно (зазвичай потрібно щонайменше три місяці роботи на рік і чинний контракт), це вигідний перехід: дозвіл видають одразу на чотири роки, а за arraigo sociolaboral, social і socioformativo — на рік. Якщо року ще немає, дозвіл буде на рік, а вимоги суворіші — іноді вигідніше дочекатися року. Чекати закінчення тимчасового захисту не потрібно.',
alt: ['Arraigo sociolaboral — якщо для модифікації чогось бракуватиме й ви в Іспанії від двох років', 'За п’яти років стажу варто порівняти з larga duración'],
},
social: {
name: 'Arraigo social',
why: 'Два роки в Іспанії плюс родинні зв’язки з резидентами дають маршрут без вимоги чинного контракту. Другий шлях усередині нього — звіт про інтеграцію від автономної спільноти.',
alt: ['Arraigo socioformativo — через навчання', 'Три місяці офіційної роботи відкриють модифікацію статусу на чотири роки'],
},
socioformativo: {
name: 'Arraigo socioformativo',
why: 'Маршрут для тих, у кого немає офіційної роботи: зарахування на професійне навчання дає підставу для посвідки на проживання. Працювати за нею можна після видачі дозволу — до 30 годин на тиждень.',
alt: ['Arraigo social — якщо знайдуться родичі з посвідкою на проживання або буде звіт про інтеграцію', 'Діти в Іспанії відкривають окремі сімейні маршрути'],
},
kids: {
name: 'Сімейний маршрут через дітей',
why: 'Діти в Іспанії відкривають власні підстави: у дитини свій шлях до посвідки на проживання, а народжена в Іспанії може отримати дозвіл одразу на п’ять років. Часто це виявляється швидше, ніж маршрут батьків.',
alt: ['Arraigo social або socioformativo — паралельно для дорослих'],
},
wait: {
name: 'Підготовка до arraigo і продовження захисту',
why: 'Основні маршрути відкриваються від двох років проживання. Поки стаж набирається, завдання інше: тримати падрон безперервним і заздалегідь отримати українські довідки — саме вони йдуть найдовше і найчастіше зривають строки.',
alt: ['Рік в Іспанії та три місяці офіційної роботи відкриють модифікацію статусу — без очікування двох років', 'Перевіримо сімейні підстави — вони від стажу не залежать'],
},
};
LABELS = {
years: { lt2: 'менше 2 років в Іспанії', '2to3': '2–3 роки в Іспанії', '3to5': '3–5 років в Іспанії', gt5: '5 років і більше в Іспанії' },
work: { gt1y: 'офіційна робота понад рік', lt1y: 'офіційна робота менше року', no: 'без офіційної роботи' },
family: { eu: 'чоловік або дружина — громадянин Іспанії чи ЄС', relatives: 'близькі родичі з посвідкою на проживання', kids: 'діти живуть зі мною', no: 'без сім’ї в Іспанії' },
};
}
if (ES) {
QUESTIONS = [
{ key: 'years', ask: 'Vamos a verlo en tres preguntas. ¿Cuánto tiempo lleva viviendo en España?',
opts: [{ v: 'lt2', t: 'Menos de 2 años' }, { v: '2to3', t: '2–3 años' },
{ v: '3to5', t: '3–5 años' }, { v: 'gt5', t: '5 años o más' }] },
{ key: 'work', ask: 'Entendido. ¿Trabaja legalmente, con contrato o como autónomo?',
opts: [{ v: 'gt1y', t: 'Sí, más de un año' }, { v: 'lt1y', t: 'Sí, menos de un año' }, { v: 'no', t: 'No' }] },
{ key: 'family', ask: 'Última pregunta: ¿tiene familia en España?',
opts: [{ v: 'eu', t: 'Cónyuge con nacionalidad española o de la UE' },
{ v: 'relatives', t: 'Familiares cercanos con autorización de residencia' },
{ v: 'kids', t: 'Mis hijos viven conmigo' }, { v: 'no', t: 'No' }] },
];
ROUTES = {
eu: {
name: 'Residencia de familiar de ciudadano español o de la UE',
why: 'Si su cónyuge tiene la nacionalidad española o de otro país de la UE, usted tiene acceso a un régimen propio: tarjeta por cinco años, derecho a trabajar desde el primer momento y requisitos más flexibles.',
alt: ['Comprobaremos si le conviene más tramitar en paralelo la larga duración, si ya lleva mucho tiempo en España'],
},
larga: {
name: 'Larga duración: residencia de larga duración',
why: 'Cinco años de residencia dan acceso al estatus de larga duración, y el tiempo con protección temporal cuenta íntegramente. Con la protección, los cinco años no se cumplen antes de marzo de 2027: se cuentan desde la fecha de la resolución de protección. Es el estatus más estable de los disponibles: la autorización es indefinida, la tarjeta se expide por cinco años y se vive y trabaja en las mismas condiciones que los ciudadanos españoles.',
alt: ['Si trabaja legalmente, la modificación a una autorización de cuatro años está a su alcance ya, sin esperar a los cinco años', 'Si algo no cuadra con el tiempo de residencia, la vía de reserva es el arraigo', 'Tras la larga duración empieza a contar el plazo para la nacionalidad'],
},
mod191: {
name: 'Modificación a residencia y trabajo (art. 191)',
why: 'Si lleva más de un año en España con una autorización que permite trabajar (la protección temporal la da) y trabaja legalmente (normalmente se piden al menos tres meses de trabajo al año y un contrato en vigor), es un cambio ventajoso: la autorización se concede directamente por cuatro años, mientras que por arraigo sociolaboral, social y socioformativo es por un año. Si aún no ha cumplido el año, la autorización será por un año y los requisitos son más estrictos: a veces conviene esperar a cumplirlo. No hace falta esperar a que termine la protección temporal.',
alt: ['Arraigo sociolaboral, si para la modificación falta algún requisito y lleva al menos dos años en España', 'Con cinco años de residencia conviene compararla con la larga duración'],
},
social: {
name: 'Arraigo social',
why: 'Dos años en España y vínculos familiares con residentes abren una vía que no exige contrato en vigor. La segunda opción dentro de esta vía es el informe de integración de la comunidad autónoma.',
alt: ['Arraigo socioformativo, a través de la formación', 'Tres meses de trabajo legal le abrirán la modificación a una autorización de cuatro años'],
},
socioformativo: {
name: 'Arraigo socioformativo',
why: 'Es la vía para quien no tiene trabajo legal: la matrícula en una formación profesional da derecho a solicitar la autorización de residencia. Con ella se puede trabajar una vez concedida, hasta 30 horas a la semana.',
alt: ['Arraigo social, si tiene familiares con autorización de residencia o consigue el informe de integración', 'Los hijos en España abren vías familiares propias'],
},
kids: {
name: 'Vía familiar a través de los hijos',
why: 'Los hijos en España abren sus propias vías: el menor tiene su propio camino a la residencia y, si ha nacido en España, puede obtener la autorización directamente por cinco años. A menudo resulta más rápido que la vía del padre o la madre.',
alt: ['Arraigo social o socioformativo, en paralelo para los adultos'],
},
wait: {
name: 'Preparación del arraigo y prórroga de la protección',
why: 'Las vías principales se abren a partir de dos años de residencia. Mientras se acumula ese tiempo, la tarea es otra: mantener el empadronamiento sin interrupciones y pedir con antelación los certificados de Ucrania, que son los que más tardan y los que más a menudo hacen perder plazos.',
alt: ['Un año en España y tres meses de trabajo legal le abrirán la modificación de estatus, sin esperar a los dos años', 'Comprobaremos las vías familiares, que no dependen del tiempo de residencia'],
},
};
LABELS = {
years: { lt2: 'menos de 2 años en España', '2to3': '2–3 años en España', '3to5': '3–5 años en España', gt5: '5 años o más en España' },
work: { gt1y: 'trabajo legal desde hace más de un año', lt1y: 'trabajo legal desde hace menos de un año', no: 'sin trabajo legal' },
family: { eu: 'cónyuge con nacionalidad española o de la UE', relatives: 'familiares cercanos con autorización de residencia', kids: 'mis hijos viven conmigo', no: 'sin familia en España' },
};
} else if (EN) {
QUESTIONS = [
{ key: 'years', ask: 'Let’s work it out in three questions. How long have you lived in Spain?',
opts: [{ v: 'lt2', t: 'Less than 2 years' }, { v: '2to3', t: '2–3 years' },
{ v: '3to5', t: '3–5 years' }, { v: 'gt5', t: '5 years or more' }] },
{ key: 'work', ask: 'Got it. Do you work legally, on a contract or as an autónomo?',
opts: [{ v: 'gt1y', t: 'Yes, for more than a year' }, { v: 'lt1y', t: 'Yes, for less than a year' }, { v: 'no', t: 'No' }] },
{ key: 'family', ask: 'Last question: do you have family in Spain?',
opts: [{ v: 'eu', t: 'Spouse who is a Spanish or EU citizen' },
{ v: 'relatives', t: 'Close relatives with a residence permit' },
{ v: 'kids', t: 'My children live with me' }, { v: 'no', t: 'No' }] },
];
ROUTES = {
eu: {
name: 'Residence as a family member of a Spanish or EU citizen',
why: 'A spouse with Spanish or other EU citizenship gives you access to a separate scheme: a five-year card, the right to work straight away and lighter requirements.',
alt: ['We will check whether larga duración in parallel would suit you better, if you have already lived here a long time'],
},
larga: {
name: 'Larga duración — long-term residence',
why: 'Five years of residence open up long-term status, and time under temporary protection counts in full. Through protection, five years will not be reached before March 2027: we count from the date of the protection decision. It is the most stable status available: the permit has no end date, the card is issued for five years, and you live and work on the same terms as Spanish citizens.',
alt: ['If you work legally, the change of status to a four-year permit is available now, without waiting for five years', 'If something does not add up on your residence time, arraigo is the fallback route', 'After larga duración, the time towards citizenship starts counting'],
},
mod191: {
name: 'Change to residence and work (art. 191)',
why: 'If you have been in Spain for more than a year on a permit that allows you to work — temporary protection does — and you work legally (usually at least three months of work a year and a current contract are needed), this is a worthwhile switch: the permit is issued straight away for four years, whereas arraigo sociolaboral, social and socioformativo give one year. If you have not reached the year yet, the permit will be for one year and the requirements are stricter — sometimes it is better to wait until you do. There is no need to wait for temporary protection to end.',
alt: ['Arraigo sociolaboral — if something is missing for the change of status and you have been in Spain for at least two years', 'With five years of residence, it is worth comparing it with larga duración'],
},
social: {
name: 'Arraigo social',
why: 'Two years in Spain plus family ties with residents give you a route that does not require a current contract. The second path within it is an integration report from the autonomous community.',
alt: ['Arraigo socioformativo — through training', 'Three months of legal work will open up the change of status to a four-year permit'],
},
socioformativo: {
name: 'Arraigo socioformativo',
why: 'A route for those without legal employment: enrolling in vocational training gives grounds for a residence permit. Once the permit is granted, you can work under it up to 30 hours a week.',
alt: ['Arraigo social — if you have relatives with a residence permit or obtain an integration report', 'Children in Spain open up separate family routes'],
},
kids: {
name: 'Family route through your children',
why: 'Children in Spain open up their own grounds: a child has their own path to residence, and a child born in Spain can get a permit straight away for five years. This often turns out faster than the parent’s own route.',
alt: ['Arraigo social or socioformativo — in parallel for the adults'],
},
wait: {
name: 'Preparing for arraigo and extending protection',
why: 'The main routes open after two years of residence. While you build up that time, the task is different: keep your municipal registration (empadronamiento) continuous and get your Ukrainian certificates in advance — they take the longest and most often cause missed deadlines.',
alt: ['A year in Spain and three months of legal work will open up the change of status — without waiting two years', 'We will check family grounds — they do not depend on how long you have lived here'],
},
};
LABELS = {
years: { lt2: 'less than 2 years in Spain', '2to3': '2–3 years in Spain', '3to5': '3–5 years in Spain', gt5: '5 years or more in Spain' },
work: { gt1y: 'legally employed for more than a year', lt1y: 'legally employed for less than a year', no: 'not legally employed' },
family: { eu: 'spouse is a Spanish or EU citizen', relatives: 'close relatives with a residence permit', kids: 'my children live with me', no: 'no family in Spain' },
};
}
var TXT = ES ? {
hello: 'Hola. Quiero pasar de la protección temporal a una autorización de residencia.\n',
situation: 'Mi situación: ',
found: 'En la web me ha salido esta vía: ',
ask: '. ¿Me podrían decir si es la adecuada para mí?',
marker: ' Vengo de krepko.es',
label: 'Lo más probable es que le convenga',
cta: 'Continuar en WhatsApp',
restart: 'Responder de nuevo',
disclaimer: 'La selección es orientativa: no tiene en cuenta los detalles de su historia, como el empadronamiento, las interrupciones del estatus o los documentos. Le indicamos la vía exacta después de estudiar su caso; el estudio es gratuito.',
} : EN ? {
hello: 'Hello. I want to switch from temporary protection to a residence permit.\n',
situation: 'My situation: ',
found: 'The website suggested this route: ',
ask: '. Could you tell me whether it suits me?',
marker: " I'm writing from krepko.es",
label: 'Most likely to suit you',
cta: 'Continue on WhatsApp',
restart: 'Start again',
disclaimer: 'This is a rough match: it does not take into account the details of your history — municipal registration, gaps in your status, documents. We name the exact route after reviewing your case, and the review is free.',
} : UK ? {
hello: 'Добрий день! Хочу перейти з тимчасового захисту на посвідку на проживання.\n',
situation: 'Моя ситуація: ',
found: 'На сайті підібрався маршрут: ',
ask: '. Підкажіть, чи підходить він мені?',
marker: ' Я з krepko.es',
label: 'Найімовірніше, вам підійде',
cta: 'Продовжити у WhatsApp',
restart: 'Відповісти заново',
disclaimer: 'Підбір орієнтовний: він не враховує деталей вашої історії — падрону, перерв у статусі, документів. Точний маршрут називаємо після розбору, він безкоштовний.',
} : {
hello: 'Здравствуйте! Хочу выйти с временной защиты на ВНЖ.\n',
situation: 'Моя ситуация: ',
found: 'На сайте подобрался маршрут: ',
ask: '. Подскажите, подходит ли он мне?',
marker: ' Я с krepko.es',
label: 'Скорее всего вам подойдёт',
cta: 'Продолжить в WhatsApp',
restart: 'Ответить заново',
disclaimer: 'Подбор ориентировочный: он не учитывает деталей вашей истории — прописки, перерывов в статусе, документов. Точный маршрут называем после разбора, он бесплатный.',
};
function pick(v) {
if (v.family === 'eu') return 'eu';
if (v.years === 'gt5') return 'larga';
if (v.work !== 'no') return 'mod191';
var hasStaz = v.years === '2to3' || v.years === '3to5';
if (hasStaz) {
if (v.family === 'relatives') return 'social';
if (v.family === 'kids') return 'kids';
return 'socioformativo';
}
if (v.family === 'kids') return 'kids';
return 'wait';
}
function el(tag, cls, html) {
var e = document.createElement(tag);
if (cls) e.className = cls;
if (html != null) e.innerHTML = html;
return e;
}
var answers = {}, step = 0;
function afterTyping(delay, done) {
if (reduce) { done(); return; }
var typing = el('div', 'rfinder__typing rfinder__in',
'<span class="rfinder__ava" aria-hidden="true">K</span>' +
'<span class="rfinder__dots"><i></i><i></i><i></i></span>');
thread.appendChild(typing);
setTimeout(function () { typing.remove(); done(); }, delay);
}
function ask(i) {
var q = QUESTIONS[i];
afterTyping(i === 0 ? 350 : 650, function () {
var row = el('div', 'rfinder__ask rfinder__in',
'<span class="rfinder__ava" aria-hidden="true">K</span>' +
'<div class="rfinder__bubble">' + q.ask + '</div>');
thread.appendChild(row);
var opts = el('div', 'rfinder__opts rfinder__in');
q.opts.forEach(function (o, idx) {
var b = el('button', 'rfinder__opt', o.t);
b.type = 'button';
var lonely = idx === q.opts.length - 1 && q.opts.length % 2 === 1;
if (o.t.length > 20 || lonely) b.classList.add('rfinder__opt--wide');
b.addEventListener('click', function () {
answers[q.key] = o.v;
opts.remove();
thread.appendChild(el('div', 'rfinder__said rfinder__in', '<span>' + o.t + '</span>'));
step++;
if (step < QUESTIONS.length) ask(step);
else finish();
});
opts.appendChild(b);
});
thread.appendChild(opts);
});
}
function finish() {
afterTyping(850, function () {
var r = ROUTES[pick(answers)];
var alt = r.alt.map(function (a) { return '<li>' + a + '</li>'; }).join('');
var msg = TXT.hello
+ TXT.situation + LABELS.years[answers.years] + ', ' + LABELS.work[answers.work] + ', ' + LABELS.family[answers.family] + '.\n'
+ TXT.found + r.name + TXT.ask
+ TXT.marker + (location.pathname || '/');
var box = el('div', 'rfinder__ask rfinder__ask--res rfinder__in',
'<span class="rfinder__ava" aria-hidden="true">K</span>' +
'<div class="rfinder__res">' +
'<span class="rfinder__res-label">' + TXT.label + '</span>' +
'<h3 class="rfinder__route">' + r.name + '</h3>' +
'<p class="rfinder__why">' + r.why + '</p>' +
'<ul class="rfinder__alt">' + alt + '</ul>' +
'<div class="rfinder__foot">' +
'<a class="rfinder__cta" href="' + WA + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' +
'<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>' +
TXT.cta + '</a>' +
'<button type="button" class="rfinder__restart">' + TXT.restart + '</button>' +
'</div>' +
'</div>');
thread.appendChild(box);
thread.appendChild(el('p', 'rfinder__disclaimer', TXT.disclaimer));
try { document.dispatchEvent(new Event('krepko:wa-buttons')); } catch (e) {}
box.querySelector('.rfinder__restart').addEventListener('click', function () {
thread.innerHTML = '';
try { document.dispatchEvent(new Event('krepko:wa-buttons')); } catch (e) {}
answers = {};
step = 0;
ask(0);
});
});
}
ask(0);
})();
